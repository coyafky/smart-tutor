const mongoose = require('mongoose');

const parentProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parentId: {
    type: String,
    required: true,
    unique: true,
    match: /^PARENT_\d{14}$/
  },
  children: [{
    name: String,
    grade: {
      type: String,
      enum: [
        '小学一年级', '小学二年级', '小学三年级', '小学四年级', '小学五年级', '小学六年级',
        '初中一年级', '初中二年级', '初中三年级',
        '高中一年级', '高中二年级', '高中三年级'
      ]
    },
    school: {
      name: String,
      type: {
        type: String,
        enum: ['私立', '国际学校', '公立']
      }
    },
    subjects: [{
      name: String,
      currentLevel: String,
      targetLevel: String,
      weakPoints: [String]
    }]
  }],
  preferences: {
    teachingLocation: {
      type: String,
      enum: ['家里', '教师家', '其他']
    },
    teacherGender: {
      type: String,
      enum: ['男', '女', '不限']
    },
    teachingStyle: [String],
    budget: {
      min: Number,
      max: Number,
      period: {
        type: String,
        enum: ['per_hour', 'per_session']
      }
    }
  },
  location: {
    address: String,
    district: String,
    city: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  statistics: {
    totalPosts: {
      type: Number,
      default: 0
    },
    totalTeachers: {
      type: Number,
      default: 0
    },
    totalClasses: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    }
  },
  reviewHistory: [{
    teacherId: {
      type: String,
      required: true,
      match: /^TUTOR_\d{14}$/
    },
    trialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trial'
    },
    rating: Number,
    comment: String,
    aspects: {
      teachingQuality: Number,
      attitude: Number,
      punctuality: Number
    },
    createdAt: Date
  }],
  paymentHistory: [{
    trialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trial'
    },
    teacherId: {
      type: String,
      required: true,
      match: /^TUTOR_\d{14}$/
    },
    amount: Number,
    currency: {
      type: String,
      default: 'CNY'
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'refunded'],
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      enum: ['alipay', 'wechat', 'bank_transfer']
    },
    paymentTime: Date,
    refundInfo: {
      amount: Number,
      reason: String,
      status: String,
      processedAt: Date
    }
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

// 创建索引
parentProfileSchema.index({ userId: 1 });
parentProfileSchema.index({ parentId: 1 });
parentProfileSchema.index({ 'location.city': 1 });
parentProfileSchema.index({ 'location.district': 1 });
parentProfileSchema.index({ status: 1 });
parentProfileSchema.index({ 'statistics.totalClasses': -1 });
parentProfileSchema.index({ 'statistics.totalSpent': -1 });
parentProfileSchema.index({ 'paymentHistory.status': 1 });
parentProfileSchema.index({ 'paymentHistory.paymentTime': -1 });
parentProfileSchema.index({ 'reviewHistory.createdAt': -1 });

const ParentProfile = mongoose.model('ParentProfile', parentProfileSchema);

module.exports = ParentProfile;
