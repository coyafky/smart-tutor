const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  parentId: {
    type: String,
    required: true,
    match: /^PARENT_\d{14}$/
  },
  studentInfo: {
    grade: {
      type: String,
      enum: [
        '小学一年级', '小学二年级', '小学三年级', '小学四年级', '小学五年级', '小学六年级',
        '初中一年级', '初中二年级', '初中三年级',
        '高中一年级', '高中二年级', '高中三年级'
      ],
      required: true
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
      currentScore: Number,
      targetScore: Number,
      weakPoints: [String]
    }],
    learningStyle: String,
    specialNeeds: String
  },
  tutorRequirements: {
    preferredGender: String,
    experienceYears: Number,
    educationLevel: {
      type: String,
      enum: ['985', '211', '一本', '二本', '其他']
    },
    teachingStyle: String,
    otherRequirements: String
  },
  schedule: {
    preferredDays: [{
      type: String,
      enum: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    }],
    preferredTime: {
      type: String,
      enum: ['早上', '下午', '晚上']
    },
    flexibleTime: Boolean,
    frequency: {
      type: String,
      enum: ['每周一次', '每周两次', '每周三次', '其他']
    },
    duration: Number // 每节课时长（分钟）
  },
  location: {
    address: String,
    district: String,
    city: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    teachingMode: {
      type: String,
      enum: ['线下', '线上', '均可']
    }
  },
  budget: {
    minPrice: Number,
    maxPrice: Number,
    priceNotes: String
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'matched', 'closed'],
    default: 'open'
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  applications: [{
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    applicationTime: Date,
    message: String,
    proposedSchedule: {
      days: [String],
      time: String,
      duration: Number
    },
    proposedPrice: Number
  }]
}, {
  timestamps: true
});

// 创建索引
postSchema.index({ parentId: 1 });
postSchema.index({ status: 1 });
postSchema.index({ 'location.city': 1 });
postSchema.index({ 'location.district': 1 });
postSchema.index({ 'studentInfo.grade': 1 });
postSchema.index({ urgency: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ 'applications.teacherId': 1 });

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
