const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 注册新用户
const register = async (req, res) => {
  try {
    const { name, password, role } = req.body;

    // 验证请求体
    if (!name || !password || !role) {
      return res.status(400).json({
        message: '请提供所有必需的字段',
        required: ['name', 'password', 'role'],
      });
    }

    // 检查用户名是否已存在
    const existingUser = await User.findOne({ name });
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    // 创建新用户
    const user = new User({
      name,
      password,
      role,
      status: role === 'admin' ? 'active' : 'pending', // 管理员直接激活，其他需要审核
    });

    await user.save();

    // 生成 JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: '注册成功',
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        status: user.status,
      },
      token,
    });
  } catch (error) {
    console.error('注册错误:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: '数据验证失败',
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }
    res.status(500).json({ message: '注册失败', error: error.message });
  }
};

// 用户登录
const login = async (req, res) => {
  try {
    const { name, password } = req.body;

    // 验证请求体
    if (!name || !password) {
      return res.status(400).json({
        message: '请提供用户名和密码',
        required: ['name', 'password'],
      });
    }

    // 查找用户
    const user = await User.findOne({ name });
    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 验证密码
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 检查用户状态
    if (user.status !== 'active') {
      return res.status(403).json({ message: '账户未激活，请等待管理员审核' });
    }

    // 生成 JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: '登录成功',
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        status: user.status,
      },
      token,
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '登录失败', error: error.message });
  }
};

// 获取当前用户信息
const getProfile = async (req, res) => {
  try {
    const user = req.user;
    res.json({
      id: user._id,
      name: user.name,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ message: '获取用户信息失败', error: error.message });
  }
};

// 更新用户状态（管理员功能）
const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'pending', 'banned'].includes(status)) {
      return res.status(400).json({
        message: '无效的状态值',
        allowedValues: ['active', 'pending', 'banned'],
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    user.status = status;
    await user.save();

    res.json({
      message: '用户状态更新成功',
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('更新用户状态错误:', error);
    res.status(500).json({ message: '更新用户状态失败', error: error.message });
  }
};

// 获取所有用户（管理员功能）
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json({
      users: users.map((user) => ({
        id: user._id,
        name: user.name,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      })),
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ message: '获取用户列表失败', error: error.message });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateUserStatus,
  getAllUsers,
};
