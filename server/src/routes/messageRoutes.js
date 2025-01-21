const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate, validate } = require('../middleware');
const messageController = require('../controllers/messageController');

// 所有路由都需要认证
router.use(authenticate);

// 发送消息
router.post('/',
  body('receiverId').notEmpty().withMessage('接收者ID不能为空'),
  body('content').notEmpty().withMessage('消息内容不能为空'),
  validate,
  messageController.sendMessage
);

// 获取消息列表
router.get('/',
  query('contactId').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validate,
  messageController.getMessages
);

// 获取联系人列表
router.get('/contacts', messageController.getContacts);

// 获取未读消息数
router.get('/unread', messageController.getUnreadCount);

// 标记消息为已读
router.put('/:messageId/read', messageController.markAsRead);

// 标记所有消息为已读
router.put('/read-all',
  body('contactId').optional().isString(),
  validate,
  messageController.markAllAsRead
);

// 删除消息
router.delete('/:messageId', messageController.deleteMessage);

// 获取系统通知
router.get('/notifications', messageController.getNotifications);

// 标记通知为已读
router.put('/notifications/:notificationId/read', messageController.markNotificationAsRead);

// 删除通知
router.delete('/notifications/:notificationId', messageController.deleteNotification);

// 获取消息统计
router.get('/statistics', messageController.getMessageStatistics);

module.exports = router;
