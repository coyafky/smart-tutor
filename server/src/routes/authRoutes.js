const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware');
const authController = require('../controllers/authController');

// 注册验证规则
const registerValidation = [
  body('username').trim().notEmpty().withMessage('用户名不能为空'),
  body('email').isEmail().withMessage('邮箱格式不正确'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6个字符'),
  body('role').isIn(['teacher', 'parent']).withMessage('角色无效'),
  body('phone').matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确')
];

// 登录验证规则
const loginValidation = [
  body('email').isEmail().withMessage('邮箱格式不正确'),
  body('password').notEmpty().withMessage('密码不能为空')
];

// 注册
router.post('/register', registerValidation, validate, authController.register);

// 登录
router.post('/login', loginValidation, validate, authController.login);

// 刷新令牌
router.post('/refresh-token', authController.refreshToken);

// 重置密码请求
router.post('/reset-password-request', 
  body('email').isEmail().withMessage('邮箱格式不正确'),
  validate,
  authController.resetPasswordRequest
);

// 重置密码
router.post('/reset-password',
  body('token').notEmpty().withMessage('令牌不能为空'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6个字符'),
  validate,
  authController.resetPassword
);

// 验证邮箱
router.get('/verify-email/:token', authController.verifyEmail);

// 登出
router.post('/logout', authController.logout);

module.exports = router;
