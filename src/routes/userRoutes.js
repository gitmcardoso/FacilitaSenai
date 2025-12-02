/* src/routes/userRoutes.js - Express*/
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');


router.get('/', verifyToken, authorizeRoles('admin'), userController.getAllUsers);
router.post('/', verifyToken, authorizeRoles('admin'), userController.createUser);


router.get('/students', verifyToken, authorizeRoles('admin','professor'), userController.getStudents);

router.put('/:id', verifyToken, (req, res, next) => {
	
	const targetId = parseInt(req.params.id, 10);
	if (req.userRole !== 'admin' && req.userId !== targetId) {
		return res.status(403).json({ message: 'Access denied' });
	}
	next();
}, userController.updateUser);

router.put('/:id/password', verifyToken, async (req, res, next) => {
	
	const targetId = parseInt(req.params.id, 10);
	if (req.userRole !== 'admin' && req.userId !== targetId) {
		return res.status(403).json({ message: 'Access denied' });
	}
	next();
}, userController.changePassword);
router.delete('/:id', verifyToken, authorizeRoles('admin'), userController.deleteUser);


router.get('/:id', verifyToken, userController.getUserById);

module.exports = router;
