const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate, authorize, validate, upload } = require('../middleware');
const teacherController = require('../controllers/teacherController');

// 所有路由都需要认证
router.use(authenticate);

// 获取教师列表（公开）
router.get('/', teacherController.getTeachers);

// 获取教师详情（公开）
router.get('/:teacherId', teacherController.getTeacherById);

// 以下路由需要教师权限
router.use(authorize('teacher'));

// 更新教师资料
router.put('/profile',
  body('teachingExperience').optional().isInt().withMessage('教学经验必须是整数'),
  body('education').optional().isString().withMessage('教育背景必须是字符串'),
  body('subjects').optional().isArray().withMessage('科目必须是数组'),
  body('grades').optional().isArray().withMessage('年级必须是数组'),
  body('introduction').optional().isString().withMessage('简介必须是字符串'),
  validate,
  teacherController.updateProfile
);

// 上传证书
router.post('/certificates',
  upload.single('certificate'),
  teacherController.uploadCertificate
);

// 删除证书
router.delete('/certificates/:certificateId',
  teacherController.deleteCertificate
);

// 设置可用时间
router.put('/availability',
  body('availableTime').isArray().withMessage('可用时间必须是数组'),
  validate,
  teacherController.setAvailability
);

// 获取课程列表
router.get('/courses', teacherController.getCourses);

// 获取课程详情
router.get('/courses/:courseId', teacherController.getCourseById);

// 更新课程状态
router.put('/courses/:courseId/status',
  body('status').isIn(['scheduled', 'ongoing', 'completed', 'cancelled']).withMessage('状态无效'),
  validate,
  teacherController.updateCourseStatus
);

// 获取收入统计
router.get('/income',
  teacherController.getIncomeStatistics
);

// 获取收入明细
router.get('/income/details',
  teacherController.getIncomeDetails
);

// 获取评价列表
router.get('/reviews', teacherController.getReviews);

// 回复评价
router.post('/reviews/:reviewId/reply',
  body('content').notEmpty().withMessage('回复内容不能为空'),
  validate,
  teacherController.replyToReview
);

// 获取应聘列表
router.get('/applications', teacherController.getApplications);

// 更新应聘状态
router.put('/applications/:applicationId/status',
  body('status').isIn(['accepted', 'rejected']).withMessage('状态无效'),
  body('reason').optional().isString().withMessage('原因必须是字符串'),
  validate,
  teacherController.updateApplicationStatus
);

module.exports = router;
