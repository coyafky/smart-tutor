const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const Redis = require('ioredis');
const User = require('../models/user/User');
const TeacherProfile = require('../models/user/TeacherProfile');
const ParentProfile = require('../models/user/ParentProfile');
const { generateSvgCaptcha } = require('../utils/svgCaptcha');
const { sendVerificationEmail, sendPasswordResetEmail, sendAccountDeletionEmail } = require('../utils/emailService');
const { createCustomError } = require('../utils/errors');
const logger = require('../utils/logger');

// Redis客户端配置
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

// 速率限制器配置
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟窗口
  max: 5, // 限制5次尝试
  message: '登录尝试次数过多，请15分钟后再试',
  standardHeaders: true,
  legacyHeaders: false,
});

const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时窗口
  max: 3, // 限制3次发送
  message: '发送邮件次数过多，请1小时后再试',
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24小时窗口
  max: 3, // 限制3次注册
  message: '注册次数过多，请24小时后再试',
  standardHeaders: true,
  legacyHeaders: false,
});

// 密码验证规则
const passwordValidation = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('密码长度至少为8个字符')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])/)
    .withMessage('密码必须包含大小写字母')
    .matches(/^(?=.*[0-9])/)
    .withMessage('密码必须包含数字')
    .matches(/^(?=.*[!@#$%^&*])/)
    .withMessage('密码必须包含特殊字符(!@#$%^&*)')
];

// 邮箱验证规则
const emailValidation = [
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail()
];

// 用户角色验证规则
const roleValidation = [
  body('role')
    .isIn(['teacher', 'parent'])
    .withMessage('用户角色必须是 teacher 或 parent')
];

// 注册新用户
const register = async (req, res) => {
  try {
    // 验证请求数据
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { email, password, emailCode, role } = req.body;

    // 验证邮箱验证码
    const storedEmailCode = await redis.get(`email:${email}`);
    if (!storedEmailCode || storedEmailCode !== emailCode) {
      return res.status(400).json({
        success: false,
        message: '邮箱验证码错误或已过期'
      });
    }

    // 检查邮箱是否已注册
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '该邮箱已被注册'
      });
    }

    // 生成用户ID
    const timestamp = new Date().getTime().toString().slice(-14);
    const userId = role === 'teacher' ? `TUTOR_${timestamp}` : `PARENT_${timestamp}`;

    // 创建新用户
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const user = new User({
      userId,
      email,
      password: hashedPassword,
      role,
      lastPasswordChange: new Date(),
      passwordHistory: [hashedPassword]
    });

    await user.save();

    // 创建对应的角色档案
    if (role === 'teacher') {
      await TeacherProfile.create({ userId: user._id, tutorId: userId });
    } else {
      await ParentProfile.create({ userId: user._id, parentId: userId });
    }

    // 删除Redis中的验证码
    await redis.del(`email:${email}`);

    // 生成JWT token
    const token = jwt.sign(
      { 
        userId: user.userId,
        role: user.role,
        email: user.email,
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: '2h',
        algorithm: 'HS256'
      }
    );

    // 存储token到Redis用于追踪活跃会话
    await redis.set(
      `auth:${user.userId}:${token}`,
      'active',
      'EX',
      7200 // 2小时过期
    );

    logger.info(`New user registered: ${user.email} (${user.role})`);

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user: {
          userId: user.userId,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    logger.error('Register failed:', error);
    res.status(500).json({
      success: false,
      message: '注册失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 用户登录
const login = async (req, res) => {
  try {
    const { email, password, captcha } = req.body;
    const sessionId = req.sessionID;

    // 验证图形验证码
    const storedCaptcha = await redis.get(`captcha:${sessionId}`);
    if (!storedCaptcha || storedCaptcha !== captcha.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: '图形验证码错误或已过期'
      });
    }

    // 查找用户
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 检查账户状态
    if (user.status === 'locked') {
      const lockExpiry = await redis.get(`lockout:${user.userId}`);
      if (lockExpiry) {
        return res.status(403).json({
          success: false,
          message: `账户已锁定，请在${Math.ceil((lockExpiry - Date.now()) / 1000 / 60)}分钟后重试`
        });
      }
    }

    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // 增加失败计数
      const failures = await redis.incr(`login:failures:${user.userId}`);
      await redis.expire(`login:failures:${user.userId}`, 900); // 15分钟过期

      if (failures >= 5) {
        // 锁定账户1小时
        await redis.set(`lockout:${user.userId}`, Date.now() + 3600000, 'EX', 3600);
        await User.findByIdAndUpdate(user._id, { status: 'locked' });
        
        return res.status(403).json({
          success: false,
          message: '登录失败次数过多，账户已锁定1小时'
        });
      }

      return res.status(401).json({
        success: false,
        message: '用户名或密码错误',
        remainingAttempts: 5 - failures
      });
    }

    // 清除失败计数和锁定状态
    await redis.del(`login:failures:${user.userId}`);
    await redis.del(`lockout:${user.userId}`);
    if (user.status === 'locked') {
      await User.findByIdAndUpdate(user._id, { status: 'active' });
    }

    // 检查密码是否需要更新
    const lastPasswordChange = user.lastPasswordChange || new Date(0);
    const passwordAge = Math.floor((Date.now() - lastPasswordChange.getTime()) / (1000 * 60 * 60 * 24));
    const shouldChangePassword = passwordAge >= 90; // 90天更新密码

    // 生成新的JWT token
    const token = jwt.sign(
      {
        userId: user.userId,
        role: user.role,
        email: user.email,
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '2h',
        algorithm: 'HS256'
      }
    );

    // 存储token到Redis
    await redis.set(
      `auth:${user.userId}:${token}`,
      'active',
      'EX',
      7200 // 2小时过期
    );

    // 更新最后登录时间
    await User.findByIdAndUpdate(user._id, {
      lastLoginAt: new Date(),
      lastLoginIP: req.ip
    });

    logger.info(`User logged in: ${user.email}`);

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          userId: user.userId,
          email: user.email,
          role: user.role,
          status: user.status
        },
        shouldChangePassword
      }
    });
  } catch (error) {
    logger.error('Login failed:', error);
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 生成SVG验证码
const generateCaptcha = async (req, res) => {
  try {
    const captcha = generateSvgCaptcha();
    const sessionId = req.sessionID;

    // 将验证码存储到Redis，设置5分钟过期
    await redis.set(`captcha:${sessionId}`, captcha.text.toLowerCase(), 'EX', 300);

    res.type('svg');
    return res.status(200).send(captcha.data);
  } catch (error) {
    logger.error('Generate captcha failed:', error);
    return res.status(500).json({
      success: false,
      message: '生成验证码失败'
    });
  }
};

// 发送邮箱验证码
const sendEmailCode = async (req, res) => {
  try {
    const { email, captcha } = req.body;
    const sessionId = req.sessionID;

    // 验证图形验证码
    const storedCaptcha = await redis.get(`captcha:${sessionId}`);
    if (!storedCaptcha || storedCaptcha !== captcha.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: '图形验证码错误或已过期'
      });
    }

    // 检查邮箱发送频率
    const emailSendCount = await redis.get(`email:count:${email}`);
    if (emailSendCount && parseInt(emailSendCount) >= 3) {
      return res.status(429).json({
        success: false,
        message: '发送次数过多，请1小时后再试'
      });
    }

    // 生成6位随机验证码
    const emailCode = Math.random().toString().slice(2, 8);

    // 发送邮件
    const emailSent = await sendVerificationEmail(email, emailCode);
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: '邮件发送失败'
      });
    }

    // 记录发送次数
    await redis.incr(`email:count:${email}`);
    await redis.expire(`email:count:${email}`, 3600); // 1小时过期

    // 存储邮箱验证码到Redis，设置5分钟过期
    await redis.set(`email:${email}`, emailCode, 'EX', 300);

    logger.info(`Email verification code sent to: ${email}`);

    return res.status(200).json({
      success: true,
      message: '验证码已发送'
    });
  } catch (error) {
    logger.error('Send email code failed:', error);
    return res.status(500).json({
      success: false,
      message: '发送验证码失败'
    });
  }
};

