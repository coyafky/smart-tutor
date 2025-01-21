const Post = require('../models/Post');
const Application = require('../models/Application');
const User = require('../models/user/User');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// 创建帖子
const createPost = async (req, res) => {
  try {
    const { userId } = req.user;
    const postData = req.body;

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // 创建帖子
    const post = new Post({
      parentId: userId,
      ...postData,
      status: 'pending' // 需要管理员审核
    });

    await post.save();
    logger.info(`Post created: ${post._id}`);

    res.json({
      success: true,
      message: '帖子创建成功，等待审核',
      data: post
    });
  } catch (error) {
    logger.error('Create post failed:', error);
    res.status(500).json({
      success: false,
      message: '创建帖子失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 更新帖子
const updatePost = async (req, res) => {
  try {
    const { userId } = req.user;
    const { postId } = req.params;
    const updates = req.body;

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // 查找并验证帖子
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

    // 只有待审核或被拒绝的帖子可以修改
    if (!['pending', 'rejected'].includes(post.status)) {
      return res.status(400).json({
        success: false,
        message: '当前状态的帖子不能修改'
      });
    }

    // 更新帖子
    const allowedUpdates = [
      'subject',
      'grade',
      'description',
      'price',
      'schedule',
      'location',
      'teacherPreferences'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        post[field] = updates[field];
      }
    });

    post.status = 'pending'; // 修改后需要重新审核
    await post.save();
    logger.info(`Post updated: ${postId}`);

    res.json({
      success: true,
      message: '帖子更新成功，等待审核',
      data: post
    });
  } catch (error) {
    logger.error('Update post failed:', error);
    res.status(500).json({
      success: false,
      message: '更新帖子失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 删除帖子
const deletePost = async (req, res) => {
  try {
    const { userId } = req.user;
    const { postId } = req.params;

    // 查找并验证帖子
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

    // 只有没有进行中的应聘才能删除
    const hasActiveApplications = await Application.exists({
      postId,
      status: { $in: ['accepted', 'in_progress'] }
    });

    if (hasActiveApplications) {
      return res.status(400).json({
        success: false,
        message: '帖子有进行中的应聘，无法删除'
      });
    }

    await post.remove();
    logger.info(`Post deleted: ${postId}`);

    res.json({
      success: true,
      message: '帖子删除成功'
    });
  } catch (error) {
    logger.error('Delete post failed:', error);
    res.status(500).json({
      success: false,
      message: '删除帖子失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取帖子列表
const getPosts = async (req, res) => {
  try {
    const {
      subject,
      grade,
      location,
      priceRange,
      status,
      sort = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // 构建查询条件
    const query = { status: 'approved' }; // 只显示已审核的帖子
    if (subject) query.subject = subject;
    if (grade) query.grade = grade;
    if (location) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: location.split(',').map(Number)
          },
          $maxDistance: 5000 // 5公里内
        }
      };
    }
    if (priceRange) {
      const [min, max] = priceRange.split(',').map(Number);
      query.price = { $gte: min, $lte: max };
    }
    if (status) query.status = status;

    // 构建排序
    const sortOptions = {};
    sortOptions[sort] = order === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;
    const posts = await Post.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('parentId', 'username')
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
      message: '获取帖子列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取帖子详情
const getPostDetail = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId)
      .populate('parentId', 'username avatar')
      .populate({
        path: 'applications',
        populate: {
          path: 'teacherId',
          select: 'username avatar teachingExperience education'
        }
      });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: '未找到帖子'
      });
    }

    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    logger.error('Get post detail failed:', error);
    res.status(500).json({
      success: false,
      message: '获取帖子详情失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 搜索帖子
const searchPosts = async (req, res) => {
  try {
    const { keyword, page = 1, limit = 10 } = req.query;

    const query = {
      status: 'approved',
      $or: [
        { subject: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ]
    };

    const skip = (page - 1) * limit;
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('parentId', 'username')
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
    logger.error('Search posts failed:', error);
    res.status(500).json({
      success: false,
      message: '搜索帖子失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createPost,
  updatePost,
  deletePost,
  getPosts,
  getPostDetail,
  searchPosts
};
