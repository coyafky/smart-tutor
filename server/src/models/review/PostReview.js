const mongoose = require('mongoose');

const postReviewSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  reviewerId: {
    type: String,
    required: true,
    match: /^ADMIN_\d{14}$/
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'revision_required'],
    default: 'pending'
  },
  reviewType: {
    type: String,
    enum: ['initial', 'revision', 'report'],
    required: true
  },
  checkItems: [{
    item: String,
    passed: Boolean,
    comment: String
  }],
  violationTypes: [{
    type: String,
    enum: [
      'inappropriate_content',
      'misleading_information',
      'price_violation',
      'contact_info_violation',
      'spam',
      'other'
    ]
  }],
  reviewNotes: {
    type: String,
    maxlength: [500, '审核备注不能超过500字']
  },
  revisionRequired: [{
    field: String,
    reason: String,
    suggestion: String
  }],
  reviewMetrics: {
    reviewDuration: Number,  // 审核耗时（分钟）
    revisionCount: {        // 修改次数
      type: Number,
      default: 0
    },
    autoFlagged: Boolean    // 是否被自动标记
  },
  timeline: [{
    action: {
      type: String,
      enum: ['submitted', 'reviewed', 'revised', 'approved', 'rejected']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    actor: String,
    notes: String
  }]
}, {
  timestamps: true
});

// 创建索引
postReviewSchema.index({ postId: 1 });
postReviewSchema.index({ reviewerId: 1 });
postReviewSchema.index({ status: 1 });
postReviewSchema.index({ createdAt: -1 });
postReviewSchema.index({ 'reviewMetrics.reviewDuration': 1 });

// 复合索引
postReviewSchema.index({ postId: 1, status: 1 });
postReviewSchema.index({ reviewerId: 1, status: 1 });

// 添加方法检查是否需要人工审核
postReviewSchema.methods.needsManualReview = function() {
  return this.reviewMetrics.autoFlagged || 
         this.violationTypes.length > 0 || 
         this.reviewMetrics.revisionCount >= 2;
};

// 添加方法获取审核时长
postReviewSchema.methods.getReviewDuration = function() {
  const lastReviewAction = this.timeline
    .filter(t => t.action === 'reviewed')
    .sort((a, b) => b.timestamp - a.timestamp)[0];
  
  if (!lastReviewAction) return null;
  
  const submission = this.timeline.find(t => t.action === 'submitted');
  return Math.round((lastReviewAction.timestamp - submission.timestamp) / (1000 * 60));
};

// 中间件：自动更新审核时长
postReviewSchema.pre('save', function(next) {
  if (this.isModified('status') && ['approved', 'rejected'].includes(this.status)) {
    this.reviewMetrics.reviewDuration = this.getReviewDuration();
  }
  next();
});

const PostReview = mongoose.model('PostReview', postReviewSchema);

module.exports = PostReview;