// 发送密码重置邮件
const sendPasswordResetEmail = async (req, res) => {
  try {
    const { email, captcha } = req.body;
    const sessionId = req.sessionID;

    // 验证图形验证码
    const storedCaptcha = await redis.get(`captcha:${sessionId}`);
    if (!storedCaptcha || storedCaptcha !== captcha.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: '图形验证码错误或已过期'
      });
    }

    // 查找用户
    const user = await User.findOne({ email });
    if (!user) {
      // 为了安全，即使用户不存在也返回成功
      return res.status(200).json({
        success: true,
        message: '如果该邮箱已注册，您将收到密码重置邮件'
      });
    }

    // 生成重置token
    const resetToken = jwt.sign(
      { userId: user.userId, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    // 存储重置token
    await redis.set(
      `reset:${user.userId}`,
      resetToken,
      'EX',
      1800 // 30分钟
    );

    // 发送重置邮件
    const emailSent = await sendPasswordResetEmail(email, resetToken);
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: '发送重置邮件失败'
      });
    }

    res.json({
      success: true,
      message: '如果该邮箱已注册，您将收到密码重置邮件'
    });
  } catch (error) {
    logger.error('Send password reset email failed:', error);
    res.status(500).json({
      success: false,
      message: '发送重置邮件失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 验证重置token
const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: '未提供重置token'
      });
    }

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 检查token是否在Redis中
    const storedToken = await redis.get(`reset:${decoded.userId}`);
    if (!storedToken || storedToken !== token) {
      return res.status(400).json({
        success: false,
        message: '重置链接无效或已过期'
      });
    }

    res.json({
      success: true,
      message: '重置token有效',
      data: {
        email: decoded.email
      }
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(400).json({
        success: false,
        message: '重置链接已过期'
      });
    }
    
    logger.error('Verify reset token failed:', error);
    res.status(400).json({
      success: false,
      message: '重置链接无效'
    });
  }
};

