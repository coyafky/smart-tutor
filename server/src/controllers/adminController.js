const Admin = require('../models/user/Admin');
const User = require('../models/user/User');
const Post = require('../models/Post');
const Report = require('../models/Report');
const Feedback = require('../models/Feedback');
const SystemConfig = require('../models/SystemConfig');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// 获取系统配置
const getSystemConfig = async (req, res) => {
  try {
    const config = await SystemConfig.findOne();
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: '未找到系统配置'
      });
    }

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    logger.error('Get system config failed:', error);
    res.status(500).json({
      success: false,
      message: '获取系统配置失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 更新系统配置
const updateSystemConfig = async (req, res) => {
  try {
    const updates = req.body;

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    let config = await SystemConfig.findOne();
    
    if (!config) {
      config = new SystemConfig(updates);
    } else {
      // 更新配置
      const allowedUpdates = [
        'siteName',
        'siteDescription',
        'contactEmail',
        'contactPhone',
        'maxLoginAttempts',
        'lockoutDuration',
        'passwordPolicy',
        'emailSettings',
        'paymentSettings',
        'commissionRate'
      ];

      allowedUpdates.forEach(field => {
        if (updates[field] !== undefined) {
          config[field] = updates[field];
        }
      });
    }

    await config.save();
    logger.info('System config updated');

    res.json({
      success: true,
      message: '系统配置更新成功',
      data: config
    });
  } catch (error) {
    logger.error('Update system config failed:', error);
    res.status(500).json({
      success: false,
      message: '更新系统配置失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取用户列表
const getUsers = async (req, res) => {
  try {
    const { 
      role,
      status,
      searchTerm,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (searchTerm) {
      query.$or = [
        { username: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limit)
      .select('-password');

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get users failed:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 更新用户状态
const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, reason } = req.body;

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        status,
        statusReason: reason,
        statusUpdatedAt: new Date()
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '未找到用户'
      });
    }

    logger.info(`User status updated: ${userId}, status: ${status}`);

    res.json({
      success: true,
      message: '用户状态更新成功',
      data: user
    });
  } catch (error) {
    logger.error('Update user status failed:', error);
    res.status(500).json({
      success: false,
      message: '更新用户状态失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取待审核内容列表
const getPendingContent = async (req, res) => {
  try {
    const { 
      type,
      page = 1,
      limit = 10
    } = req.query;

    let data = {};
    const skip = (page - 1) * limit;

    switch (type) {
      case 'posts':
        data.items = await Post.find({ status: 'pending' })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('parentId', 'username avatar');
        data.total = await Post.countDocuments({ status: 'pending' });
        break;

      case 'teachers':
        data.items = await User.find({ role: 'teacher', status: 'pending' })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('parentId', 'username avatar');
        data.total = await User.countDocuments({ role: 'teacher', status: 'pending' });
        break;

      case 'reviews':
        data.items = await Post.find({ type: 'review', status: 'pending' })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('parentId', 'username avatar')
          .populate('teacherId', 'username avatar');
        data.total = await Post.countDocuments({ type: 'review', status: 'pending' });
        break;

      default:
        return res.status(400).json({
          success: false,
          message: '无效的内容类型'
        });
    }

    res.json({
      success: true,
      data: {
        items: data.items,
        pagination: {
          total: data.total,
          page: parseInt(page),
          pages: Math.ceil(data.total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get pending content failed:', error);
    res.status(500).json({
      success: false,
      message: '获取待审核内容失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 审核内容
const reviewContent = async (req, res) => {
  try {
    const { type, contentId } = req.params;
    const { status, reason } = req.body;

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    let result;
    switch (type) {
      case 'posts':
        result = await Post.findByIdAndUpdate(
          contentId,
          {
            status,
            reviewReason: reason,
            reviewedAt: new Date()
          },
          { new: true }
        );
        break;

      case 'teachers':
        result = await User.findByIdAndUpdate(
          contentId,
          {
            status,
            statusReason: reason,
            statusUpdatedAt: new Date()
          },
          { new: true }
        );
        break;

      case 'reviews':
        result = await Post.findByIdAndUpdate(
          contentId,
          {
            status,
            statusReason: reason,
            reviewedAt: new Date()
          },
          { new: true }
        );
        break;

      default:
        return res.status(400).json({
          success: false,
          message: '无效的内容类型'
        });
    }

    if (!result) {
      return res.status(404).json({
        success: false,
        message: '未找到内容'
      });
    }

    logger.info(`Content reviewed: ${type}/${contentId}, status: ${status}`);

    res.json({
      success: true,
      message: '内容审核成功',
      data: result
    });
  } catch (error) {
    logger.error('Review content failed:', error);
    res.status(500).json({
      success: false,
      message: '审核内容失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取举报列表
const getReports = async (req, res) => {
  try {
    const { 
      type,
      status,
      page = 1,
      limit = 10
    } = req.query;

    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('reporterId', 'username avatar')
      .populate('targetId');

    const total = await Report.countDocuments(query);

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get reports failed:', error);
    res.status(500).json({
      success: false,
      message: '获取举报列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 处理举报
const handleReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, action, reason } = req.body;

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const report = await Report.findByIdAndUpdate(
      reportId,
      {
        status,
        handledAction: action,
        handledReason: reason,
        handledAt: new Date()
      },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: '未找到举报'
      });
    }

    // 如果需要对举报目标采取行动
    if (action && action !== 'ignore') {
      switch (report.type) {
        case 'user':
          await User.findByIdAndUpdate(report.targetId, {
            status: action === 'ban' ? 'banned' : 'warning',
            statusReason: reason
          });
          break;

        case 'post':
          await Post.findByIdAndUpdate(report.targetId, {
            status: action === 'delete' ? 'deleted' : 'warning',
            statusReason: reason
          });
          break;

        case 'review':
          await Post.findByIdAndUpdate(report.targetId, {
            status: action === 'delete' ? 'deleted' : 'warning',
            statusReason: reason
          });
          break;
      }
    }

    logger.info(`Report handled: ${reportId}, status: ${status}, action: ${action}`);

    res.json({
      success: true,
      message: '举报处理成功',
      data: report
    });
  } catch (error) {
    logger.error('Handle report failed:', error);
    res.status(500).json({
      success: false,
      message: '处理举报失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取反馈列表
const getFeedbacks = async (req, res) => {
  try {
    const { 
      status,
      type,
      page = 1,
      limit = 10
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const skip = (page - 1) * limit;
    const feedbacks = await Feedback.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username email');

    const total = await Feedback.countDocuments(query);

    res.json({
      success: true,
      data: {
        feedbacks,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get feedbacks failed:', error);
    res.status(500).json({
      success: false,
      message: '获取反馈列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 回复反馈
const replyFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { reply } = req.body;

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: '未找到反馈'
      });
    }

    feedback.reply = reply;
    feedback.status = 'replied';
    feedback.replyAt = new Date();
    await feedback.save();

    logger.info(`Feedback replied: ${feedbackId}`);

    res.json({
      success: true,
      message: '反馈回复成功',
      data: feedback
    });
  } catch (error) {
    logger.error('Reply feedback failed:', error);
    res.status(500).json({
      success: false,
      message: '回复反馈失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getSystemConfig,
  updateSystemConfig,
  getUsers,
  updateUserStatus,
  getPendingContent,
  reviewContent,
  getReports,
  handleReport,
  getFeedbacks,
  replyFeedback
};
