const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const {
  register,
  login,
  getProfile,
  updateUserStatus,
  getAllUsers
} = require('../controllers/authController');

// 公开路由
router.post('/register', register);
router.post('/login', login);

// 需要认证的路由
router.get('/profile', auth, getProfile);

// 管理员路由
router.get('/users', auth, checkRole(['admin']), getAllUsers);
router.put(
  '/users/:userId/status',
  auth,
  checkRole(['admin']),
  updateUserStatus
);

// 导出路由
module.exports = router;
