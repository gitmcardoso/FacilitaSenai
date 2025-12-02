/* src/controllers/notificationController.js - Server controller*/
const Notification = require('../models/notificationModel');
const db = require('../config/db');

exports.getMyNotifications = async (req, res) => {
    try {
        const userId = req.userId;
        const nots = await Notification.findByUser(userId, 100);
        res.json(nots);
    } catch (err) {
        console.error('getMyNotifications error', err);
        res.status(500).json({ message: 'Erro ao buscar notificações' });
    }
};

exports.createNotification = async (req, res) => {
    try {
        const { user_id, title, message, url } = req.body;
        if (!user_id || !title) return res.status(400).json({ message: 'user_id e title são obrigatórios' });
        const id = await Notification.create(user_id, title, message || null, url || null);
        res.status(201).json({ id });
    } catch (err) {
        console.error('createNotification error', err);
        res.status(500).json({ message: 'Erro ao criar notificação' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const userId = req.userId;
        const id = req.params.id;
        const affected = await Notification.markRead(id, userId);
        if (!affected) return res.status(404).json({ message: 'Notificação não encontrada' });
        res.json({ ok: true });
    } catch (err) {
        console.error('markAsRead error', err);
        res.status(500).json({ message: 'Erro ao marcar notificação' });
    }
};

exports.markAllRead = async (req, res) => {
    try {
        const userId = req.userId;
        await Notification.markAllRead(userId);
        res.json({ ok: true });
    } catch (err) {
        console.error('markAllRead error', err);
        res.status(500).json({ message: 'Erro ao marcar todas as notificações' });
    }
};

exports.deleteNotification = async (req, res) => {
    try {
        const id = req.params.id;
        await Notification.delete(id);
        res.json({ ok: true });
    } catch (err) {
        console.error('deleteNotification error', err);
        res.status(500).json({ message: 'Erro ao deletar notificação' });
    }
};
