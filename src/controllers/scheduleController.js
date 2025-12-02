/* src/controllers/scheduleController.js - Server */
const db = require('../config/db');
const Notification = require('../models/notificationModel');

exports.getSchedules = async (req, res) => {
    try {
        
        const { start_date, end_date } = req.query;

        let query = `
            SELECT s.*, r.name as room_name, r.type as room_type, u.name as user_name, c.name as class_name
            FROM schedules s
            JOIN rooms r ON s.room_id = r.id
            JOIN users u ON s.user_id = u.id
            LEFT JOIN classes c ON s.class_id = c.id
            ORDER BY s.start_time ASC
        `;

        

        const [rows] = await db.execute(query);

        
        
        
        const normalized = rows.map(r => {
            const out = Object.assign({}, r);
            try {
                if (out.start_time && typeof out.start_time === 'string') out.start_time = out.start_time.replace(' ', 'T');
            } catch (e) {}
            try {
                if (out.end_time && typeof out.end_time === 'string') out.end_time = out.end_time.replace(' ', 'T');
            } catch (e) {}
            return out;
        });

        res.json(normalized);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createSchedule = async (req, res) => {
    try {
        const { room_id, title, start_time, end_time, description, class_id } = req.body;
        const user_id = req.userId; 

        
        if (!room_id || !start_time || !end_time) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        
        let startDt, endDt;
        try {
            startDt = new Date((start_time || '').replace(' ', 'T'));
            endDt = new Date((end_time || '').replace(' ', 'T'));
        } catch (e) {
            return res.status(400).json({ message: 'Invalid date format' });
        }

        if (isNaN(startDt.getTime()) || isNaN(endDt.getTime())) {
            return res.status(400).json({ message: 'Invalid start_time or end_time' });
        }

        if (startDt >= endDt) {
            return res.status(400).json({ message: 'start_time must be before end_time' });
        }

        
        
        const startOfDay = new Date(startDt);
        startOfDay.setHours(0, 0, 0, 0);
        const day21 = new Date(startOfDay);
        day21.setHours(21, 0, 0, 0);
        const day08 = new Date(startOfDay);
        day08.setHours(8, 0, 0, 0);

        if (startDt < day08 || endDt > day21) {
            return res.status(400).json({ message: 'Reservations must be between 08:00 and 21:00' });
        }

        
        
        const [conflicts] = await db.execute(
            'SELECT * FROM schedules WHERE room_id = ? AND NOT (end_time <= ? OR start_time >= ?)',
            [room_id, start_time, end_time]
        );

        if (conflicts && conflicts.length > 0) {
            
            const normalizedConflicts = conflicts.map(r => {
                const out = Object.assign({}, r);
                try { if (out.start_time && typeof out.start_time === 'string') out.start_time = out.start_time.replace(' ', 'T'); } catch (e) {}
                try { if (out.end_time && typeof out.end_time === 'string') out.end_time = out.end_time.replace(' ', 'T'); } catch (e) {}
                return {
                    id: out.id,
                    room_id: out.room_id,
                    title: out.title,
                    start_time: out.start_time,
                    end_time: out.end_time
                };
            });

            return res.status(409).json({ message: 'Room is already booked for this time slot', conflicts: normalizedConflicts });
        }

        await db.execute(
            'INSERT INTO schedules (room_id, user_id, title, start_time, end_time, description, class_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [room_id, user_id, title, start_time, end_time, description, class_id || null]
        );

        
        if (class_id) {
            try {
                const [students] = await db.execute('SELECT id, name FROM users WHERE class_id = ? AND role = ?', [class_id, 'student']);
                const shortTitle = title || 'Novo agendamento';
                const msg = `Novo agendamento: ${shortTitle} em ${start_time} - ${end_time}`;
                if (students && students.length > 0) {
                    for (const s of students) {
                        try { await Notification.create(s.id, 'Agendamento para sua turma', msg, null); } catch (e) { console.error('notify student error', e); }
                    }
                }
            } catch (e) { console.error('Error notifying class students', e); }
        }

        res.status(201).json({ message: 'Schedule created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getRooms = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM rooms');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [rows] = await db.execute('SELECT * FROM schedules WHERE id = ?', [id]);
        if (!rows || rows.length === 0) return res.status(404).json({ message: 'Schedule not found' });
        const sched = rows[0];

        
        await db.execute('DELETE FROM schedules WHERE id = ?', [id]);

        
        if (sched.class_id) {
            try {
                const [students] = await db.execute('SELECT id FROM users WHERE class_id = ? AND role = ?', [sched.class_id, 'student']);
                const title = 'Agendamento cancelado';
                const msg = `O agendamento "${sched.title || 'Reserva'}" para sua turma em ${sched.start_time} foi cancelado.`;
                for (const s of (students || [])) {
                    try { const Notification = require('../models/notificationModel'); await Notification.create(s.id, title, msg, null); } catch (e) { console.error('notify student cancellation error', e); }
                }
            } catch (e) { console.error('Error notifying students on cancellation', e); }
        }

        res.json({ message: 'Schedule deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
