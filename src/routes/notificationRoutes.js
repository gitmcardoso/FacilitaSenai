/* src/routes/notificationRoutes.js - Express */
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');


router.get('/', verifyToken, notificationController.getMyNotifications);


router.post('/', verifyToken, authorizeRoles('admin','professor'), notificationController.createNotification);


router.put('/:id/read', verifyToken, notificationController.markAsRead);


router.put('/read-all', verifyToken, notificationController.markAllRead);


router.delete('/:id', verifyToken, authorizeRoles('admin'), notificationController.deleteNotification);

module.exports = router;
