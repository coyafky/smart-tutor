const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate, validate } = require('../middleware');
const applicationController = require('../controllers/applicationController');

// 所有路由都需要认证
router.use(authenticate);

// 获取应聘列表
router.get('/', applicationController.getApplications);

// 获取应聘详情
router.get('/:applicationId', applicationController.getApplicationById);

// 创建应聘申请
router.post('/',
  body('postId').notEmpty().withMessage('帖子ID不能为空'),
  body('introduction').notEmpty().withMessage('自我介绍不能为空'),
  body('availableTime').isArray().withMessage('可用时间必须是数组'),
  body('expectedPrice').optional().isInt({ min: 0 }).withMessage('期望价格必须大于等于0'),
  validate,
  applicationController.createApplication
);

// 更新应聘申请
router.put('/:applicationId',
  body('introduction').optional().notEmpty().withMessage('自我介绍不能为空'),
  body('availableTime').optional().isArray().withMessage('可用时间必须是数组'),
  body('expectedPrice').optional().isInt({ min: 0 }).withMessage('期望价格必须大于等于0'),
  validate,
  applicationController.updateApplication
);

// 取消应聘申请
router.post('/:applicationId/cancel',
  body('reason').notEmpty().withMessage('取消原因不能为空'),
  validate,
  applicationController.cancelApplication
);

// 接受应聘申请
router.post('/:applicationId/accept',
  applicationController.acceptApplication
);

// 拒绝应聘申请
router.post('/:applicationId/reject',
  body('reason').notEmpty().withMessage('拒绝原因不能为空'),
  validate,
  applicationController.rejectApplication
);

// 安排试讲
router.post('/:applicationId/trial',
  body('time').isISO8601().withMessage('时间格式无效'),
  body('duration').isInt({ min: 15 }).withMessage('时长必须大于15分钟'),
  body('location').notEmpty().withMessage('地点不能为空'),
  validate,
  applicationController.scheduleTrial
);

// 更新试讲结果
router.put('/:applicationId/trial',
  body('result').isIn(['passed', 'failed']).withMessage('结果无效'),
  body('feedback').notEmpty().withMessage('反馈不能为空'),
  validate,
  applicationController.updateTrialResult
);

// 获取应聘统计
router.get('/statistics',
  applicationController.getApplicationStatistics
);

module.exports = router;
