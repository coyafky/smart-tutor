const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const { authenticate, validate } = require('../middleware');
const recommendationController = require('../controllers/recommendationController');

// 所有路由都需要认证
router.use(authenticate);

// 获取教师推荐
router.get('/teachers',
  query('postId').optional().isString(),
  query('subject').optional().isString(),
  query('grade').optional().isString(),
  query('location').optional().isArray(),
  query('distance').optional().isInt({ min: 0 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validate,
  recommendationController.getTeacherRecommendations
);

// 获取帖子推荐
router.get('/posts',
  query('teacherId').optional().isString(),
  query('subject').optional().isString(),
  query('grade').optional().isString(),
  query('location').optional().isArray(),
  query('distance').optional().isInt({ min: 0 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validate,
  recommendationController.getPostRecommendations
);

// 获取相似教师
router.get('/teachers/:teacherId/similar',
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validate,
  recommendationController.getSimilarTeachers
);

// 获取相似帖子
router.get('/posts/:postId/similar',
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validate,
  recommendationController.getSimilarPosts
);

// 获取个性化推荐
router.get('/personalized',
  query('type').isIn(['teachers', 'posts']).withMessage('类型无效'),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validate,
  recommendationController.getPersonalizedRecommendations
);

// 获取热门推荐
router.get('/trending',
  query('type').isIn(['teachers', 'posts']).withMessage('类型无效'),
  query('period').optional().isIn(['day', 'week', 'month']).withMessage('时间段无效'),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validate,
  recommendationController.getTrendingRecommendations
);

// 反馈推荐结果
router.post('/feedback',
  body('recommendationId').notEmpty().withMessage('推荐ID不能为空'),
  body('action').isIn(['click', 'ignore', 'like', 'dislike']).withMessage('操作无效'),
  validate,
  recommendationController.submitRecommendationFeedback
);

module.exports = router;
