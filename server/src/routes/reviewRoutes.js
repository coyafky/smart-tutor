const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate, validate } = require('../middleware');
const reviewController = require('../controllers/reviewController');

// 获取评价列表（公开）
router.get('/',
  query('teacherId').optional().isString(),
  query('rating').optional().isInt({ min: 1, max: 5 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validate,
  reviewController.getReviews
);

// 获取评价详情（公开）
router.get('/:reviewId', reviewController.getReviewById);

// 以下路由需要认证
router.use(authenticate);

// 创建评价
router.post('/',
  body('courseId').notEmpty().withMessage('课程ID不能为空'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('评分必须在1-5之间'),
  body('content').notEmpty().withMessage('评价内容不能为空'),
  body('tags').optional().isArray().withMessage('标签必须是数组'),
  validate,
  reviewController.createReview
);

// 更新评价
router.put('/:reviewId',
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('评分必须在1-5之间'),
  body('content').optional().notEmpty().withMessage('评价内容不能为空'),
  body('tags').optional().isArray().withMessage('标签必须是数组'),
  validate,
  reviewController.updateReview
);

// 删除评价
router.delete('/:reviewId', reviewController.deleteReview);

// 回复评价
router.post('/:reviewId/reply',
  body('content').notEmpty().withMessage('回复内容不能为空'),
  validate,
  reviewController.replyToReview
);

// 更新回复
router.put('/:reviewId/reply',
  body('content').notEmpty().withMessage('回复内容不能为空'),
  validate,
  reviewController.updateReply
);

// 删除回复
router.delete('/:reviewId/reply', reviewController.deleteReply);

// 举报评价
router.post('/:reviewId/report',
  body('reason').notEmpty().withMessage('举报原因不能为空'),
  body('description').optional().isString().withMessage('描述必须是字符串'),
  validate,
  reviewController.reportReview
);

// 获取评价统计
router.get('/statistics',
  query('teacherId').optional().isString(),
  validate,
  reviewController.getReviewStatistics
);

module.exports = router;
