const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
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
  },
  duration: {
    type: Number,
    required: true,
    min: [30, '课程时长最少30分钟'],
    max: [360, '课程时长最多360分钟']
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
    default: 'scheduled'
  },
  actualStartTime: String,
  actualEndTime: String,
  rescheduleReason: String
});

const contractSchema = new mongoose.Schema({
  parentId: {
    type: String,
    required: true,
    match: /^PARENT_\d{14}$/
  },
  teacherId: {
    type: String,
    required: true,
    match: /^TUTOR_\d{14}$/
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  terms: {
    subject: {
      type: String,
      required: true
    },
    schedule: [scheduleSchema],
    price: {
      type: Number,
      required: true,
      min: [0, '价格不能为负']
    },
    location: {
      type: String,
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function(v) {
          return v > this.terms.startDate;
        },
        message: '结束日期必须晚于开始日期'
      }
    },
    autoRenew: {
      type: Boolean,
      default: false
    }
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'terminated', 'renewed'],
    default: 'active'
  },
  matchScore: {
    type: Number,
    min: 0,
    max: 100
  },
  teachingRecord: {
    totalClasses: {
      type: Number,
      default: 0
    },
    completedClasses: {
      type: Number,
      default: 0
    },
    cancelledClasses: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    }
  },
  renewalHistory: [{
    previousContractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract'
    },
    renewalDate: Date,
    changes: {
      price: Number,
      schedule: [scheduleSchema],
      location: String
    },
    reason: String
  }],
  terminationInfo: {
    reason: String,
    requestedBy: {
      type: String,
      enum: ['parent', 'teacher', 'system']
    },
    requestDate: Date,
    effectiveDate: Date,
    note: String
  }
}, {
  timestamps: true
});

// 创建索引
contractSchema.index({ parentId: 1 });
contractSchema.index({ teacherId: 1 });
contractSchema.index({ postId: 1 });
contractSchema.index({ status: 1 });
contractSchema.index({ 'terms.startDate': 1 });
contractSchema.index({ 'terms.endDate': 1 });
contractSchema.index({ matchScore: -1 });
contractSchema.index({ 'teachingRecord.averageRating': -1 });

// 复合索引
contractSchema.index({ parentId: 1, teacherId: 1, status: 1 });

// 添加方法检查合同是否可以续约
contractSchema.methods.canRenew = function() {
  if (this.status !== 'active') return false;
  const now = new Date();
  const thirtyDaysBeforeEnd = new Date(this.terms.endDate);
  thirtyDaysBeforeEnd.setDate(thirtyDaysBeforeEnd.getDate() - 30);
  return now >= thirtyDaysBeforeEnd;
};

// 添加方法计算合同的完成率
contractSchema.methods.getCompletionRate = function() {
  if (this.teachingRecord.totalClasses === 0) return 0;
  return (this.teachingRecord.completedClasses / this.teachingRecord.totalClasses) * 100;
};

const Contract = mongoose.model('Contract', contractSchema);

module.exports = Contract;
