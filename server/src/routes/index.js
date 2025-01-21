const express = require('express');
const router = express.Router();

// 导入所有路由
const authRoutes = require('./authRoutes');
const teacherRoutes = require('./teacherRoutes');
const parentRoutes = require('./parentRoutes');
const postRoutes = require('./postRoutes');
const applicationRoutes = require('./applicationRoutes');
const courseRoutes = require('./courseRoutes');
const paymentRoutes = require('./paymentRoutes');
const messageRoutes = require('./messageRoutes');
const reviewRoutes = require('./reviewRoutes');
const recommendationRoutes = require('./recommendationRoutes');
const adminRoutes = require('./adminRoutes');
const fileRoutes = require('./fileRoutes');

// 注册路由
router.use('/auth', authRoutes);
router.use('/teachers', teacherRoutes);
router.use('/parents', parentRoutes);
router.use('/posts', postRoutes);
router.use('/applications', applicationRoutes);
router.use('/courses', courseRoutes);
router.use('/payments', paymentRoutes);
router.use('/messages', messageRoutes);
router.use('/reviews', reviewRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/admin', adminRoutes);
router.use('/files', fileRoutes);

module.exports = router;
