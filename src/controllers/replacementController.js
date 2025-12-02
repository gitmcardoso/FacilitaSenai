/* src/controllers/replacementController.js - Server controller */
const db = require('../config/db');
const Notification = require('../models/notificationModel');

exports.getReplacements = async (req, res) => {
    try {
        const user_id = req.userId;
        const role = req.userRole;

        let query = `
            SELECT r.*, u.name as requester_name, s.name as student_name
            FROM replacements r
            JOIN users u ON r.requester_id = u.id
            LEFT JOIN users s ON r.student_id = s.id
        `;

        
        if (role === 'student') {
            query += ` WHERE r.requester_id = ${user_id} OR r.student_id = ${user_id}`;
        }

        query += ' ORDER BY r.requested_date DESC';

        const [rows] = await db.execute(query);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createReplacement = async (req, res) => {
    try {
        const { subject, original_date, requested_date, reason, student_id } = req.body;
        const requester_id = req.userId;
        const role = req.userRole;

        if (!subject || !original_date || !requested_date || !reason) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        let target_student_id = null;

        if (role === 'student') {
            target_student_id = requester_id;
        } else {
            
            if (!student_id) {
                return res.status(400).json({ message: 'Student must be specified' });
            }
            target_student_id = student_id;
        }

        
        if (role === 'professor' || role === 'admin') {
            await db.execute(
                'INSERT INTO replacements (requester_id, subject, original_date, requested_date, reason, student_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [requester_id, subject, original_date, requested_date, reason, target_student_id, 'approved']
            );

            
            if (target_student_id) {
                try {
                    const title = 'Reposição criada e aprovada';
                    const msg = `Sua reposição para ${subject} em ${requested_date} foi criada e aprovada.`;
                    await Notification.create(target_student_id, title, msg, null);
                } catch (e) { console.error('notify student replacement approved', e); }
            }

            return res.status(201).json({ message: 'Replacement created and auto-approved' });
        }

        await db.execute(
            'INSERT INTO replacements (requester_id, subject, original_date, requested_date, reason, student_id) VALUES (?, ?, ?, ?, ?, ?)',
            [requester_id, subject, original_date, requested_date, reason, target_student_id]
        );

        
        try {
            const [profs] = await db.execute('SELECT id FROM users WHERE role = ?', ['professor']);
            const title = 'Nova solicitação de reposição';
            const msg = `Uma nova solicitação de reposição foi criada para ${subject} na data ${requested_date}.`;
            if (profs && profs.length > 0) {
                for (const p of profs) {
                    try { await Notification.create(p.id, title, msg, null); } catch (e) { console.error('notify professor error', e); }
                }
            }
        } catch (e) { console.error('Error notifying professors', e); }

        res.status(201).json({ message: 'Replacement request created' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, admin_notes } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const approverId = req.userId;
        const approvedAt = new Date().toISOString();

        await db.execute(
            'UPDATE replacements SET status = ?, admin_notes = ?, approved_by = ?, approved_at = ? WHERE id = ?',
            [status, admin_notes || null, approverId, approvedAt, id]
        );

        
        try {
            const [rows] = await db.execute('SELECT requester_id, student_id, subject FROM replacements WHERE id = ?', [id]);
            if (rows && rows.length > 0) {
                const r = rows[0];
                const subj = r.subject || 'Reposição';
                const title = status === 'approved' ? 'Reposição aprovada' : 'Reposição rejeitada';
                const msg = status === 'approved' ? `Sua solicitação de reposição (${subj}) foi aprovada.` : `Sua solicitação de reposição (${subj}) foi rejeitada.`;
                if (r.requester_id) {
                    try { await Notification.create(r.requester_id, title, msg, null); } catch (e) { console.error('notify requester error', e); }
                }
                if (r.student_id) {
                    try { await Notification.create(r.student_id, title, msg, null); } catch (e) { console.error('notify student error', e); }
                }
            }
        } catch (e) { console.error('Error notifying replacement status change', e); }

        res.json({ message: 'Replacement status updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
