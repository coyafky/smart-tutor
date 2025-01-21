const TeacherProfile = require('../models/user/TeacherProfile');
const User = require('../models/user/User');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Application = require('../models/Application');
const Favorite = require('../models/Favorite');
const Schedule = require('../models/Schedule');
const Review = require('../models/Review');
const Order = require('../models/Order');

// 获取教师个人信息
const getProfile = async (req, res) => {
  try {
    const { userId } = req.user;
    const profile = await TeacherProfile.findOne({ userId })
      .populate('userId', 'email username');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: '未找到教师信息'
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    logger.error('Get teacher profile failed:', error);
    res.status(500).json({
      success: false,
      message: '获取教师信息失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 更新教师基本信息
const updateBasicInfo = async (req, res) => {
  try {
    const { userId } = req.user;
    const updates = req.body;

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const profile = await TeacherProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: '未找到教师信息'
      });
    }

    // 更新基本信息
    const allowedUpdates = ['name', 'avatar', 'introduction', 'education', 'certificates', 'location'];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        profile[field] = updates[field];
      }
    });

    await profile.save();
    logger.info(`Teacher profile updated for user: ${userId}`);

    res.json({
      success: true,
      message: '基本信息更新成功',
      data: profile
    });
  } catch (error) {
    logger.error('Update teacher basic info failed:', error);
    res.status(500).json({
      success: false,
      message: '更新基本信息失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 更新教学信息
const updateTeachingInfo = async (req, res) => {
  try {
    const { userId } = req.user;
    const { subjects, availableTime, pricing } = req.body;

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const profile = await TeacherProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: '未找到教师信息'
      });
    }

    // 更新教学信息
    if (subjects) profile.subjects = subjects;
    if (availableTime) profile.availableTime = availableTime;
    if (pricing) profile.pricing = pricing;

    await profile.save();
    logger.info(`Teaching info updated for teacher: ${userId}`);

    res.json({
      success: true,
      message: '教学信息更新成功',
      data: profile
    });
  } catch (error) {
    logger.error('Update teaching info failed:', error);
    res.status(500).json({
      success: false,
      message: '更新教学信息失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 添加成功案例
const addSuccessCase = async (req, res) => {
  try {
    const { userId } = req.user;
    const { subjectId, successCase } = req.body;

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const profile = await TeacherProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: '未找到教师信息'
      });
    }

    // 查找对应科目
    const subject = profile.subjects.id(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: '未找到指定科目'
      });
    }

    // 添加成功案例
    subject.successCases.push(successCase);
    await profile.save();
    logger.info(`Success case added for teacher: ${userId}, subject: ${subject.name}`);

    res.json({
      success: true,
      message: '成功案例添加成功',
      data: subject.successCases[subject.successCases.length - 1]
    });
  } catch (error) {
    logger.error('Add success case failed:', error);
    res.status(500).json({
      success: false,
      message: '添加成功案例失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 删除成功案例
const removeSuccessCase = async (req, res) => {
  try {
    const { userId } = req.user;
    const { subjectId, caseId } = req.params;

    const profile = await TeacherProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: '未找到教师信息'
      });
    }

    // 查找对应科目
    const subject = profile.subjects.id(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: '未找到指定科目'
      });
    }

    // 查找并删除成功案例
    const successCase = subject.successCases.id(caseId);
    if (!successCase) {
      return res.status(404).json({
        success: false,
        message: '未找到指定成功案例'
      });
    }

    successCase.remove();
    await profile.save();
    logger.info(`Success case removed for teacher: ${userId}, subject: ${subject.name}`);

    res.json({
      success: true,
      message: '成功案例删除成功'
    });
  } catch (error) {
    logger.error('Remove success case failed:', error);
    res.status(500).json({
      success: false,
      message: '删除成功案例失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 更新可用时间
const updateAvailableTime = async (req, res) => {
  try {
    const { userId } = req.user;
    const { availableTime } = req.body;

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const profile = await TeacherProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: '未找到教师信息'
      });
    }

    profile.availableTime = availableTime;
    await profile.save();
    logger.info(`Available time updated for teacher: ${userId}`);

    res.json({
      success: true,
      message: '可用时间更新成功',
      data: profile.availableTime
    });
  } catch (error) {
    logger.error('Update available time failed:', error);
    res.status(500).json({
      success: false,
      message: '更新可用时间失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取应聘记录
const getApplicationRecords = async (req, res) => {
  try {
    const { userId } = req.user;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { teacherId: userId };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const applications = await Application.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('postId', 'title content');

    const total = await Application.countDocuments(query);

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get application records failed:', error);
    res.status(500).json({
      success: false,
      message: '获取应聘记录失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取收藏的帖子
const getFavoritePosts = async (req, res) => {
  try {
    const { userId } = req.user;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;
    const favorites = await Favorite.find({ userId, type: 'post' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('postId');

    const total = await Favorite.countDocuments({ userId, type: 'post' });

    res.json({
      success: true,
      data: {
        favorites,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get favorite posts failed:', error);
    res.status(500).json({
      success: false,
      message: '获取收藏帖子失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取课程安排
const getSchedule = async (req, res) => {
  try {
    const { userId } = req.user;
    const { startDate, endDate } = req.query;

    const query = {
      teacherId: userId,
      startTime: { $gte: new Date(startDate) }
    };

    if (endDate) {
      query.endTime = { $lte: new Date(endDate) };
    }

    const schedule = await Schedule.find(query)
      .sort({ startTime: 1 })
      .populate('studentId', 'name grade');

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    logger.error('Get schedule failed:', error);
    res.status(500).json({
      success: false,
      message: '获取课程安排失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 更新课程状态
const updateScheduleStatus = async (req, res) => {
  try {
    const { userId } = req.user;
    const { scheduleId } = req.params;
    const { status, note } = req.body;

    const schedule = await Schedule.findOne({
      _id: scheduleId,
      teacherId: userId
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: '未找到课程记录'
      });
    }

    schedule.status = status;
    if (note) schedule.note = note;
    await schedule.save();

    logger.info(`Schedule status updated: ${scheduleId}, status: ${status}`);

    res.json({
      success: true,
      message: '课程状态更新成功',
      data: schedule
    });
  } catch (error) {
    logger.error('Update schedule status failed:', error);
    res.status(500).json({
      success: false,
      message: '更新课程状态失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取评价记录
const getReviews = async (req, res) => {
  try {
    const { userId } = req.user;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;
    const reviews = await Review.find({ teacherId: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('studentId', 'name grade')
      .populate('orderId');

    const total = await Review.countDocuments({ teacherId: userId });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get reviews failed:', error);
    res.status(500).json({
      success: false,
      message: '获取评价记录失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取收入统计
const getIncomeStats = async (req, res) => {
  try {
    const { userId } = req.user;
    const { startDate, endDate, groupBy = 'month' } = req.query;

    const query = {
      teacherId: userId,
      status: 'completed',
      paymentStatus: 'paid'
    };

    if (startDate) query.completedAt = { $gte: new Date(startDate) };
    if (endDate) query.completedAt = { ...query.completedAt, $lte: new Date(endDate) };

    const orders = await Order.find(query);

    // 按时间分组统计
    const stats = {};
    orders.forEach(order => {
      const date = new Date(order.completedAt);
      let key;
      
      switch(groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          key = date.getFullYear().toString();
          break;
      }

      if (!stats[key]) {
        stats[key] = {
          totalAmount: 0,
          orderCount: 0,
          lessonCount: 0
        };
      }

      stats[key].totalAmount += order.amount;
      stats[key].orderCount += 1;
      stats[key].lessonCount += order.lessonCount || 1;
    });

    res.json({
      success: true,
      data: {
        stats,
        summary: {
          totalAmount: orders.reduce((sum, order) => sum + order.amount, 0),
          totalOrders: orders.length,
          totalLessons: orders.reduce((sum, order) => sum + (order.lessonCount || 1), 0)
        }
      }
    });
  } catch (error) {
    logger.error('Get income stats failed:', error);
    res.status(500).json({
      success: false,
      message: '获取收入统计失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取收入明细
const getIncomeDetails = async (req, res) => {
  try {
    const { userId } = req.user;
    const { startDate, endDate, page = 1, limit = 10 } = req.query;

    const query = {
      teacherId: userId,
      status: 'completed',
      paymentStatus: 'paid'
    };

    if (startDate) query.completedAt = { $gte: new Date(startDate) };
    if (endDate) query.completedAt = { ...query.completedAt, $lte: new Date(endDate) };

    const skip = (page - 1) * limit;
    const orders = await Order.find(query)
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('studentId', 'name grade')
      .populate('courseId');

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get income details failed:', error);
    res.status(500).json({
      success: false,
      message: '获取收入明细失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getProfile,
  updateBasicInfo,
  updateTeachingInfo,
  addSuccessCase,
  removeSuccessCase,
  updateAvailableTime,
  getApplicationRecords,
  getFavoritePosts,
  getSchedule,
  updateScheduleStatus,
  getReviews,
  getIncomeStats,
  getIncomeDetails
};
