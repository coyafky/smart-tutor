const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  customId: {
    type: String,
    required: true,
    unique: true,
    match: /^(TUTOR|PARENT|ADMIN)_\d{14}$/
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: [6, '密码至少需要6个字符']
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    unique: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['parent', 'teacher', 'admin'],
    required: true
  },
  avatar: String,
  status: {
    type: String,
    enum: ['active', 'inactive', 'banned'],
    default: 'active'
  },
  lastLoginAt: Date,
  verifiedAt: Date,
  preferences: {
    language: String,
    notification: {
      email: Boolean,
      sms: Boolean,
      push: Boolean
    },
    displayMode: String,
    timezone: String
  }
}, {
  timestamps: true // This will add createdAt and updatedAt fields
});

// 创建索引
userSchema.index({ customId: 1 });
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

// Hash password before saving
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

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
