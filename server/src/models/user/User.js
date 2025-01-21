const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  customId: {
    type: String,
    required: [true, '用户ID是必需的'],
    unique: true,
    match: [/^(TUTOR|PARENT|ADMIN)_\d{14}$/, '用户ID格式不正确']
  },
  username: {
    type: String,
    required: [true, '用户名是必需的'],
    unique: true,
    trim: true,
    minlength: [2, '用户名至少需要2个字符'],
    maxlength: [30, '用户名不能超过30个字符'],
    validate: {
      validator: function(v) {
        return /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(v);
      },
      message: '用户名只能包含字母、数字、下划线和中文'
    }
  },
  password: {
    type: String,
    required: [true, '密码是必需的'],
    minlength: [6, '密码至少需要6个字符'],
    validate: {
      validator: function(v) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/.test(v);
      },
      message: '密码必须包含至少一个大写字母、一个小写字母和一个数字'
    }
  },
  email: {
    type: String,
    required: [true, '邮箱是必需的'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, '邮箱格式不正确']
  },
  phone: {
    type: String,
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^1[3-9]\d{9}$/.test(v);
      },
      message: '手机号格式不正确'
    }
  },
  role: {
    type: String,
    enum: {
      values: ['parent', 'teacher', 'admin'],
      message: '{VALUE} 不是有效的角色'
    },
    required: [true, '角色是必需的']
  },
  avatar: {
    type: String,
    default: 'default-avatar.png'
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive', 'banned'],
      message: '{VALUE} 不是有效的状态'
    },
    default: 'active'
  },
  lastLoginAt: Date,
  verifiedAt: Date,
  loginAttempts: {
    count: { type: Number, default: 0 },
    lastAttempt: Date,
    lockUntil: Date
  },
  preferences: {
    language: {
      type: String,
      enum: ['zh-CN', 'en-US'],
      default: 'zh-CN'
    },
    notification: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    displayMode: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    timezone: {
      type: String,
      default: 'Asia/Shanghai'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虚拟字段
userSchema.virtual('isVerified').get(function() {
  return !!this.verifiedAt;
});

userSchema.virtual('isLocked').get(function() {
  return !!(this.loginAttempts.lockUntil && this.loginAttempts.lockUntil > Date.now());
});

userSchema.virtual('profile', {
  ref: function() {
    return this.role === 'teacher' ? 'TeacherProfile' : 'ParentProfile';
  },
  localField: '_id',
  foreignField: 'userId',
  justOne: true
});

// 索引
userSchema.index({ customId: 1 });
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ "loginAttempts.lockUntil": 1 });
userSchema.index({ createdAt: 1 });
userSchema.index({ updatedAt: 1 });

// 密码加密中间件
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 更新时间戳中间件
userSchema.pre('save', function(next) {
  if (this.isNew) {
    this.createdAt = this.updatedAt = new Date();
  } else {
    this.updatedAt = new Date();
  }
  next();
});

// 密码验证方法
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// 登录尝试处理方法
userSchema.methods.handleLoginAttempt = async function(isSuccess) {
  if (isSuccess) {
    // 重置登录尝试
    this.loginAttempts = {
      count: 0,
      lastAttempt: new Date(),
      lockUntil: null
    };
    this.lastLoginAt = new Date();
  } else {
    // 增加失败次数
    this.loginAttempts.count += 1;
    this.loginAttempts.lastAttempt = new Date();
    
    // 如果失败次数达到5次，锁定1小时
    if (this.loginAttempts.count >= 5) {
      this.loginAttempts.lockUntil = new Date(Date.now() + 3600000); // 1小时
    }
  }
  return this.save();
};

// 获取安全的用户信息
userSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.loginAttempts;
  return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
