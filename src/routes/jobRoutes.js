/* src/routes/jobRoutes.js - Express */
const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');


router.get('/', verifyToken, jobController.getJobs);
router.get('/:id', verifyToken, jobController.getJobById);


router.post('/:id/apply', verifyToken, authorizeRoles('student'), jobController.applyToJob);
router.get('/my/applications', verifyToken, authorizeRoles('student'), jobController.getMyApplications);


router.post('/', verifyToken, authorizeRoles('professor', 'admin'), jobController.createJob);
router.get('/:id/applications', verifyToken, authorizeRoles('professor', 'admin'), jobController.getApplications);


router.get('/applications/all', verifyToken, authorizeRoles('admin'), jobController.getAllApplications);


router.post('/:id/indicate', verifyToken, jobController.indicateStudent);

module.exports = router;
