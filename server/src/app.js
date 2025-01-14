require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5000',  // Landing Page
    'http://localhost:5001',  // Parent Portal
    'http://localhost:5002',  // Tutor Portal
    'http://localhost:5003'   // Admin Portal
  ],
  credentials: true
}));
app.use(express.json());

// MongoDB 连接配置
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('成功连接到 MongoDB'))
  .catch(err => console.error('MongoDB 连接失败:', err));

// 基础路由
app.get('/', (req, res) => {
  res.json({ message: 'Smart Tutor API 服务器正在运行' });
});

// API 路由
app.use('/api/auth', authRoutes);

// 404 处理
app.use((req, res) => {
  res.status(404).json({ message: '请求的资源不存在' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('错误:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: '数据验证失败',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: '无效的认证令牌' });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: '认证令牌已过期' });
  }
  
  res.status(500).json({ message: '服务器内部错误' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器正在运行，端口: ${PORT}`);
});
