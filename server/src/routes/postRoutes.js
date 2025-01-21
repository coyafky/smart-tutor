const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const { authenticate, validate } = require('../middleware');
const postController = require('../controllers/postController');

// 获取帖子列表（公开）
router.get('/',
  query('subject').optional().isString(),
  query('grade').optional().isString(),
  query('minPrice').optional().isInt({ min: 0 }),
  query('maxPrice').optional().isInt({ min: 0 }),
  query('status').optional().isIn(['open', 'closed', 'in_progress']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validate,
  postController.getPosts
);

// 搜索帖子（公开）
router.get('/search',
  query('keyword').optional().isString(),
  query('location').optional().isArray(),
  query('distance').optional().isInt({ min: 0 }),
  validate,
  postController.searchPosts
);

// 获取帖子详情（公开）
router.get('/:postId', postController.getPostById);

// 以下路由需要认证
router.use(authenticate);

// 创建帖子
router.post('/',
  body('title').notEmpty().withMessage('标题不能为空'),
  body('subject').notEmpty().withMessage('科目不能为空'),
  body('grade').notEmpty().withMessage('年级不能为空'),
  body('schedule').isObject().withMessage('课程安排必须是对象'),
  body('schedule.frequency').notEmpty().withMessage('上课频率不能为空'),
  body('schedule.duration').isInt({ min: 1 }).withMessage('课程时长必须大于0'),
  body('schedule.preferredTime').isArray().withMessage('首选时间必须是数组'),
  body('price').isInt({ min: 0 }).withMessage('价格必须大于等于0'),
  body('requirements').optional().isString(),
  validate,
  postController.createPost
);

// 更新帖子
router.put('/:postId',
  body('title').optional().notEmpty().withMessage('标题不能为空'),
  body('subject').optional().notEmpty().withMessage('科目不能为空'),
  body('grade').optional().notEmpty().withMessage('年级不能为空'),
  body('schedule').optional().isObject().withMessage('课程安排必须是对象'),
  body('price').optional().isInt({ min: 0 }).withMessage('价格必须大于等于0'),
  body('requirements').optional().isString(),
  validate,
  postController.updatePost
);

// 删除帖子
router.delete('/:postId', postController.deletePost);

// 关闭帖子
router.post('/:postId/close',
  body('reason').notEmpty().withMessage('关闭原因不能为空'),
  validate,
  postController.closePost
);

// 重新开放帖子
router.post('/:postId/reopen', postController.reopenPost);

// 获取帖子申请列表
router.get('/:postId/applications', postController.getPostApplications);

// 更新帖子状态
router.put('/:postId/status',
  body('status').isIn(['open', 'closed', 'in_progress']).withMessage('状态无效'),
  validate,
  postController.updatePostStatus
);

module.exports = router;
