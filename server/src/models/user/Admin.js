const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  adminId: {
    type: String,
    required: true,
    unique: true,
    match: /^ADMIN_\d{14}$/
  },
  name: String,
  role: {
    type: String,
    enum: ['super', 'normal'],
    default: 'normal'
  },
  permissions: {
    userManage: {
      type: Boolean,
      default: false
    },
    postManage: {
      type: Boolean,
      default: false
    },
    reviewManage: {
      type: Boolean,
      default: false
    },
    systemConfig: {
      type: Boolean,
      default: false
    }
  },
  contactInfo: {
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    }
  },
  lastLoginAt: Date,
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

// 创建索引
adminSchema.index({ adminId: 1 });
adminSchema.index({ role: 1 });
adminSchema.index({ status: 1 });
adminSchema.index({ 'contactInfo.email': 1 });
adminSchema.index({ 'contactInfo.phone': 1 });

// 添加中间件来处理超级管理员权限
adminSchema.pre('save', function(next) {
  if (this.role === 'super') {
    this.permissions = {
      userManage: true,
      postManage: true,
      reviewManage: true,
      systemConfig: true
    };
  }
  next();
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
