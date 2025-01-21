const Post = require('../models/Post');
const User = require('../models/user/User');
const TeacherProfile = require('../models/user/TeacherProfile');
const Review = require('../models/Review');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

// 计算地理位置距离（米）
const calculateDistance = (coord1, coord2) => {
  const R = 6371e3; // 地球半径（米）
  const φ1 = (coord1[1] * Math.PI) / 180;
  const φ2 = (coord2[1] * Math.PI) / 180;
  const Δφ = ((coord2[1] - coord1[1]) * Math.PI) / 180;
  const Δλ = ((coord2[0] - coord1[0]) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// 计算科目匹配度（0-1）
const calculateSubjectMatch = (teacherSubjects, requiredSubject) => {
  const matchingSubject = teacherSubjects.find(
    subject => subject.name === requiredSubject
  );
  return matchingSubject ? 1 : 0;
};

// 计算年级匹配度（0-1）
const calculateGradeMatch = (teacherGrades, requiredGrade) => {
  return teacherGrades.includes(requiredGrade) ? 1 : 0;
};

// 为家长推荐教师
const recommendTeachersForParent = async (req, res) => {
  try {
    const { userId } = req.user;
    const { postId, limit = 10 } = req.query;

    // 获取帖子信息
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

    // 获取所有教师
    const teachers = await TeacherProfile.find()
      .populate('userId', 'username avatar status')
      .populate('reviews');

    // 计算每个教师的综合得分
    const scoredTeachers = await Promise.all(
      teachers.map(async teacher => {
        // 只推荐状态正常的教师
        if (teacher.userId.status !== 'active') {
          return null;
        }

        // 1. 地理位置得分（距离越近得分越高，最大5km）
        const distance = calculateDistance(
          post.location.coordinates,
          teacher.location.coordinates
        );
        const locationScore = Math.max(0, 1 - distance / 5000);

        // 2. 科目匹配得分
        const subjectScore = calculateSubjectMatch(
          teacher.subjects,
          post.subject
        );

        // 3. 年级匹配得分
        const gradeScore = calculateGradeMatch(
          teacher.grades,
          post.grade
        );

        // 4. 评价得分
        const reviews = await Review.find({ teacherId: teacher._id });
        const averageRating = reviews.length > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
          : 0;
        const reviewScore = averageRating / 5;

        // 5. 成功案例得分
        const successScore = Math.min(1, teacher.successCases.length / 10);

        // 6. 价格匹配度（价格越接近需求价格得分越高）
        const priceScore = Math.max(0, 1 - Math.abs(teacher.hourlyRate - post.price) / post.price);

        // 计算综合得分（可以调整各项权重）
        const totalScore =
          locationScore * 0.2 +
          subjectScore * 0.25 +
          gradeScore * 0.2 +
          reviewScore * 0.15 +
          successScore * 0.1 +
          priceScore * 0.1;

        return {
          teacher,
          scores: {
            totalScore,
            locationScore,
            subjectScore,
            gradeScore,
            reviewScore,
            successScore,
            priceScore
          }
        };
      })
    );

    // 过滤掉无效教师并按得分排序
    const recommendations = scoredTeachers
      .filter(item => item !== null)
      .sort((a, b) => b.scores.totalScore - a.scores.totalScore)
      .slice(0, limit);

    logger.info(`Teachers recommended for post: ${postId}`);

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    logger.error('Recommend teachers failed:', error);
    res.status(500).json({
      success: false,
      message: '推荐教师失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 为教师推荐帖子
const recommendPostsForTeacher = async (req, res) => {
  try {
    const { userId } = req.user;
    const { limit = 10 } = req.query;

    // 获取教师信息
    const teacher = await TeacherProfile.findOne({ userId });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: '未找到教师信息'
      });
    }

    // 获取所有未结束的帖子
    const posts = await Post.find({
      status: 'approved',
      'applications.status': { $ne: 'accepted' }
    }).populate('parentId', 'username avatar');

    // 计算每个帖子的综合得分
    const scoredPosts = posts.map(post => {
      // 1. 地理位置得分
      const distance = calculateDistance(
        post.location.coordinates,
        teacher.location.coordinates
      );
      const locationScore = Math.max(0, 1 - distance / 5000);

      // 2. 科目匹配得分
      const subjectScore = calculateSubjectMatch(
        teacher.subjects,
        post.subject
      );

      // 3. 年级匹配得分
      const gradeScore = calculateGradeMatch(
        teacher.grades,
        post.grade
      );

      // 4. 价格匹配度
      const priceScore = Math.max(0, 1 - Math.abs(teacher.hourlyRate - post.price) / post.price);

      // 5. 教师偏好匹配度
      const preferenceScore = post.teacherPreferences.every(
        pref => teacher[pref.key] === pref.value
      )
        ? 1
        : 0;

      // 计算综合得分
      const totalScore =
        locationScore * 0.25 +
        subjectScore * 0.25 +
        gradeScore * 0.2 +
        priceScore * 0.15 +
        preferenceScore * 0.15;

      return {
        post,
        scores: {
          totalScore,
          locationScore,
          subjectScore,
          gradeScore,
          priceScore,
          preferenceScore
        }
      };
    });

    // 按得分排序
    const recommendations = scoredPosts
      .sort((a, b) => b.scores.totalScore - a.scores.totalScore)
      .slice(0, limit);

    logger.info(`Posts recommended for teacher: ${userId}`);

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    logger.error('Recommend posts failed:', error);
    res.status(500).json({
      success: false,
      message: '推荐帖子失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 基于协同过滤的教师推荐
const recommendTeachersByCollaborativeFiltering = async (req, res) => {
  try {
    const { userId } = req.user;
    const { limit = 10 } = req.query;

    // 获取当前家长的历史订单和评价
    const userReviews = await Review.find({ parentId: userId })
      .populate('teacherId');

    if (userReviews.length === 0) {
      // 如果没有历史记录，返回评分最高的教师
      const topTeachers = await TeacherProfile.find()
        .populate('userId', 'username avatar status')
        .populate('reviews')
        .sort({ averageRating: -1 })
        .limit(limit);

      return res.json({
        success: true,
        data: topTeachers,
        type: 'top_rated'
      });
    }

    // 获取与当前家长有相似偏好的其他家长
    const similarParents = await Review.aggregate([
      // 匹配当前家长好评的教师
      {
        $match: {
          parentId: mongoose.Types.ObjectId(userId),
          rating: { $gte: 4 }
        }
      },
      // 查找给这些教师好评的其他家长
      {
        $lookup: {
          from: 'reviews',
          let: { teacherId: '$teacherId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$teacherId', '$$teacherId'] },
                    { $ne: ['$parentId', mongoose.Types.ObjectId(userId)] },
                    { $gte: ['$rating', 4] }
                  ]
                }
              }
            }
          ],
          as: 'similarReviews'
        }
      },
      // 展开相似评价
      { $unwind: '$similarReviews' },
      // 按相似家长分组
      {
        $group: {
          _id: '$similarReviews.parentId',
          similarity: { $sum: 1 }
        }
      },
      // 排序获取最相似的家长
      { $sort: { similarity: -1 } },
      { $limit: 10 }
    ]);

    // 获取相似家长好评的其他教师
    const recommendedTeachers = await Review.aggregate([
      {
        $match: {
          parentId: {
            $in: similarParents.map(p => p._id)
          },
          rating: { $gte: 4 }
        }
      },
      // 排除当前家长已评价的教师
      {
        $lookup: {
          from: 'reviews',
          let: { teacherId: '$teacherId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$teacherId', '$$teacherId'] },
                    { $eq: ['$parentId', mongoose.Types.ObjectId(userId)] }
                  ]
                }
              }
            }
          ],
          as: 'existingReviews'
        }
      },
      { $match: { existingReviews: { $size: 0 } } },
      // 按教师分组并计算推荐分数
      {
        $group: {
          _id: '$teacherId',
          score: {
            $sum: {
              $multiply: [
                '$rating',
                { $arrayElemAt: ['$similarity', 0] }
              ]
            }
          }
        }
      },
      { $sort: { score: -1 } },
      { $limit: limit }
    ]);

    // 获取推荐教师的详细信息
    const teachers = await TeacherProfile.find({
      _id: { $in: recommendedTeachers.map(r => r._id) }
    })
      .populate('userId', 'username avatar status')
      .populate('reviews');

    // 按推荐分数排序
    const recommendations = teachers.map(teacher => ({
      teacher,
      score: recommendedTeachers.find(r => r._id.equals(teacher._id)).score
    }));

    logger.info(`Teachers recommended by collaborative filtering for: ${userId}`);

    res.json({
      success: true,
      data: recommendations,
      type: 'collaborative'
    });
  } catch (error) {
    logger.error('Recommend teachers by collaborative filtering failed:', error);
    res.status(500).json({
      success: false,
      message: '推荐教师失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  recommendTeachersForParent,
  recommendPostsForTeacher,
  recommendTeachersByCollaborativeFiltering
};
