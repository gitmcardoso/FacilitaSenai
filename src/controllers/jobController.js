/* src/controllers/jobController.js - Server controller */
const db = require('../config/db');
const Job = require('../models/jobModel');
const User = require('../models/userModel');


exports.getJobs = async (req, res) => {
    try {
        const jobs = await Job.findAll();
        res.json(jobs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.getJobById = async (req, res) => {
    try {
        const { id } = req.params;
        const job = await Job.findById(id);

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        res.json(job);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.createJob = async (req, res) => {
    try {
        const { title, company, position, schedule, address, salary, description, requirements, type } = req.body;
        const created_by = req.userId;

        if (!title || !company || !description || !type) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        if (!['estagio', 'emprego', 'jovem_aprendiz'].includes(type)) {
            return res.status(400).json({ message: 'Invalid job type' });
        }

        const jobId = await Job.create({
            title,
            company,
            position: position || null,
            schedule: schedule || null,
            address: address || null,
            salary: salary || null,
            description,
            requirements: requirements || '',
            type,
            created_by
        });

        res.status(201).json({
            message: 'Job created successfully',
            jobId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.indicateStudent = async (req, res) => {
    try {
        const { id: jobId } = req.params;
        const { email, cpf } = req.body;
        const indicated_by = req.userId;

        
        if (!email && !cpf) {
            return res.status(400).json({ message: 'Please provide student email or CPF' });
        }

        
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        
        let student;
        if (email) {
            student = await User.findByEmail(email);
        } else {
            student = await User.findByCpf(cpf);
        }

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        
        if (student.role !== 'student') {
            return res.status(400).json({ message: 'User is not a student' });
        }

        
        const [existing] = await db.execute(
            'SELECT * FROM job_applications WHERE job_id = ? AND student_id = ?',
            [jobId, student.id]
        );

        if (existing.length > 0) {
            return res.status(409).json({ message: 'Student already has an application for this job' });
        }

        
        await db.execute(
            'INSERT INTO job_applications (job_id, student_id, indicated_by, status) VALUES (?, ?, ?, ?)',
            [jobId, student.id, indicated_by, 'indicated']
        );

        
        try {
            const Notification = require('../models/notificationModel');
            const title = `Você foi indicado para a vaga: ${job.title}`;
            const message = `O professor indicou você para a vaga "${job.title}" na empresa ${job.company}. Verifique na aba Vagas.`;
            await Notification.create(student.id, title, message, null);
        } catch (e) { console.error('Error creating notification for indicated student', e); }

        res.status(201).json({
            message: 'Student indicated successfully',
            student: {
                id: student.id,
                name: student.name,
                email: student.email
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.getApplications = async (req, res) => {
    try {
        const { id } = req.params;
        const applications = await Job.getApplications(id);
        res.json(applications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.getMyApplications = async (req, res) => {
    try {
        const student_id = req.userId;

        const [rows] = await db.execute(`
            SELECT ja.*, j.title, j.company, j.description, j.type,
                   i.name as indicated_by_name
            FROM job_applications ja
            JOIN jobs j ON ja.job_id = j.id
            LEFT JOIN users i ON ja.indicated_by = i.id
            WHERE ja.student_id = ?
            ORDER BY ja.applied_at DESC
        `, [student_id]);

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.getAllApplications = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT ja.*, j.title, j.company, j.type, s.name as student_name, s.email as student_email, i.name as indicated_by_name
            FROM job_applications ja
            JOIN jobs j ON ja.job_id = j.id
            JOIN users s ON ja.student_id = s.id
            LEFT JOIN users i ON ja.indicated_by = i.id
            ORDER BY ja.applied_at DESC
            LIMIT 100
        `);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.applyToJob = async (req, res) => {
    try {
        const { id: jobId } = req.params;
        const student_id = req.userId;
        const { message, cv } = req.body || {};

        
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        
        const [existing] = await db.execute(
            'SELECT * FROM job_applications WHERE job_id = ? AND student_id = ?',
            [jobId, student_id]
        );

        if (existing.length > 0) {
            return res.status(409).json({ message: 'You already applied to this job' });
        }

        
        await db.execute(
            'INSERT INTO job_applications (job_id, student_id, status, message, cv) VALUES (?, ?, ?, ?, ?)',
            [jobId, student_id, 'applied', message || null, cv || null]
        );

        
        try {
            const [creatorRows] = await db.execute('SELECT created_by FROM jobs WHERE id = ?', [jobId]);
            if (creatorRows && creatorRows.length > 0) {
                const createdBy = creatorRows[0].created_by;
                if (createdBy && createdBy !== student_id) {
                    const Notification = require('../models/notificationModel');
                    const title = `Nova candidatura para: ${job.title}`;
                    const msg = `Um aluno se candidatou à vaga "${job.title}" (${job.company}). Verifique as candidaturas.`;
                    await Notification.create(createdBy, title, msg, null);
                }
            }
        } catch (e) { console.error('Error notifying job creator', e); }

        res.status(201).json({ message: 'Application submitted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
