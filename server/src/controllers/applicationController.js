const Application = require('../models/Application');
const Post = require('../models/Post');
const Contract = require('../models/Contract');
const Schedule = require('../models/Schedule');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// 创建应聘申请
const createApplication = async (req, res) => {
  try {
    const { userId } = req.user;
    const { postId } = req.params;
    const { introduction, availableTime, expectedPrice } = req.body;

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // 检查帖子是否存在且状态为已审核
    const post = await Post.findOne({
      _id: postId,
      status: 'approved'
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: '未找到可应聘的帖子'
      });
    }

    // 检查是否已经应聘过
    const existingApplication = await Application.findOne({
      postId,
      teacherId: userId
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: '您已经应聘过该帖子'
      });
    }

    // 创建应聘申请
    const application = new Application({
      postId,
      teacherId: userId,
      introduction,
      availableTime,
      expectedPrice,
      status: 'pending'
    });

    await application.save();

    // 更新帖子的应聘记录
    post.applications.push(application._id);
    await post.save();

    logger.info(`Application created: ${application._id}`);

    res.json({
      success: true,
      message: '应聘申请提交成功',
      data: application
    });
  } catch (error) {
    logger.error('Create application failed:', error);
    res.status(500).json({
      success: false,
      message: '提交应聘申请失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 更新应聘状态（家长处理应聘）
const updateApplicationStatus = async (req, res) => {
  try {
    const { userId } = req.user;
    const { applicationId } = req.params;
    const { status, reason } = req.body;

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // 查找应聘记录
    const application = await Application.findById(applicationId)
      .populate('postId');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: '未找到应聘记录'
      });
    }

    // 验证是否是帖子发布者
    if (application.postId.parentId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权操作此应聘记录'
      });
    }

    // 更新状态
    application.status = status;
    if (reason) application.statusReason = reason;
    await application.save();

    logger.info(`Application status updated: ${applicationId}, status: ${status}`);

    // 如果接受应聘，创建试听课程安排
    if (status === 'accepted') {
      const schedule = new Schedule({
        postId: application.postId._id,
        teacherId: application.teacherId,
        parentId: userId,
        type: 'trial',
        status: 'pending'
      });

      await schedule.save();
      logger.info(`Trial schedule created: ${schedule._id}`);

      return res.json({
        success: true,
        message: '应聘已接受，已创建试听课程安排',
        data: {
          application,
          schedule
        }
      });
    }

    res.json({
      success: true,
      message: '应聘状态更新成功',
      data: application
    });
  } catch (error) {
    logger.error('Update application status failed:', error);
    res.status(500).json({
      success: false,
      message: '更新应聘状态失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 确认试听结果
const confirmTrialResult = async (req, res) => {
  try {
    const { userId } = req.user;
    const { scheduleId } = req.params;
    const { result, comment } = req.body;

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // 查找试听课程
    const schedule = await Schedule.findOne({
      _id: scheduleId,
      parentId: userId,
      type: 'trial'
    }).populate('postId teacherId');

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: '未找到试听课程记录'
      });
    }

    // 更新试听结果
    schedule.status = result ? 'completed' : 'failed';
    schedule.comment = comment;
    await schedule.save();

    // 如果试听通过，创建合同
    if (result) {
      const contract = new Contract({
        postId: schedule.postId._id,
        teacherId: schedule.teacherId._id,
        parentId: userId,
        schedule: schedule.postId.schedule,
        price: schedule.postId.price,
        status: 'pending'
      });

      await contract.save();
      logger.info(`Contract created: ${contract._id}`);

      return res.json({
        success: true,
        message: '试听通过，已创建合同',
        data: {
          schedule,
          contract
        }
      });
    }

    res.json({
      success: true,
      message: '试听结果已确认',
      data: schedule
    });
  } catch (error) {
    logger.error('Confirm trial result failed:', error);
    res.status(500).json({
      success: false,
      message: '确认试听结果失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取应聘列表（教师）
const getTeacherApplications = async (req, res) => {
  try {
    const { userId } = req.user;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { teacherId: userId };
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const applications = await Application.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'postId',
        populate: {
          path: 'parentId',
          select: 'username avatar'
        }
      });

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
    logger.error('Get teacher applications failed:', error);
    res.status(500).json({
      success: false,
      message: '获取应聘列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取应聘列表（家长）
const getParentApplications = async (req, res) => {
  try {
    const { userId } = req.user;
    const { postId, status, page = 1, limit = 10 } = req.query;

    // 首先验证帖子是否属于该家长
    if (postId) {
      const post = await Post.findOne({
        _id: postId,
        parentId: userId
      });

      if (!post) {
        return res.status(404).json({
          success: false,
          message: '未找到帖子'
        });
      }
    }

    const query = {};
    if (postId) query.postId = postId;
    if (status) query.status = status;

    // 查找该家长所有帖子的应聘记录
    const posts = await Post.find({ parentId: userId });
    query.postId = { $in: posts.map(post => post._id) };

    const skip = (page - 1) * limit;
    const applications = await Application.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('teacherId', 'username avatar teachingExperience education')
      .populate('postId');

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
    logger.error('Get parent applications failed:', error);
    res.status(500).json({
      success: false,
      message: '获取应聘列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 取消应聘申请（教师）
const cancelApplication = async (req, res) => {
  try {
    const { userId } = req.user;
    const { applicationId } = req.params;
    const { reason } = req.body;

    // 查找应聘记录
    const application = await Application.findOne({
      _id: applicationId,
      teacherId: userId,
      status: 'pending' // 只能取消待处理的应聘
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: '未找到可取消的应聘记录'
      });
    }

    // 更新状态
    application.status = 'cancelled';
    if (reason) application.cancelReason = reason;
    await application.save();

    // 从帖子的应聘记录中移除
    await Post.findByIdAndUpdate(application.postId, {
      $pull: { applications: applicationId }
    });

    logger.info(`Application cancelled: ${applicationId}`);

    res.json({
      success: true,
      message: '应聘申请已取消',
      data: application
    });
  } catch (error) {
    logger.error('Cancel application failed:', error);
    res.status(500).json({
      success: false,
      message: '取消应聘申请失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createApplication,
  updateApplicationStatus,
  confirmTrialResult,
  getTeacherApplications,
  getParentApplications,
  cancelApplication
};
