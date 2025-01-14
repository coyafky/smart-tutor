const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '用户名是必需的'],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, '密码是必需的'],
    minlength: [6, '密码至少需要6个字符']
  },
  role: {
    type: String,
    enum: {
      values: ['parent', 'tutor', 'admin'],
      message: '角色必须是 parent、tutor 或 admin'
    },
    required: [true, '角色是必需的']
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'pending', 'banned'],
      message: '状态必须是 active、pending 或 banned'
    },
    default: 'pending'
  }
}, {
  timestamps: true
});

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
