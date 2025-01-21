const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  }
});

const feedbackSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    match: /^(TUTOR|PARENT|ADMIN)_\d{14}$/
  },
  type: {
    type: String,
    enum: ['bug', 'feature', 'suggestion', 'complaint', 'other'],
    required: true
  },
  module: {
    type: String,
    enum: ['用户系统', '家教匹配', '课程管理', '支付系统', '评价系统', '其他'],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: [100, '标题不能超过100字']
  },
  content: {
    type: String,
    required: true,
    maxlength: [2000, '内容不能超过2000字']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  attachments: [attachmentSchema],
  status: {
    type: String,
    enum: ['pending', 'processing', 'resolved', 'rejected'],
    default: 'pending'
  },
  response: {
    content: {
      type: String,
      maxlength: [1000, '回复内容不能超过1000字']
    },
    adminId: {
      type: String,
      match: /^ADMIN_\d{14}$/
    },
    responseTime: Date
  },
  tags: [String],
  relatedFeedbacks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feedback'
  }],
  timeline: [{
    action: {
      type: String,
      enum: ['created', 'updated', 'status_changed', 'responded', 'closed']
    },
    actor: {
      type: String,
      match: /^(TUTOR|PARENT|ADMIN)_\d{14}$/
    },
    content: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  platform: {
    os: String,
    browser: String,
    version: String
  },
  metrics: {
    viewCount: {
      type: Number,
      default: 0
    },
    upvotes: {
      type: Number,
      default: 0
    },
    duplicateCount: {
      type: Number,
      default: 0
    },
    responseTime: Number // 响应时间（小时）
  }
}, {
  timestamps: true
});

// 创建索引
feedbackSchema.index({ userId: 1 });
feedbackSchema.index({ type: 1 });
feedbackSchema.index({ module: 1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ priority: -1 });
feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ 'metrics.upvotes': -1 });

// 复合索引
feedbackSchema.index({ type: 1, module: 1, status: 1 });
feedbackSchema.index({ userId: 1, status: 1 });

// 添加方法检查反馈是否可以被修改
feedbackSchema.methods.canBeModified = function() {
  return ['pending', 'processing'].includes(this.status);
};

// 添加方法计算响应时间
feedbackSchema.methods.calculateResponseTime = function() {
  if (!this.response.responseTime) {
    return null;
  }
  return Math.round((this.response.responseTime - this.createdAt) / (1000 * 60 * 60));
};

// 添加方法检查是否是高优先级反馈
feedbackSchema.methods.isHighPriority = function() {
  return this.priority === 'high' || 
         this.metrics.upvotes >= 10 || 
         this.metrics.duplicateCount >= 5;
};

// 添加静态方法获取模块的反馈统计
feedbackSchema.statics.getModuleStats = async function() {
  return this.aggregate([
    {
      $group: {
        _id: '$module',
        total: { $sum: 1 },
        resolved: {
          $sum: {
            $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0]
          }
        },
        avgResponseTime: { $avg: '$metrics.responseTime' }
      }
    }
  ]);
};

// 中间件：更新时自动添加时间线
feedbackSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.timeline.push({
      action: 'status_changed',
      actor: this.response?.adminId || 'SYSTEM',
      content: `Status changed to ${this.status}`
    });
  }
  next();
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
