/* src/routes/classroomRoutes.js - Express*/

const express = require('express');
const router = express.Router();
const googleClassroomController = require('../controllers/googleClassroomController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');


router.get('/:code/atividades', verifyToken, googleClassroomController.getActivities);




module.exports = router;
