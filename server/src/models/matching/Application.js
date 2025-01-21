const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    required: true
  },
  period: {
    type: String,
    enum: ['早上', '下午', '晚上'],
    required: true
  },
  startTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: '时间格式必须为 HH:MM'
    }
  },
  endTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: '时间格式必须为 HH:MM'
    }
  }
});

const attachmentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['video', 'document', 'image'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  description: String
});

const applicationSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  teacherId: {
    type: String,
    required: true,
    match: /^TUTOR_\d{14}$/
  },
  parentId: {
    type: String,
    required: true,
    match: /^PARENT_\d{14}$/
  },
  applicationInfo: {
    message: {
      type: String,
      required: true
    },
    expectedSalary: {
      amount: {
        type: Number,
        required: true
      },
      period: {
        type: String,
        enum: ['per_hour', 'per_session'],
        required: true
      }
    },
    availableTime: [timeSlotSchema],
    attachments: [attachmentSchema],
    teachingPlan: {
      methodology: String,
      materials: [String],
      milestones: [String]
    }
  },
  processInfo: {
    status: {
      type: String,
      enum: ['pending', 'viewed', 'shortlisted', 'rejected', 'withdrawn', 'accepted'],
      default: 'pending'
    },
    parentResponse: {
      content: String,
      time: Date
    },
    teacherResponse: {
      content: String,
      time: Date
    },
    notes: [{
      content: String,
      createdBy: {
        type: String,
        enum: ['parent', 'teacher', 'system']
      },
      createdAt: Date
    }],
    trialClassId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trial'
    }
  },
  timeline: [{
    action: {
      type: String,
      enum: ['created', 'viewed', 'shortlisted', 'message_sent', 'rejected', 'withdrawn', 'accepted']
    },
    actor: {
      type: String,
      enum: ['parent', 'teacher', 'system']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: String
  }]
}, {
  timestamps: true
});

// 创建索引
applicationSchema.index({ postId: 1 });
applicationSchema.index({ teacherId: 1 });
applicationSchema.index({ parentId: 1 });
applicationSchema.index({ 'processInfo.status': 1 });
applicationSchema.index({ createdAt: -1 });
applicationSchema.index({ 'applicationInfo.expectedSalary.amount': 1 });
applicationSchema.index({ 'processInfo.trialClassId': 1 });

// 复合索引
applicationSchema.index({ postId: 1, teacherId: 1 }, { unique: true });

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
