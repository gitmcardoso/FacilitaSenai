/* src/routes/classroomAuthRoutes.js - Express */
const express = require('express');
const router = express.Router();
const googleClassroomController = require('../controllers/googleClassroomController');

router.get('/', googleClassroomController.getAuthUrl);
router.get('/callback', googleClassroomController.authCallback);

module.exports = router;
