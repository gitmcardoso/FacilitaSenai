/* src/models/notificationModel.js - Data model / DB helpers */
const db = require('../config/db');

const Notification = {
    create: async (userId, title, message = null, url = null) => {
        const sql = `INSERT INTO notifications (user_id, title, message, url) VALUES (?, ?, ?, ?)`;
        const [res] = await db.execute(sql, [userId, title, message, url]);
        return res.insertId;
    },

    findByUser: async (userId, limit = 50) => {
        const sql = `SELECT id, user_id, title, message, url, read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`;
        const [rows] = await db.execute(sql, [userId, limit]);
        return rows;
    },

    markRead: async (id, userId) => {
        const sql = `UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?`;
        const [res] = await db.execute(sql, [id, userId]);
        return res.affectedRows;
    },

    markAllRead: async (userId) => {
        const sql = `UPDATE notifications SET read = 1 WHERE user_id = ?`;
        const [res] = await db.execute(sql, [userId]);
        return res.affectedRows;
    },

    delete: async (id) => {
        const sql = `DELETE FROM notifications WHERE id = ?`;
        const [res] = await db.execute(sql, [id]);
        return res.affectedRows;
    }
};

module.exports = Notification;
