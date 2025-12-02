/* src/routes/classRoutes.js - Express */
const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, classController.getAllClasses);
router.post('/', verifyToken, classController.createClass);

module.exports = router;
