/* src/routes/scheduleRoutes.js - Express */
const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const authMiddleware = require('../middlewares/authMiddleware');


router.get('/', authMiddleware.verifyToken, scheduleController.getSchedules);
router.get('/rooms', authMiddleware.verifyToken, scheduleController.getRooms);


router.post('/',
    authMiddleware.verifyToken,
    authMiddleware.authorizeRoles('admin', 'professor'),
    scheduleController.createSchedule
);


router.delete('/:id', authMiddleware.verifyToken, authMiddleware.authorizeRoles('admin','professor'), scheduleController.deleteSchedule);

module.exports = router;
