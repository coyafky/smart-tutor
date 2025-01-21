const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['id_card', 'diploma', 'certificate', 'teaching_license', 'other'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verificationNotes: String
});

const teacherVerificationSchema = new mongoose.Schema({
  teacherId: {
    type: String,
    required: true,
    match: /^TUTOR_\d{14}$/
  },
  documents: [documentSchema],
  educationInfo: {
    degree: {
      type: String,
      enum: ['bachelor', 'master', 'phd', 'other'],
      required: true
    },
    major: {
      type: String,
      required: true
    },
    institution: {
      type: String,
      required: true
    },
    graduationYear: {
      type: Number,
      required: true,
      min: 1950,
      max: new Date().getFullYear()
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    }
  },
  teachingQualification: {
    hasTeachingCertificate: Boolean,
    certificateType: String,
    certificateNumber: String,
    issueDate: Date,
    expiryDate: Date,
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    }
  },
  backgroundCheck: {
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'passed', 'failed'],
      default: 'pending'
    },
    provider: String,
    reportId: String
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'in_progress', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  reviewerId: {
    type: String,
    match: /^ADMIN_\d{14}$/
  },
  reviewNotes: {
    type: String,
    maxlength: [1000, '审核备注不能超过1000字']
  },
  rejectionReasons: [{
    reason: String,
    details: String,
    documentType: String
  }],
  timeline: [{
    action: {
      type: String,
      enum: [
        'submitted',
        'documents_verified',
        'education_verified',
        'background_check_completed',
        'approved',
        'rejected',
        'suspended'
      ]
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    actor: String,
    notes: String
  }],
  verificationMetrics: {
    submitCount: {
      type: Number,
      default: 1
    },
    totalProcessingTime: Number, // 总处理时间（小时）
    documentVerificationTime: Number, // 文档验证时间（小时）
    backgroundCheckTime: Number // 背景调查时间（小时）
  }
}, {
  timestamps: true
});

// 创建索引
teacherVerificationSchema.index({ teacherId: 1 });
teacherVerificationSchema.index({ reviewerId: 1 });
teacherVerificationSchema.index({ verificationStatus: 1 });
teacherVerificationSchema.index({ createdAt: -1 });
teacherVerificationSchema.index({ 'backgroundCheck.status': 1 });

// 复合索引
teacherVerificationSchema.index({ teacherId: 1, verificationStatus: 1 });

// 添加方法检查验证是否过期
teacherVerificationSchema.methods.isVerificationExpired = function() {
  if (this.verificationStatus !== 'approved') return false;
  
  const lastApproval = this.timeline
    .filter(t => t.action === 'approved')
    .sort((a, b) => b.timestamp - a.timestamp)[0];
    
  if (!lastApproval) return false;
  
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  return lastApproval.timestamp < oneYearAgo;
};

// 添加方法检查是否需要更新验证
teacherVerificationSchema.methods.needsReverification = function() {
  return this.isVerificationExpired() || 
         (this.teachingQualification.expiryDate && 
          this.teachingQualification.expiryDate < new Date());
};

// 添加方法计算验证完成度
teacherVerificationSchema.methods.getVerificationProgress = function() {
  let total = 0;
  let completed = 0;
  
  // 文档验证
  total += this.documents.length;
  completed += this.documents.filter(d => d.verificationStatus === 'verified').length;
  
  // 教育信息验证
  total += 1;
  if (this.educationInfo.verificationStatus === 'verified') completed += 1;
  
  // 教学资格验证
  if (this.teachingQualification.hasTeachingCertificate) {
    total += 1;
    if (this.teachingQualification.verificationStatus === 'verified') completed += 1;
  }
  
  // 背景调查
  total += 1;
  if (this.backgroundCheck.completed) completed += 1;
  
  return Math.round((completed / total) * 100);
};

const TeacherVerification = mongoose.model('TeacherVerification', teacherVerificationSchema);

module.exports = TeacherVerification;
