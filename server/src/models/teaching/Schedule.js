const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['document', 'image', 'video', 'audio'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  description: String
});

const scheduleSchema = new mongoose.Schema({
  teacherId: {
    type: String,
    required: true,
    match: /^TUTOR_\d{14}$/
  },
  contractId: {
    type: String,
    required: true
  },
  scheduleInfo: {
    subject: {
      type: String,
      required: true
    },
    studentName: {
      type: String,
      required: true
    },
    location: {
      type: String,
      required: true
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true,
      validate: {
        validator: function(v) {
          return v > this.scheduleInfo.startTime;
        },
        message: '结束时间必须晚于开始时间'
      }
    },
    duration: {
      type: Number,
      required: true,
      min: [30, '课程时长最少30分钟'],
      max: [360, '课程时长最多360分钟']
    },
    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled'
    }
  },
  attendance: {
    teacherCheckin: {
      type: Date,
      validate: {
        validator: function(v) {
          if (!v) return true; // 允许为空
          const scheduleStart = this.scheduleInfo.startTime;
          const fifteenMinutesBefore = new Date(scheduleStart.getTime() - 15 * 60000);
          return v >= fifteenMinutesBefore;
        },
        message: '教师只能在课程开始前15分钟内签到'
      }
    },
    teacherCheckout: {
      type: Date,
      validate: {
        validator: function(v) {
          if (!v) return true; // 允许为空
          const scheduleEnd = this.scheduleInfo.endTime;
          const fifteenMinutesAfter = new Date(scheduleEnd.getTime() + 15 * 60000);
          return v <= fifteenMinutesAfter;
        },
        message: '教师必须在课程结束后15分钟内签退'
      }
    },
    parentConfirm: {
      status: Boolean,
      time: Date,
      notes: String
    }
  },
  lessonSummary: {
    content: {
      type: String,
      maxlength: [2000, '课程总结不能超过2000字']
    },
    homework: {
      content: String,
      deadline: Date,
      requirements: [String]
    },
    nextGoals: {
      type: String,
      maxlength: [500, '下次目标不能超过500字']
    },
    attachments: [attachmentSchema],
    submittedAt: Date
  },
  notifications: [{
    type: {
      type: String,
      enum: ['reminder', 'checkin', 'checkout', 'summary', 'confirmation']
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending'
    },
    sentAt: Date,
    content: String
  }],
  rescheduleHistory: [{
    originalStartTime: Date,
    originalEndTime: Date,
    newStartTime: Date,
    newEndTime: Date,
    requestedBy: {
      type: String,
      enum: ['teacher', 'parent']
    },
    reason: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    requestedAt: Date,
    processedAt: Date
  }]
}, {
  timestamps: true
});

// 创建索引
scheduleSchema.index({ teacherId: 1 });
scheduleSchema.index({ contractId: 1 });
scheduleSchema.index({ 'scheduleInfo.status': 1 });
scheduleSchema.index({ 'scheduleInfo.startTime': 1 });
scheduleSchema.index({ 'scheduleInfo.endTime': 1 });
scheduleSchema.index({ 'attendance.teacherCheckin': 1 });
scheduleSchema.index({ 'attendance.parentConfirm.status': 1 });

// 添加虚拟字段计算实际持续时间
scheduleSchema.virtual('actualDuration').get(function() {
  if (this.attendance.teacherCheckin && this.attendance.teacherCheckout) {
    return Math.round((this.attendance.teacherCheckout - this.attendance.teacherCheckin) / 60000); // 转换为分钟
  }
  return null;
});

// 添加方法检查课程是否可以开始
scheduleSchema.methods.canStart = function() {
  const now = new Date();
  const scheduleStart = this.scheduleInfo.startTime;
  const fifteenMinutesBefore = new Date(scheduleStart.getTime() - 15 * 60000);
  return now >= fifteenMinutesBefore && this.scheduleInfo.status === 'scheduled';
};

// 添加方法检查课程是否可以结束
scheduleSchema.methods.canEnd = function() {
  const now = new Date();
  const scheduleEnd = this.scheduleInfo.endTime;
  const fifteenMinutesAfter = new Date(scheduleEnd.getTime() + 15 * 60000);
  return now <= fifteenMinutesAfter && this.scheduleInfo.status === 'ongoing';
};

const Schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = Schedule;
