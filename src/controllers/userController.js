/* src/controllers/userController.js - controlle */
const db = require('../config/db');
const bcrypt = require('bcryptjs');



exports.getAllUsers = async (req, res) => {
    try {
        const sql = `SELECT u.id, u.name, u.email, u.cpf, u.phone, u.address, u.role, u.course_end_date,
            GROUP_CONCAT(uc.course) AS courses
            FROM users u
            LEFT JOIN user_courses uc ON u.id = uc.user_id
            GROUP BY u.id`;

        const [rows] = await db.execute(sql);
        
        const users = rows.map(r => ({
            ...r,
            courses: r.courses ? r.courses.split(',') : []
        }));

        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const sql = `SELECT u.id, u.name, u.email, u.cpf, u.phone, u.address, u.role, u.course_end_date,
            GROUP_CONCAT(uc.course) AS courses
            FROM users u
            LEFT JOIN user_courses uc ON u.id = uc.user_id
            WHERE u.id = ?
            GROUP BY u.id`;

        const [rows] = await db.execute(sql, [req.params.id]);

        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = rows[0];
        user.courses = user.courses ? user.courses.split(',') : [];

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getStudents = async (req, res) => {
    try {
        const [rows] = await db.execute("SELECT id, name FROM users WHERE role = 'student' ORDER BY name");
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { name, cpf, phone, email, address, role, courses, course_end_date, password } = req.body;

        if (!name || !email || !role) {
            return res.status(400).json({ message: 'Missing required fields: name, email, role' });
        }

        
        const [existingByEmail] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existingByEmail && existingByEmail.length > 0) {
            return res.status(409).json({ message: 'Email already in use' });
        }

        if (cpf) {
            const [existingByCpf] = await db.execute('SELECT id FROM users WHERE cpf = ?', [cpf]);
            if (existingByCpf && existingByCpf.length > 0) {
                return res.status(409).json({ message: 'CPF já cadastrado' });
            }
        }

        
        const rawPwd = password && password.trim() !== '' ? password : 'senai@2025';
        const hashed = await bcrypt.hash(rawPwd, 10);

        const insertSql = `INSERT INTO users (name, email, password, role, cpf, phone, address, course_end_date, must_change_password)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const [{ insertId }] = await db.execute(insertSql, [name, email, hashed, role, cpf || null, phone || null, address || null, course_end_date || null, 1]);

        
        let courseArray = [];
        if (Array.isArray(courses)) courseArray = courses;
        else if (typeof courses === 'string' && courses.trim() !== '') courseArray = courses.split(',').map(c => c.trim()).filter(Boolean);

        for (const c of courseArray) {
            await db.execute('INSERT INTO user_courses (user_id, course) VALUES (?, ?)', [insertId, c]);
        }

        res.status(201).json({ message: 'User created', id: insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { name, cpf, phone, email, address, role, courses, course_end_date, password } = req.body;

        
        if (!name || !email || !role) {
            return res.status(400).json({ message: 'Missing required fields: name, email, role' });
        }

        
        const [emailRow] = await db.execute('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.params.id]);
        if (emailRow && emailRow.length > 0) return res.status(409).json({ message: 'Email already in use by another user' });

        if (cpf) {
            const [cpfRow] = await db.execute('SELECT id FROM users WHERE cpf = ? AND id != ?', [cpf, req.params.id]);
            if (cpfRow && cpfRow.length > 0) return res.status(409).json({ message: 'CPF já cadastrado por outro usuário' });
        }

        
        const fields = ['name = ?', 'email = ?', 'role = ?', 'cpf = ?', 'phone = ?', 'address = ?', 'course_end_date = ?'];
        const params = [name, email, role, cpf || null, phone || null, address || null, course_end_date || null];

        if (password && password.trim() !== '') {
            const hashedPwd = await bcrypt.hash(password, 10);
            fields.push('password = ?');
            params.push(hashedPwd);
            
            fields.push('must_change_password = ?');
            params.push(0);
        }

        const updateSql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
        params.push(req.params.id);
        await db.execute(updateSql, params);

        
        await db.execute('DELETE FROM user_courses WHERE user_id = ?', [req.params.id]);

        let courseArray = [];
        if (Array.isArray(courses)) courseArray = courses;
        else if (typeof courses === 'string' && courses.trim() !== '') courseArray = courses.split(',').map(c => c.trim()).filter(Boolean);

        for (const c of courseArray) {
            await db.execute('INSERT INTO user_courses (user_id, course) VALUES (?, ?)', [req.params.id, c]);
        }

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        await db.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ message: 'User deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { newPassword, oldPassword } = req.body;
        if (!newPassword || newPassword.trim() === '') return res.status(400).json({ message: 'New password required' });

        
        if (req.userRole !== 'admin') {
            if (!oldPassword || oldPassword.trim() === '') return res.status(400).json({ message: 'Old password required' });

            const [rows] = await db.execute('SELECT password FROM users WHERE id = ?', [req.params.id]);
            const userRow = rows[0];
            if (!userRow) return res.status(404).json({ message: 'User not found' });

            
            let match = false;
            if (userRow.password === 'hashed_secret' && (oldPassword === '123456' || oldPassword === 'hashed_secret')) {
                match = true;
            } else {
                match = await bcrypt.compare(oldPassword, userRow.password);
            }
            if (!match) return res.status(401).json({ message: 'Old password is incorrect' });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await db.execute('UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?', [hashed, req.params.id]);

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
