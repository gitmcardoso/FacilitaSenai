/* src/routes/replacementRoutes.js - Express */
const express = require('express');
const router = express.Router();
const replacementController = require('../controllers/replacementController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware.verifyToken, replacementController.getReplacements);
router.post('/', authMiddleware.verifyToken, replacementController.createReplacement);
router.put('/:id/status',
    authMiddleware.verifyToken,
    authMiddleware.authorizeRoles('admin','professor'),
    replacementController.updateStatus
);

module.exports = router;
