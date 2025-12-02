/* src/models/jobModel.js - Data model / DB helpers */
const db = require('../config/db');

class Job {
    static async findAll() {
        const [rows] = await db.execute('SELECT * FROM jobs ORDER BY created_at DESC');
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.execute('SELECT * FROM jobs WHERE id = ?', [id]);
        return rows[0];
    }

    static async create(jobData) {
        const { title, company, position, schedule, address, salary, description, requirements, type, created_by } = jobData;
        const [result] = await db.execute(
            'INSERT INTO jobs (title, company, position, schedule, address, salary, description, requirements, type, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [title, company, position || null, schedule || null, address || null, salary || null, description, requirements || '', type, created_by]
        );
        return result.insertId;
    }

    static async getApplications(jobId) {
        const [rows] = await db.execute(`
            SELECT ja.*, u.name as student_name, u.email as student_email, 
                   i.name as indicated_by_name
            FROM job_applications ja
            JOIN users u ON ja.student_id = u.id
            LEFT JOIN users i ON ja.indicated_by = i.id
            WHERE ja.job_id = ?
            ORDER BY ja.applied_at DESC
        `, [jobId]);
        return rows;
    }
}

module.exports = Job;
