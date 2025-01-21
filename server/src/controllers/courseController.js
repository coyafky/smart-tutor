const Contract = require('../models/Contract');
const Schedule = require('../models/Schedule');
const Course = require('../models/Course');
const Payment = require('../models/Payment');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// 创建课程合同
const createContract = async (req, res) => {
  try {
    const { userId } = req.user;
    const { postId, teacherId, schedule, price } = req.body;

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // 创建合同
    const contract = new Contract({
      postId,
      teacherId,
      parentId: userId,
      schedule,
      price,
      status: 'pending'
    });

    await contract.save();
    logger.info(`Contract created: ${contract._id}`);

    res.json({
      success: true,
      message: '合同创建成功',
      data: contract
    });
  } catch (error) {
    logger.error('Create contract failed:', error);
    res.status(500).json({
      success: false,
      message: '创建合同失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 确认课程合同（教师）
const confirmContract = async (req, res) => {
  try {
    const { userId } = req.user;
    const { contractId } = req.params;
    const { action, reason } = req.body;

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // 查找合同
    const contract = await Contract.findOne({
      _id: contractId,
      teacherId: userId,
      status: 'pending'
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: '未找到待确认的合同'
      });
    }

    // 更新合同状态
    contract.status = action === 'accept' ? 'confirmed' : 'rejected';
    if (reason) contract.statusReason = reason;
    await contract.save();

    // 如果接受合同，创建课程
    if (action === 'accept') {
      const course = new Course({
        contractId: contract._id,
        teacherId: contract.teacherId,
        parentId: contract.parentId,
        schedule: contract.schedule,
        status: 'active'
      });

      await course.save();
      logger.info(`Course created: ${course._id}`);

      return res.json({
        success: true,
        message: '合同已确认，课程已创建',
        data: {
          contract,
          course
        }
      });
    }

    res.json({
      success: true,
      message: '合同已处理',
      data: contract
    });
  } catch (error) {
    logger.error('Confirm contract failed:', error);
    res.status(500).json({
      success: false,
      message: '处理合同失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 创建课程安排
const createSchedule = async (req, res) => {
  try {
    const { userId } = req.user;
    const { courseId } = req.params;
    const { scheduleData } = req.body;

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // 查找课程
    const course = await Course.findOne({
      _id: courseId,
      teacherId: userId,
      status: 'active'
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: '未找到可安排的课程'
      });
    }

    // 创建课程安排
    const schedules = await Schedule.insertMany(
      scheduleData.map(data => ({
        courseId,
        teacherId: userId,
        parentId: course.parentId,
        ...data,
        type: 'regular',
        status: 'pending'
      }))
    );

    logger.info(`Schedules created for course: ${courseId}`);

    res.json({
      success: true,
      message: '课程安排创建成功',
      data: schedules
    });
  } catch (error) {
    logger.error('Create schedule failed:', error);
    res.status(500).json({
      success: false,
      message: '创建课程安排失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 更新课程安排状态
const updateScheduleStatus = async (req, res) => {
  try {
    const { userId } = req.user;
    const { scheduleId } = req.params;
    const { status, reason } = req.body;

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // 查找课程安排
    const schedule = await Schedule.findOne({
      _id: scheduleId,
      $or: [{ teacherId: userId }, { parentId: userId }]
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: '未找到课程安排'
      });
    }

    // 更新状态
    schedule.status = status;
    if (reason) schedule.statusReason = reason;
    await schedule.save();

    logger.info(`Schedule status updated: ${scheduleId}, status: ${status}`);

    res.json({
      success: true,
      message: '课程安排状态更新成功',
      data: schedule
    });
  } catch (error) {
    logger.error('Update schedule status failed:', error);
    res.status(500).json({
      success: false,
      message: '更新课程安排状态失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取课程列表（教师）
const getTeacherCourses = async (req, res) => {
  try {
    const { userId } = req.user;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { teacherId: userId };
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const courses = await Course.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('parentId', 'username avatar')
      .populate('contractId');

    const total = await Course.countDocuments(query);

    res.json({
      success: true,
      data: {
        courses,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get teacher courses failed:', error);
    res.status(500).json({
      success: false,
      message: '获取课程列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取课程列表（家长）
const getParentCourses = async (req, res) => {
  try {
    const { userId } = req.user;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { parentId: userId };
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const courses = await Course.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('teacherId', 'username avatar teachingExperience')
      .populate('contractId');

    const total = await Course.countDocuments(query);

    res.json({
      success: true,
      data: {
        courses,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get parent courses failed:', error);
    res.status(500).json({
      success: false,
      message: '获取课程列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取课程详情
const getCourseDetail = async (req, res) => {
  try {
    const { userId } = req.user;
    const { courseId } = req.params;

    const course = await Course.findOne({
      _id: courseId,
      $or: [{ teacherId: userId }, { parentId: userId }]
    })
      .populate('teacherId', 'username avatar teachingExperience')
      .populate('parentId', 'username avatar')
      .populate('contractId');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: '未找到课程'
      });
    }

    // 获取课程安排
    const schedules = await Schedule.find({
      courseId,
      type: 'regular'
    }).sort({ startTime: 1 });

    res.json({
      success: true,
      data: {
        course,
        schedules
      }
    });
  } catch (error) {
    logger.error('Get course detail failed:', error);
    res.status(500).json({
      success: false,
      message: '获取课程详情失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 结束课程
const endCourse = async (req, res) => {
  try {
    const { userId } = req.user;
    const { courseId } = req.params;
    const { reason } = req.body;

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // 查找课程
    const course = await Course.findOne({
      _id: courseId,
      $or: [{ teacherId: userId }, { parentId: userId }],
      status: 'active'
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: '未找到可结束的课程'
      });
    }

    // 更新课程状态
    course.status = 'completed';
    course.endReason = reason;
    course.endedAt = new Date();
    await course.save();

    // 取消未完成的课程安排
    await Schedule.updateMany(
      {
        courseId,
        status: 'pending'
      },
      {
        status: 'cancelled',
        statusReason: '课程已结束'
      }
    );

    logger.info(`Course ended: ${courseId}`);

    res.json({
      success: true,
      message: '课程已结束',
      data: course
    });
  } catch (error) {
    logger.error('End course failed:', error);
    res.status(500).json({
      success: false,
      message: '结束课程失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createContract,
  confirmContract,
  createSchedule,
  updateScheduleStatus,
  getTeacherCourses,
  getParentCourses,
  getCourseDetail,
  endCourse
};
