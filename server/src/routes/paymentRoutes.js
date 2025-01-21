const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate, validate } = require('../middleware');
const paymentController = require('../controllers/paymentController');

// 所有路由都需要认证
router.use(authenticate);

// 创建订单
router.post('/orders',
  body('contractId').notEmpty().withMessage('合同ID不能为空'),
  body('amount').isInt({ min: 0 }).withMessage('金额必须大于等于0'),
  body('description').notEmpty().withMessage('订单描述不能为空'),
  validate,
  paymentController.createOrder
);

// 获取订单列表
router.get('/orders', paymentController.getOrders);

// 获取订单详情
router.get('/orders/:orderId', paymentController.getOrderById);

// 取消订单
router.post('/orders/:orderId/cancel',
  body('reason').notEmpty().withMessage('取消原因不能为空'),
  validate,
  paymentController.cancelOrder
);

// 处理支付
router.post('/process',
  body('orderId').notEmpty().withMessage('订单ID不能为空'),
  body('paymentMethod').isIn(['alipay', 'wechat']).withMessage('支付方式无效'),
  body('paymentDetails').isObject().withMessage('支付详情必须是对象'),
  validate,
  paymentController.processPayment
);

// 申请退款
router.post('/refunds',
  body('orderId').notEmpty().withMessage('订单ID不能为空'),
  body('amount').isInt({ min: 0 }).withMessage('退款金额必须大于等于0'),
  body('reason').notEmpty().withMessage('退款原因不能为空'),
  validate,
  paymentController.requestRefund
);

// 获取退款列表
router.get('/refunds', paymentController.getRefunds);

// 获取退款详情
router.get('/refunds/:refundId', paymentController.getRefundById);

// 处理退款
router.post('/refunds/:refundId/process',
  body('status').isIn(['approved', 'rejected']).withMessage('状态无效'),
  body('reason').optional().isString().withMessage('原因必须是字符串'),
  validate,
  paymentController.processRefund
);

// 获取支付记录
router.get('/records', paymentController.getPaymentRecords);

// 获取收入统计
router.get('/statistics/income', paymentController.getIncomeStatistics);

// 获取退款统计
router.get('/statistics/refunds', paymentController.getRefundStatistics);

// 导出支付记录
router.get('/records/export',
  query('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
  query('endDate').optional().isISO8601().withMessage('结束日期格式无效'),
  validate,
  paymentController.exportPaymentRecords
);

module.exports = router;
