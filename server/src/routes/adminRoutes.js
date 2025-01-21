const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const { authenticate, authorize, validate } = require('../middleware');
const adminController = require('../controllers/adminController');

// 所有路由都需要认证和管理员权限
router.use(authenticate, authorize('admin'));

// 用户管理
router.get('/users', adminController.getUsers);
router.get('/users/:userId', adminController.getUserById);
router.put('/users/:userId/status',
  body('status').isIn(['active', 'inactive', 'suspended']).withMessage('状态无效'),
  validate,
  adminController.updateUserStatus
);

// 内容审核
router.get('/content/pending', adminController.getPendingContent);
router.put('/content/:type/:contentId/review',
  body('status').isIn(['approved', 'rejected']).withMessage('状态无效'),
  body('reason').optional().isString().withMessage('原因必须是字符串'),
  validate,
  adminController.reviewContent
);

// 举报处理
router.get('/reports', adminController.getReports);
router.put('/reports/:reportId',
  body('status').isIn(['pending', 'resolved', 'dismissed']).withMessage('状态无效'),
  body('action').optional().isIn(['warn', 'suspend', 'ban']).withMessage('操作无效'),
  validate,
  adminController.handleReport
);

// 系统配置
router.get('/config', adminController.getSystemConfig);
router.put('/config',
  body('config').isObject().withMessage('配置必须是对象'),
  validate,
  adminController.updateSystemConfig
);

// 统计分析
router.get('/statistics', adminController.getStatistics);
router.get('/statistics/users', adminController.getUserStatistics);
router.get('/statistics/posts', adminController.getPostStatistics);
router.get('/statistics/courses', adminController.getCourseStatistics);
router.get('/statistics/reviews', adminController.getReviewStatistics);

// 日志查看
router.get('/logs',
  query('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
  query('endDate').optional().isISO8601().withMessage('结束日期格式无效'),
  query('level').optional().isIn(['error', 'warn', 'info', 'debug']).withMessage('日志级别无效'),
  validate,
  adminController.getLogs
);

// 备份管理
router.post('/backup', adminController.createBackup);
router.get('/backups', adminController.getBackups);
router.post('/restore/:backupId', adminController.restoreBackup);

module.exports = router;
