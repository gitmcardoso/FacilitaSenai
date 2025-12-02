/* src/routes/authRoutes.js - Express route definições */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.post('/login', authController.login);

router.post('/forgot', authController.forgotPassword);
router.post('/reset', authController.resetPassword);
router.post('/first-access', authController.firstAccessChange);


router.post('/request-reset', authController.createResetRequest);
router.get('/password-requests', verifyToken, authorizeRoles('admin'), authController.listResetRequests);
router.post('/password-requests/:id/approve', verifyToken, authorizeRoles('admin'), authController.approveResetRequest);
router.post('/password-requests/:id/reject', verifyToken, authorizeRoles('admin'), authController.rejectResetRequest);

module.exports = router;
