/* src/models/userModel.js - Data model / DB helpers */
const db = require('../config/db');

class User {
    static async findByEmail(email) {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
        return rows[0];
    }

    static async findByCpf(cpf) {
        const [rows] = await db.execute('SELECT * FROM users WHERE cpf = ?', [cpf]);
        return rows[0];
    }

    static async create(userData) {
        const { name, email, password, role, cpf } = userData;
        const [result] = await db.execute(
            'INSERT INTO users (name, email, password, role, cpf) VALUES (?, ?, ?, ?, ?)',
            [name, email, password, role, cpf]
        );
        return result.insertId;
    }
}

module.exports = User;
