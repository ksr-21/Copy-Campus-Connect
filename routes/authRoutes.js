const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, updateProfile, updateUser, getUsers, deleteUser } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.route('/users').get(protect, authorize('Super Admin', 'Director', 'HOD/Dean'), getUsers);
router.route('/users/:id')
  .put(protect, authorize('Super Admin', 'Director', 'HOD/Dean'), updateUser)
  .delete(protect, authorize('Super Admin', 'Director', 'HOD/Dean'), deleteUser);

module.exports = router;
