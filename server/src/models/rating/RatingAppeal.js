const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['image', 'document', 'video', 'audio'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  description: String
});

const ratingAppealSchema = new mongoose.Schema({
  ratingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rating',
    required: true
  },
  appealerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true,
    maxlength: [1000, '申诉理由不能超过1000字']
  },
  evidence: [evidenceSchema],
  status: {
    type: String,
    enum: ['pending', 'processing', 'resolved', 'rejected'],
    default: 'pending'
  },
  adminResponse: {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    result: {
      type: String,
      enum: ['approved', 'rejected']
    },
    comment: {
      type: String,
      maxlength: [500, '处理说明不能超过500字']
    },
    handledAt: Date
  },
  timeline: [{
    action: {
      type: String,
      enum: ['created', 'processing', 'resolved', 'rejected', 'commented']
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    actorRole: {
      type: String,
      enum: ['user', 'admin']
    },
    content: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// 创建索引
ratingAppealSchema.index({ ratingId: 1 });
ratingAppealSchema.index({ appealerId: 1 });
ratingAppealSchema.index({ status: 1 });
ratingAppealSchema.index({ createdAt: -1 });
ratingAppealSchema.index({ 'adminResponse.adminId': 1 });

// 复合索引
ratingAppealSchema.index({ ratingId: 1, appealerId: 1 }, { unique: true });

// 添加方法检查申诉是否可以被修改
ratingAppealSchema.methods.canBeModified = function() {
  return this.status === 'pending';
};

// 添加方法检查申诉是否可以被撤销
ratingAppealSchema.methods.canBeWithdrawn = function() {
  return ['pending', 'processing'].includes(this.status);
};

// 添加方法获取申诉处理时长
ratingAppealSchema.methods.getProcessingDuration = function() {
  if (!this.adminResponse.handledAt) {
    return null;
  }
  return Math.round((this.adminResponse.handledAt - this.createdAt) / (1000 * 60 * 60)); // 返回小时数
};

const RatingAppeal = mongoose.model('RatingAppeal', ratingAppealSchema);

module.exports = RatingAppeal;
