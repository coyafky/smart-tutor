const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate, authorize, validate } = require('../middleware');
const parentController = require('../controllers/parentController');

// 所有路由都需要认证和家长权限
router.use(authenticate, authorize('parent'));

// 更新家长资料
router.put('/profile',
  body('children').isArray().withMessage('children必须是数组'),
  body('children.*.name').notEmpty().withMessage('孩子姓名不能为空'),
  body('children.*.grade').notEmpty().withMessage('孩子年级不能为空'),
  body('children.*.school').optional().isString().withMessage('学校必须是字符串'),
  validate,
  parentController.updateProfile
);

// 获取孩子列表
router.get('/children', parentController.getChildren);

// 添加孩子
router.post('/children',
  body('name').notEmpty().withMessage('姓名不能为空'),
  body('grade').notEmpty().withMessage('年级不能为空'),
  body('school').optional().isString().withMessage('学校必须是字符串'),
  validate,
  parentController.addChild
);

// 更新孩子信息
router.put('/children/:childId',
  body('name').optional().notEmpty().withMessage('姓名不能为空'),
  body('grade').optional().notEmpty().withMessage('年级不能为空'),
  body('school').optional().isString().withMessage('学校必须是字符串'),
  validate,
  parentController.updateChild
);

// 删除孩子
router.delete('/children/:childId', parentController.deleteChild);

// 获取帖子列表
router.get('/posts', parentController.getPosts);

// 获取帖子详情
router.get('/posts/:postId', parentController.getPostById);

// 获取收藏的教师列表
router.get('/favorite-teachers', parentController.getFavoriteTeachers);

// 添加收藏教师
router.post('/favorite-teachers/:teacherId', parentController.addFavoriteTeacher);

// 取消收藏教师
router.delete('/favorite-teachers/:teacherId', parentController.removeFavoriteTeacher);

// 获取订单列表
router.get('/orders', parentController.getOrders);

// 获取订单详情
router.get('/orders/:orderId', parentController.getOrderById);

// 创建订单
router.post('/orders',
  body('courseId').notEmpty().withMessage('课程ID不能为空'),
  body('paymentMethod').isIn(['alipay', 'wechat']).withMessage('支付方式无效'),
  validate,
  parentController.createOrder
);

// 取消订单
router.post('/orders/:orderId/cancel',
  body('reason').notEmpty().withMessage('取消原因不能为空'),
  validate,
  parentController.cancelOrder
);

// 申请退款
router.post('/orders/:orderId/refund',
  body('reason').notEmpty().withMessage('退款原因不能为空'),
  validate,
  parentController.requestRefund
);

// 获取评价列表
router.get('/reviews', parentController.getReviews);

// 创建评价
router.post('/reviews',
  body('courseId').notEmpty().withMessage('课程ID不能为空'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('评分必须在1-5之间'),
  body('content').notEmpty().withMessage('评价内容不能为空'),
  validate,
  parentController.createReview
);

// 更新评价
router.put('/reviews/:reviewId',
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('评分必须在1-5之间'),
  body('content').optional().notEmpty().withMessage('评价内容不能为空'),
  validate,
  parentController.updateReview
);

// 删除评价
router.delete('/reviews/:reviewId', parentController.deleteReview);

module.exports = router;
