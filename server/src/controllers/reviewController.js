const Review = require('../models/Review');
const Course = require('../models/Course');
const TeacherProfile = require('../models/user/TeacherProfile');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// 创建评价
const createReview = async (req, res) => {
  try {
    const { userId } = req.user;
    const { courseId, rating, content, tags } = req.body;

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
      parentId: userId,
      status: 'completed'
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: '未找到可评价的课程'
      });
    }

    // 检查是否已评价
    const existingReview = await Review.findOne({
      courseId,
      parentId: userId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: '该课程已评价'
      });
    }

    // 创建评价
    const review = new Review({
      courseId,
      teacherId: course.teacherId,
      parentId: userId,
      rating,
      content,
      tags,
      status: 'pending'
    });

    await review.save();

    // 更新课程评价状态
    course.reviewed = true;
    await course.save();

    logger.info(`Review created: ${review._id}`);

    res.json({
      success: true,
      message: '评价提交成功',
      data: review
    });
  } catch (error) {
    logger.error('Create review failed:', error);
    res.status(500).json({
      success: false,
      message: '创建评价失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 回复评价
const replyToReview = async (req, res) => {
  try {
    const { userId } = req.user;
    const { reviewId } = req.params;
    const { content } = req.body;

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // 查找评价
    const review = await Review.findOne({
      _id: reviewId,
      teacherId: userId,
      status: { $in: ['pending', 'approved'] }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: '未找到可回复的评价'
      });
    }

    // 更新评价
    review.reply = content;
    review.replyAt = new Date();
    await review.save();

    logger.info(`Review replied: ${reviewId}`);

    res.json({
      success: true,
      message: '评价回复成功',
      data: review
    });
  } catch (error) {
    logger.error('Reply to review failed:', error);
    res.status(500).json({
      success: false,
      message: '回复评价失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 更新评价状态（管理员）
const updateReviewStatus = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { status, reason } = req.body;

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // 更新评价状态
    const review = await Review.findByIdAndUpdate(
      reviewId,
      {
        status,
        statusReason: reason
      },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: '未找到评价'
      });
    }

    // 如果评价被批准，更新教师评分
    if (status === 'approved') {
      const teacherProfile = await TeacherProfile.findOne({
        userId: review.teacherId
      });

      if (teacherProfile) {
        // 重新计算平均评分
        const reviews = await Review.find({
          teacherId: review.teacherId,
          status: 'approved'
        });

        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = totalRating / reviews.length;

        teacherProfile.rating = averageRating;
        teacherProfile.reviewCount = reviews.length;

        // 更新标签统计
        const tagCounts = {};
        reviews.forEach(r => {
          r.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        });
        teacherProfile.tagStats = Object.entries(tagCounts).map(([tag, count]) => ({
          tag,
          count
        }));

        await teacherProfile.save();
      }
    }

    logger.info(`Review status updated: ${reviewId}, status: ${status}`);

    res.json({
      success: true,
      message: '评价状态更新成功',
      data: review
    });
  } catch (error) {
    logger.error('Update review status failed:', error);
    res.status(500).json({
      success: false,
      message: '更新评价状态失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取教师评价列表
const getTeacherReviews = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { 
      teacherId,
      status: status || 'approved'
    };

    const skip = (page - 1) * limit;
    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('parentId', 'username avatar')
      .populate('courseId');

    const total = await Review.countDocuments(query);

    // 获取评分统计
    const stats = await Review.aggregate([
      { $match: { teacherId: mongoose.Types.ObjectId(teacherId), status: 'approved' } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    // 计算评分分布
    const distribution = stats[0] ? {
      5: stats[0].ratingDistribution.filter(r => r === 5).length,
      4: stats[0].ratingDistribution.filter(r => r === 4).length,
      3: stats[0].ratingDistribution.filter(r => r === 3).length,
      2: stats[0].ratingDistribution.filter(r => r === 2).length,
      1: stats[0].ratingDistribution.filter(r => r === 1).length
    } : null;

    res.json({
      success: true,
      data: {
        reviews,
        stats: stats[0] ? {
          averageRating: stats[0].averageRating,
          totalReviews: stats[0].totalReviews,
          distribution
        } : null,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get teacher reviews failed:', error);
    res.status(500).json({
      success: false,
      message: '获取教师评价失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取家长评价列表
const getParentReviews = async (req, res) => {
  try {
    const { userId } = req.user;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { parentId: userId };
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('teacherId', 'username avatar')
      .populate('courseId');

    const total = await Review.countDocuments(query);

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
    logger.error('Get parent reviews failed:', error);
    res.status(500).json({
      success: false,
      message: '获取家长评价失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 删除评价（管理员）
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const review = await Review.findByIdAndUpdate(
      reviewId,
      {
        status: 'deleted',
        statusReason: reason
      },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: '未找到评价'
      });
    }

    // 重新计算教师评分
    const teacherProfile = await TeacherProfile.findOne({
      userId: review.teacherId
    });

    if (teacherProfile) {
      const reviews = await Review.find({
        teacherId: review.teacherId,
        status: 'approved'
      });

      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

      teacherProfile.rating = averageRating;
      teacherProfile.reviewCount = reviews.length;

      // 更新标签统计
      const tagCounts = {};
      reviews.forEach(r => {
        r.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });
      teacherProfile.tagStats = Object.entries(tagCounts).map(([tag, count]) => ({
        tag,
        count
      }));

      await teacherProfile.save();
    }

    logger.info(`Review deleted: ${reviewId}`);

    res.json({
      success: true,
      message: '评价已删除',
      data: review
    });
  } catch (error) {
    logger.error('Delete review failed:', error);
    res.status(500).json({
      success: false,
      message: '删除评价失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createReview,
  replyToReview,
  updateReviewStatus,
  getTeacherReviews,
  getParentReviews,
  deleteReview
};