// 重置密码
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // 验证新密码
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 检查token是否在Redis中
    const storedToken = await redis.get(`reset:${decoded.userId}`);
    if (!storedToken || storedToken !== token) {
      return res.status(400).json({
        success: false,
        message: '重置链接无效或已过期'
      });
    }

    // 查找用户
    const user = await User.findOne({ userId: decoded.userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 检查新密码是否与最近的密码相同
    const isRecentPassword = user.passwordHistory.some(async (oldPassword) => {
      return await bcrypt.compare(password, oldPassword);
    });

    if (isRecentPassword) {
      return res.status(400).json({
        success: false,
        message: '新密码不能与最近使用过的密码相同'
      });
    }

    // 生成新的密码哈希
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 更新用户密码
    user.password = hashedPassword;
    user.lastPasswordChange = new Date();
    
    // 更新密码历史（保留最近5个）
    user.passwordHistory.push(hashedPassword);
    if (user.passwordHistory.length > 5) {
      user.passwordHistory = user.passwordHistory.slice(-5);
    }

    await user.save();

    // 删除重置token
    await redis.del(`reset:${decoded.userId}`);

    // 删除所有活跃会话，强制重新登录
    const sessionKeys = await redis.keys(`auth:${decoded.userId}:*`);
    if (sessionKeys.length > 0) {
      await redis.del(sessionKeys);
    }

    logger.info(`Password reset successful for user: ${user.email}`);

    res.json({
      success: true,
      message: '密码重置成功，请使用新密码登录'
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(400).json({
        success: false,
        message: '重置链接已过期'
      });
    }
    
    logger.error('Reset password failed:', error);
    res.status(500).json({
      success: false,
      message: '密码重置失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 退出登录（单个设备）
const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { userId } = req.user;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: '未提供有效的token'
      });
    }

    // 将当前token加入黑名单
    await redis.del(`auth:${userId}:${token}`);
    
    logger.info(`User logged out: ${req.user.email}`);

    res.json({
      success: true,
      message: '退出登录成功'
    });
  } catch (error) {
    logger.error('Logout failed:', error);
    res.status(500).json({
      success: false,
      message: '退出登录失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 退出所有设备
const logoutAll = async (req, res) => {
  try {
    const { userId } = req.user;

    // 获取所有活跃会话
    const sessionKeys = await redis.keys(`auth:${userId}:*`);
    
    if (sessionKeys.length > 0) {
      // 删除所有活跃会话
      await redis.del(sessionKeys);
    }

    logger.info(`User logged out from all devices: ${req.user.email}`);

    res.json({
      success: true,
      message: '已从所有设备退出登录'
    });
  } catch (error) {
    logger.error('Logout all failed:', error);
    res.status(500).json({
      success: false,
      message: '退出所有设备失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取当前用户的活跃会话
const getActiveSessions = async (req, res) => {
  try {
    const { userId } = req.user;
    
    // 获取所有活跃会话
    const sessionKeys = await redis.keys(`auth:${userId}:*`);
    const sessions = [];

    for (const key of sessionKeys) {
      const token = key.split(':')[2];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        sessions.push({
          deviceId: token.slice(-6),
          lastActive: new Date(decoded.iat * 1000),
          current: token === req.headers.authorization?.split(' ')[1]
        });
      } catch (err) {
        // 如果token已过期，则删除该会话
        await redis.del(key);
      }
    }

    res.json({
      success: true,
      data: {
        activeSessions: sessions,
        totalCount: sessions.length
      }
    });
  } catch (error) {
    logger.error('Get active sessions failed:', error);
    res.status(500).json({
      success: false,
      message: '获取活跃会话失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 修改密码
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { userId } = req.user;

    // 验证新密码
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // 查找用户
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 验证当前密码
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '当前密码错误'
      });
    }

    // 检查新密码是否与当前密码相同
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: '新密码不能与当前密码相同'
      });
    }

    // 检查新密码是否与最近的密码相同
    const isRecentPassword = await Promise.all(
      user.passwordHistory.map(oldPassword => bcrypt.compare(newPassword, oldPassword))
    ).then(results => results.some(result => result));

    if (isRecentPassword) {
      return res.status(400).json({
        success: false,
        message: '新密码不能与最近使用过的密码相同'
      });
    }

    // 生成新的密码哈希
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 更新用户密码
    user.password = hashedPassword;
    user.lastPasswordChange = new Date();
    
    // 更新密码历史（保留最近5个）
    user.passwordHistory.push(hashedPassword);
    if (user.passwordHistory.length > 5) {
      user.passwordHistory = user.passwordHistory.slice(-5);
    }

    await user.save();

    // 删除所有活跃会话，强制重新登录
    const sessionKeys = await redis.keys(`auth:${userId}:*`);
    if (sessionKeys.length > 0) {
      await redis.del(sessionKeys);
    }

    logger.info(`Password changed for user: ${user.email}`);

    res.json({
      success: true,
      message: '密码修改成功，请使用新密码重新登录'
    });
  } catch (error) {
    logger.error('Change password failed:', error);
    res.status(500).json({
      success: false,
      message: '密码修改失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 请求账号注销
const requestAccountDeletion = async (req, res) => {
  try {
    const { password } = req.body;
    const { userId } = req.user;

    // 查找用户
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '密码错误'
      });
    }

    // 生成注销确认token（24小时有效）
    const deletionToken = jwt.sign(
      { userId: user.userId, email: user.email, type: 'account_deletion' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 存储注销token
    await redis.set(
      `deletion:${userId}`,
      deletionToken,
      'EX',
      86400 // 24小时
    );

    // 发送确认邮件
    const emailSent = await sendAccountDeletionEmail(user.email, deletionToken);
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: '发送确认邮件失败'
      });
    }

    res.json({
      success: true,
      message: '注销确认邮件已发送，请在24小时内确认'
    });
  } catch (error) {
    logger.error('Request account deletion failed:', error);
    res.status(500).json({
      success: false,
      message: '请求账号注销失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 确认账号注销
const confirmAccountDeletion = async (req, res) => {
  try {
    const { token } = req.body;

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'account_deletion') {
      return res.status(400).json({
        success: false,
        message: '无效的注销token'
      });
    }

    // 检查token是否在Redis中
    const storedToken = await redis.get(`deletion:${decoded.userId}`);
    if (!storedToken || storedToken !== token) {
      return res.status(400).json({
        success: false,
        message: '注销链接无效或已过期'
      });
    }

    // 查找用户
    const user = await User.findOne({ userId: decoded.userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 开始事务
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 删除用户相关数据
      if (user.role === 'teacher') {
        await TeacherProfile.findOneAndDelete({ userId: user._id }, { session });
      } else {
        await ParentProfile.findOneAndDelete({ userId: user._id }, { session });
      }

      // 软删除用户账号
      user.status = 'deleted';
      user.email = `deleted_${user.email}`;
      user.deletedAt = new Date();
      await user.save({ session });

      // 提交事务
      await session.commitTransaction();

      // 删除所有Redis中的数据
      const keys = await redis.keys(`*:${decoded.userId}:*`);
      if (keys.length > 0) {
        await redis.del(keys);
      }
      await redis.del(`deletion:${decoded.userId}`);

      logger.info(`Account deleted for user: ${decoded.email}`);

      res.json({
        success: true,
        message: '账号已注销'
      });
    } catch (error) {
      // 回滚事务
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(400).json({
        success: false,
        message: '注销链接已过期'
      });
    }

    logger.error('Confirm account deletion failed:', error);
    res.status(500).json({
      success: false,
      message: '确认账号注销失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  register: [registerLimiter, ...passwordValidation, ...emailValidation, ...roleValidation, register],
  login: [loginLimiter, ...emailValidation, login],
  generateCaptcha,
  sendEmailCode: [emailLimiter, ...emailValidation, sendEmailCode],
  logout,
  logoutAll,
  getActiveSessions,
  sendPasswordResetEmail: [emailLimiter, ...emailValidation, sendPasswordResetEmail],
  verifyResetToken,
  resetPassword: [...passwordValidation, resetPassword],
  changePassword: [...passwordValidation, changePassword],
  requestAccountDeletion,
  confirmAccountDeletion
};
