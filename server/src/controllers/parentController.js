const ParentProfile = require('../models/user/ParentProfile');
const User = require('../models/user/User');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Post = require('../models/Post');
const Favorite = require('../models/Favorite');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Payment = require('../models/Payment');

// 获取家长个人信息
const getProfile = async (req, res) => {
  try {
    const { userId } = req.user;
    const profile = await ParentProfile.findOne({ userId })
      .populate('userId', 'email username');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: '未找到家长信息'
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    logger.error('Get parent profile failed:', error);
    res.status(500).json({
      success: false,
      message: '获取家长信息失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 更新家长基本信息
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

    const profile = await ParentProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: '未找到家长信息'
      });
    }

    // 更新基本信息
    const allowedUpdates = ['name', 'avatar', 'location', 'preferences'];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        profile[field] = updates[field];
      }
    });

    await profile.save();
    logger.info(`Parent profile updated for user: ${userId}`);

    res.json({
      success: true,
      message: '基本信息更新成功',
      data: profile
    });
  } catch (error) {
    logger.error('Update parent basic info failed:', error);
    res.status(500).json({
      success: false,
      message: '更新基本信息失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取所有孩子信息
const getChildren = async (req, res) => {
  try {
    const { userId } = req.user;
    const profile = await ParentProfile.findOne({ userId });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: '未找到家长信息'
      });
    }

    res.json({
      success: true,
      data: profile.children
    });
  } catch (error) {
    logger.error('Get children failed:', error);
    res.status(500).json({
      success: false,
      message: '获取孩子信息失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取单个孩子信息
const getChild = async (req, res) => {
  try {
    const { userId } = req.user;
    const { childId } = req.params;

    const profile = await ParentProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: '未找到家长信息'
      });
    }

    const child = profile.children.id(childId);
    if (!child) {
      return res.status(404).json({
        success: false,
        message: '未找到指定孩子'
      });
    }

    res.json({
      success: true,
      data: child
    });
  } catch (error) {
    logger.error('Get child failed:', error);
    res.status(500).json({
      success: false,
      message: '获取孩子信息失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 添加孩子
const addChild = async (req, res) => {
  try {
    const { userId } = req.user;
    const childData = req.body;

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const profile = await ParentProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: '未找到家长信息'
      });
    }

    // 检查孩子数量限制
    if (profile.children.length >= 5) {
      return res.status(400).json({
        success: false,
        message: '最多只能添加5个孩子'
      });
    }

    // 添加孩子信息
    profile.children.push(childData);
    await profile.save();
    logger.info(`Child added for parent: ${userId}`);

    res.json({
      success: true,
      message: '孩子添加成功',
      data: profile.children[profile.children.length - 1]
    });
  } catch (error) {
    logger.error('Add child failed:', error);
    res.status(500).json({
      success: false,
      message: '添加孩子失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 更新孩子信息
const updateChild = async (req, res) => {
  try {
    const { userId } = req.user;
    const { childId } = req.params;
    const updates = req.body;

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const profile = await ParentProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: '未找到家长信息'
      });
    }

    // 查找对应的孩子
    const child = profile.children.id(childId);
    if (!child) {
      return res.status(404).json({
        success: false,
        message: '未找到指定孩子'
      });
    }

    // 更新孩子信息
    const allowedUpdates = ['name', 'grade', 'school', 'subjects', 'birthDate', 'gender'];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        child[field] = updates[field];
      }
    });

    await profile.save();
    logger.info(`Child info updated for parent: ${userId}, child: ${child.name}`);

    res.json({
      success: true,
      message: '孩子信息更新成功',
      data: child
    });
  } catch (error) {
    logger.error('Update child info failed:', error);
    res.status(500).json({
      success: false,
      message: '更新孩子信息失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 删除孩子
const removeChild = async (req, res) => {
  try {
    const { userId } = req.user;
    const { childId } = req.params;

    const profile = await ParentProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: '未找到家长信息'
      });
    }

    // 查找并删除孩子
    const child = profile.children.id(childId);
    if (!child) {
      return res.status(404).json({
        success: false,
        message: '未找到指定孩子'
      });
    }

    child.remove();
    await profile.save();
    logger.info(`Child removed for parent: ${userId}, child: ${childId}`);

    res.json({
      success: true,
      message: '孩子信息删除成功'
    });
  } catch (error) {
    logger.error('Remove child failed:', error);
    res.status(500).json({
      success: false,
      message: '删除孩子失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 更新教育偏好
const updatePreferences = async (req, res) => {
  try {
    const { userId } = req.user;
    const { preferences } = req.body;

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const profile = await ParentProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: '未找到家长信息'
      });
    }

    profile.preferences = preferences;
    await profile.save();
    logger.info(`Preferences updated for parent: ${userId}`);

    res.json({
      success: true,
      message: '教育偏好更新成功',
      data: profile.preferences
    });
  } catch (error) {
    logger.error('Update preferences failed:', error);
    res.status(500).json({
      success: false,
      message: '更新教育偏好失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取发布的帖子
const getPosts = async (req, res) => {
  try {
    const { userId } = req.user;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { parentId: userId };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('applications', 'teacherId status');

    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get posts failed:', error);
    res.status(500).json({
      success: false,
      message: '获取帖子失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取收藏的教师
const getFavoriteTeachers = async (req, res) => {
  try {
    const { userId } = req.user;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;
    const favorites = await Favorite.find({ userId, type: 'teacher' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('teacherId');

    const total = await Favorite.countDocuments({ userId, type: 'teacher' });

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
    logger.error('Get favorite teachers failed:', error);
    res.status(500).json({
      success: false,
      message: '获取收藏教师失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取订单记录
const getOrders = async (req, res) => {
  try {
    const { userId } = req.user;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { parentId: userId };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('teacherId', 'name avatar')
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
    logger.error('Get orders failed:', error);
    res.status(500).json({
      success: false,
      message: '获取订单记录失败',
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
    const reviews = await Review.find({ parentId: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('teacherId', 'name avatar')
      .populate('orderId');

    const total = await Review.countDocuments({ parentId: userId });

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

// 添加评价
const addReview = async (req, res) => {
  try {
    const { userId } = req.user;
    const { orderId, teacherId, rating, content } = req.body;

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // 检查订单是否存在且属于该用户
    const order = await Order.findOne({
      _id: orderId,
      parentId: userId,
      status: 'completed'
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '未找到可评价的订单'
      });
    }

    // 检查是否已评价
    const existingReview = await Review.findOne({ orderId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: '该订单已评价'
      });
    }

    // 创建评价
    const review = new Review({
      parentId: userId,
      teacherId,
      orderId,
      rating,
      content
    });

    await review.save();
    logger.info(`Review added for order: ${orderId}`);

    res.json({
      success: true,
      message: '评价添加成功',
      data: review
    });
  } catch (error) {
    logger.error('Add review failed:', error);
    res.status(500).json({
      success: false,
      message: '添加评价失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取支付记录
const getPayments = async (req, res) => {
  try {
    const { userId } = req.user;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('orderId');

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get payments failed:', error);
    res.status(500).json({
      success: false,
      message: '获取支付记录失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 创建支付订单
const createPayment = async (req, res) => {
  try {
    const { userId } = req.user;
    const { orderId, paymentMethod } = req.body;

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // 检查订单是否存在且属于该用户
    const order = await Order.findOne({
      _id: orderId,
      parentId: userId,
      paymentStatus: 'pending'
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '未找到可支付的订单'
      });
    }

    // 创建支付记录
    const payment = new Payment({
      userId,
      orderId,
      amount: order.amount,
      paymentMethod,
      status: 'pending'
    });

    await payment.save();
    logger.info(`Payment created for order: ${orderId}`);

    // TODO: 调用支付网关接口
    // const paymentResult = await paymentGateway.createPayment({
    //   orderId: payment._id,
    //   amount: payment.amount,
    //   method: paymentMethod
    // });

    res.json({
      success: true,
      message: '支付订单创建成功',
      data: {
        payment,
        // paymentUrl: paymentResult.url
      }
    });
  } catch (error) {
    logger.error('Create payment failed:', error);
    res.status(500).json({
      success: false,
      message: '创建支付订单失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getProfile,
  updateBasicInfo,
  getChildren,
  getChild,
  addChild,
  updateChild,
  removeChild,
  updatePreferences,
  getPosts,
  getFavoriteTeachers,
  getOrders,
  getReviews,
  addReview,
  getPayments,
  createPayment
};
