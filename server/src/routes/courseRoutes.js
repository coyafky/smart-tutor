const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate, validate } = require('../middleware');
const courseController = require('../controllers/courseController');

// 所有路由都需要认证
router.use(authenticate);

// 获取课程列表
router.get('/', courseController.getCourses);

// 获取课程详情
router.get('/:courseId', courseController.getCourseById);

// 创建课程合同
router.post('/contracts',
  body('postId').notEmpty().withMessage('帖子ID不能为空'),
  body('teacherId').notEmpty().withMessage('教师ID不能为空'),
  body('schedule').isObject().withMessage('课程安排必须是对象'),
  body('schedule.startDate').isISO8601().withMessage('开始日期格式无效'),
  body('schedule.endDate').isISO8601().withMessage('结束日期格式无效'),
  body('schedule.frequency').notEmpty().withMessage('上课频率不能为空'),
  body('schedule.time').isArray().withMessage('上课时间必须是数组'),
  body('price').isInt({ min: 0 }).withMessage('价格必须大于等于0'),
  validate,
  courseController.createContract
);

// 更新课程合同
router.put('/contracts/:contractId',
  body('schedule').optional().isObject().withMessage('课程安排必须是对象'),
  body('price').optional().isInt({ min: 0 }).withMessage('价格必须大于等于0'),
  validate,
  courseController.updateContract
);

// 签署课程合同
router.post('/contracts/:contractId/sign', courseController.signContract);

// 终止课程合同
router.post('/contracts/:contractId/terminate',
  body('reason').notEmpty().withMessage('终止原因不能为空'),
  validate,
  courseController.terminateContract
);

// 创建课程安排
router.post('/:courseId/schedules',
  body('scheduleData').isArray().withMessage('课程安排必须是数组'),
  body('scheduleData.*.date').isISO8601().withMessage('日期格式无效'),
  body('scheduleData.*.startTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('开始时间格式无效'),
  body('scheduleData.*.endTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('结束时间格式无效'),
  body('scheduleData.*.location').notEmpty().withMessage('上课地点不能为空'),
  validate,
  courseController.createSchedule
);

// 更新课程安排
router.put('/:courseId/schedules/:scheduleId',
  body('date').optional().isISO8601().withMessage('日期格式无效'),
  body('startTime').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('开始时间格式无效'),
  body('endTime').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('结束时间格式无效'),
  body('location').optional().notEmpty().withMessage('上课地点不能为空'),
  validate,
  courseController.updateSchedule
);

// 取消课程安排
router.post('/:courseId/schedules/:scheduleId/cancel',
  body('reason').notEmpty().withMessage('取消原因不能为空'),
  validate,
  courseController.cancelSchedule
);

// 记录课程
router.post('/:courseId/records',
  body('content').notEmpty().withMessage('课程内容不能为空'),
  body('homework').optional().isString().withMessage('作业必须是字符串'),
  body('performance').optional().isString().withMessage('表现评价必须是字符串'),
  validate,
  courseController.createRecord
);

// 更新课程记录
router.put('/:courseId/records/:recordId',
  body('content').optional().notEmpty().withMessage('课程内容不能为空'),
  body('homework').optional().isString().withMessage('作业必须是字符串'),
  body('performance').optional().isString().withMessage('表现评价必须是字符串'),
  validate,
  courseController.updateRecord
);

// 获取课程统计
router.get('/statistics', courseController.getCourseStatistics);

module.exports = router;
