const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/user/User');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// 发送私信
const sendMessage = async (req, res) => {
  try {
    const { userId } = req.user;
    const { receiverId, content } = req.body;

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // 检查接收者是否存在
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: '接收者不存在'
      });
    }

    // 创建私信
    const message = new Message({
      senderId: userId,
      receiverId,
      content,
      type: 'private'
    });

    await message.save();

    // 创建通知
    const notification = new Notification({
      userId: receiverId,
      type: 'message',
      title: '新私信',
      content: `您收到一条新私信`,
      relatedId: message._id,
      status: 'unread'
    });

    await notification.save();
    logger.info(`Message sent: ${message._id}`);

    res.json({
      success: true,
      message: '私信发送成功',
      data: message
    });
  } catch (error) {
    logger.error('Send message failed:', error);
    res.status(500).json({
      success: false,
      message: '发送私信失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取私信列表
const getMessages = async (req, res) => {
  try {
    const { userId } = req.user;
    const { contactId, page = 1, limit = 20 } = req.query;

    const query = {
      $or: [
        { senderId: userId, receiverId: contactId },
        { senderId: contactId, receiverId: userId }
      ]
    };

    const skip = (page - 1) * limit;
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('senderId', 'username avatar')
      .populate('receiverId', 'username avatar');

    const total = await Message.countDocuments(query);

    // 将未读消息标记为已读
    await Message.updateMany(
      {
        receiverId: userId,
        senderId: contactId,
        status: 'unread'
      },
      { status: 'read' }
    );

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get messages failed:', error);
    res.status(500).json({
      success: false,
      message: '获取私信失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取联系人列表
const getContacts = async (req, res) => {
  try {
    const { userId } = req.user;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    // 获取最近联系人
    const contacts = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: mongoose.Types.ObjectId(userId) }, { receiverId: mongoose.Types.ObjectId(userId) }]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', mongoose.Types.ObjectId(userId)] },
              '$receiverId',
              '$senderId'
            ]
          },
          lastMessage: { $first: '$$ROOT' }
        }
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      }
    ]);

    // 获取联系人详细信息
    const contactIds = contacts.map(contact => contact._id);
    const users = await User.find(
      { _id: { $in: contactIds } },
      'username avatar status'
    );

    // 获取未读消息数
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          receiverId: mongoose.Types.ObjectId(userId),
          status: 'unread'
        }
      },
      {
        $group: {
          _id: '$senderId',
          count: { $sum: 1 }
        }
      }
    ]);

    // 组合数据
    const contactList = contacts.map(contact => {
      const user = users.find(u => u._id.equals(contact._id));
      const unread = unreadCounts.find(u => u._id.equals(contact._id));
      return {
        user,
        lastMessage: contact.lastMessage,
        unreadCount: unread ? unread.count : 0
      };
    });

    const total = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: mongoose.Types.ObjectId(userId) }, { receiverId: mongoose.Types.ObjectId(userId) }]
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', mongoose.Types.ObjectId(userId)] },
              '$receiverId',
              '$senderId'
            ]
          }
        }
      },
      {
        $count: 'total'
      }
    ]);

    res.json({
      success: true,
      data: {
        contacts: contactList,
        pagination: {
          total: total[0]?.total || 0,
          page: parseInt(page),
          pages: Math.ceil((total[0]?.total || 0) / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get contacts failed:', error);
    res.status(500).json({
      success: false,
      message: '获取联系人列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 发送系统通知
const sendNotification = async (req, res) => {
  try {
    const { userId } = req.user;
    const { receiverId, type, title, content, relatedId } = req.body;

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // 创建通知
    const notification = new Notification({
      userId: receiverId,
      type,
      title,
      content,
      relatedId,
      status: 'unread'
    });

    await notification.save();
    logger.info(`Notification sent: ${notification._id}`);

    res.json({
      success: true,
      message: '通知发送成功',
      data: notification
    });
  } catch (error) {
    logger.error('Send notification failed:', error);
    res.status(500).json({
      success: false,
      message: '发送通知失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取通知列表
const getNotifications = async (req, res) => {
  try {
    const { userId } = req.user;
    const { type, status, page = 1, limit = 20 } = req.query;

    const query = { userId };
    if (type) query.type = type;
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments(query);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get notifications failed:', error);
    res.status(500).json({
      success: false,
      message: '获取通知失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 标记通知为已读
const markNotificationAsRead = async (req, res) => {
  try {
    const { userId } = req.user;
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        userId,
        status: 'unread'
      },
      { status: 'read' },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '未找到未读通知'
      });
    }

    res.json({
      success: true,
      message: '通知已标记为已读',
      data: notification
    });
  } catch (error) {
    logger.error('Mark notification as read failed:', error);
    res.status(500).json({
      success: false,
      message: '标记通知失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取未读消息和通知数量
const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.user;

    const [messageCount, notificationCount] = await Promise.all([
      Message.countDocuments({
        receiverId: userId,
        status: 'unread'
      }),
      Notification.countDocuments({
        userId,
        status: 'unread'
      })
    ]);

    res.json({
      success: true,
      data: {
        messageCount,
        notificationCount,
        total: messageCount + notificationCount
      }
    });
  } catch (error) {
    logger.error('Get unread count failed:', error);
    res.status(500).json({
      success: false,
      message: '获取未读数量失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  getContacts,
  sendNotification,
  getNotifications,
  markNotificationAsRead,
  getUnreadCount
};
