const mongoose = require('mongoose');
const moment = require('moment');

const successCaseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, '请描述成功案例'],
    minlength: [10, '描述至少需要10个字符'],
    maxlength: [500, '描述不能超过500个字符']
  },
  improvement: {
    type: Number,
    required: [true, '请填写提升幅度'],
    min: [0, '提升幅度不能为负'],
    max: [100, '提升幅度不能超过100']
  },
  duration: {
    type: Number,
    required: [true, '请填写辅导时长'],
    min: [1, '辅导时长至少为1个月']
  },
  feedback: {
    type: String,
    required: [true, '请填写家长反馈'],
    minlength: [10, '反馈至少需要10个字符'],
    maxlength: [500, '反馈不能超过500个字符']
  },
  verifiedAt: Date
});

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '请选择科目名称'],
    enum: {
      values: ['语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理'],
      message: '{VALUE} 不是有效的科目'
    }
  },
  grades: [{
    type: String,
    required: [true, '请选择年级'],
    enum: {
      values: ['小学一年级', '小学二年级', '小学三年级', '小学四年级', '小学五年级', '小学六年级',
               '初一', '初二', '初三', '高一', '高二', '高三'],
      message: '{VALUE} 不是有效的年级'
    }
  }],
  experience: {
    type: Number,
    required: [true, '请填写教学经验'],
    min: [0, '教学经验不能为负数'],
    validate: {
      validator: Number.isInteger,
      message: '教学经验必须是整数'
    }
  },
  successCases: [successCaseSchema]
});

const timeSlotSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: [true, '请选择开始时间'],
    validate: {
      validator: function(v) {
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: '时间格式必须为 HH:MM'
    }
  },
  endTime: {
    type: String,
    required: [true, '请选择结束时间'],
    validate: {
      validator: function(v) {
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: '时间格式必须为 HH:MM'
    }
  }
});

// 添加时间段验证
timeSlotSchema.pre('validate', function(next) {
  if (this.startTime && this.endTime) {
    const start = moment(this.startTime, 'HH:mm');
    const end = moment(this.endTime, 'HH:mm');
    if (end.isSameOrBefore(start)) {
      this.invalidate('endTime', '结束时间必须晚于开始时间');
    }
  }
  next();
});

const teacherProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  tutorId: {
    type: String,
    required: [true, '教师ID是必需的'],
    unique: true,
    match: [/^TUTOR_\d{14}$/, '教师ID格式不正确']
  },
  firstName: {
    type: String,
    required: [true, '请填写名字'],
    trim: true,
    minlength: [1, '名字至少需要1个字符'],
    maxlength: [20, '名字不能超过20个字符']
  },
  lastName: {
    type: String,
    required: [true, '请填写姓氏'],
    trim: true,
    minlength: [1, '姓氏至少需要1个字符'],
    maxlength: [20, '姓氏不能超过20个字符']
  },
  gender: {
    type: String,
    required: [true, '请选择性别'],
    enum: {
      values: ['male', 'female', 'other'],
      message: '{VALUE} 不是有效的性别选项'
    }
  },
  education: {
    level: {
      type: String,
      required: [true, '请选择学校类型'],
      enum: {
        values: ['985', '211', '一本', '二本', '其他'],
        message: '{VALUE} 不是有效的学校类型'
      }
    },
    school: {
      type: String,
      required: [true, '请填写学校名称'],
      trim: true
    },
    major: {
      type: String,
      required: [true, '请填写专业'],
      trim: true
    },
    graduationYear: {
      type: Number,
      required: [true, '请选择毕业年份'],
      min: [1950, '毕业年份不能早于1950年'],
      max: [new Date().getFullYear() + 5, '毕业年份不能超过未来5年'],
      validate: {
        validator: Number.isInteger,
        message: '毕业年份必须是整数'
      }
    }
  },
  teachingExperience: {
    years: {
      type: Number,
      required: [true, '请填写教学年限'],
      min: [0, '教学年限不能为负数'],
      validate: {
        validator: Number.isInteger,
        message: '教学年限必须是整数'
      }
    },
    subjects: {
      type: [subjectSchema],
      validate: [
        {
          validator: function(v) {
            return v.length > 0;
          },
          message: '至少需要添加一个教学科目'
        }
      ]
    }
  },
  availabilityStatus: {
    type: String,
    enum: {
      values: ['available', 'busy', 'offline'],
      message: '{VALUE} 不是有效的状态'
    },
    default: 'available'
  },
  schedule: {
    workdays: [{
      day: {
        type: String,
        enum: {
          values: ['周一', '周二', '周三', '周四', '周五'],
          message: '{VALUE} 不是有效的工作日'
        }
      },
      evening: {
        available: Boolean,
        startTime: {
          type: String,
          default: "18:00",
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
          default: "21:00",
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
          default: 120,
          min: [30, '课程时长不能少于30分钟'],
          max: [240, '课程时长不能超过4小时']
        },
        status: {
          type: String,
          enum: {
            values: ['available', 'booked', 'blocked'],
            message: '{VALUE} 不是有效的状态'
          },
          default: 'available'
        }
      }
    }],
    weekend: {
      sessions: [{
        day: {
          type: String,
          enum: {
            values: ['周六', '周日'],
            message: '{VALUE} 不是有效的周末日期'
          },
          required: true
        },
        period: {
          type: String,
          enum: {
            values: ['早上', '下午', '晚上'],
            message: '{VALUE} 不是有效的时间段'
          },
          required: true
        },
        available: {
          type: Boolean,
          default: true
        },
        timeSlot: timeSlotSchema,
        duration: {
          type: Number,
          required: true,
          default: 120,
          min: [30, '课程时长不能少于30分钟'],
          max: [240, '课程时长不能超过4小时']
        },
        status: {
          type: String,
          enum: {
            values: ['available', 'booked', 'blocked'],
            message: '{VALUE} 不是有效的状态'
          },
          default: 'available'
        }
      }]
    }
  },
  location: {
    address: {
      type: String,
      required: [true, '请填写详细地址']
    },
    district: {
      type: String,
      required: [true, '请选择区域']
    },
    city: {
      type: String,
      required: [true, '请选择城市']
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: [true, '请提供位置坐标'],
        validate: {
          validator: function(v) {
            return v.length === 2 && 
                   v[0] >= -180 && v[0] <= 180 && 
                   v[1] >= -90 && v[1] <= 90;
          },
          message: '无效的坐标值'
        }
      }
    }
  },
  pricing: {
    basePrice: {
      type: Number,
      required: [true, '请设置基础课时费'],
      min: [0, '课时费不能为负数']
    },
    adjustments: {
      experienceMultiplier: {
        type: Number,
        default: 1,
        min: [0.1, '经验系数不能小于0.1'],
        max: [5, '经验系数不能大于5']
      },
      subjectMultiplier: {
        type: Number,
        default: 1,
        min: [0.1, '科目系数不能小于0.1'],
        max: [5, '科目系数不能大于5']
      },
      gradeMultiplier: {
        type: Number,
        default: 1,
        min: [0.1, '年级系数不能小于0.1'],
        max: [5, '年级系数不能大于5']
      }
    },
    specialOffers: [{
      description: {
        type: String,
        required: [true, '请填写优惠说明']
      },
      discount: {
        type: Number,
        required: [true, '请设置优惠金额'],
        min: [0, '优惠金额不能为负数']
      },
      validUntil: {
        type: Date,
        required: [true, '请设置优惠截止日期'],
        validate: {
          validator: function(v) {
            return v > new Date();
          },
          message: '优惠截止日期必须是将来的日期'
        }
      }
    }]
  },
  ratings: {
    overall: {
      type: Number,
      default: 0,
      min: [0, '评分不能为负数'],
      max: [5, '评分不能超过5分']
    },
    teachingQuality: {
      type: Number,
      default: 0,
      min: [0, '评分不能为负数'],
      max: [5, '评分不能超过5分']
    },
    attitude: {
      type: Number,
      default: 0,
      min: [0, '评分不能为负数'],
      max: [5, '评分不能超过5分']
    },
    punctuality: {
      type: Number,
      default: 0,
      min: [0, '评分不能为负数'],
      max: [5, '评分不能超过5分']
    }
  },
  statistics: {
    totalStudents: {
      type: Number,
      default: 0,
      min: [0, '学生数量不能为负数']
    },
    totalClasses: {
      type: Number,
      default: 0,
      min: [0, '课程数量不能为负数']
    },
    completionRate: {
      type: Number,
      default: 100,
      min: [0, '完成率不能为负数'],
      max: [100, '完成率不能超过100%']
    },
    averageClassDuration: {
      type: Number,
      default: 0,
      min: [0, '平均课时不能为负数']
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 添加索引
teacherProfileSchema.index({ userId: 1 });
teacherProfileSchema.index({ tutorId: 1 });
teacherProfileSchema.index({ "location.coordinates": "2dsphere" });
teacherProfileSchema.index({ "location.city": 1, "location.district": 1 });
teacherProfileSchema.index({ "teachingExperience.subjects.name": 1 });
teacherProfileSchema.index({ "ratings.overall": -1 });
teacherProfileSchema.index({ "statistics.totalStudents": -1 });
teacherProfileSchema.index({ "pricing.basePrice": 1 });
teacherProfileSchema.index({ availabilityStatus: 1 });
teacherProfileSchema.index({ createdAt: -1 });

// 虚拟字段
teacherProfileSchema.virtual('fullName').get(function() {
  return `${this.lastName}${this.firstName}`;
});

teacherProfileSchema.virtual('averageRating').get(function() {
  const { teachingQuality, attitude, punctuality } = this.ratings;
  return ((teachingQuality + attitude + punctuality) / 3).toFixed(1);
});

teacherProfileSchema.virtual('activeOffers').get(function() {
  const now = new Date();
  return this.pricing.specialOffers.filter(offer => offer.validUntil > now);
});

// 关联
teacherProfileSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

teacherProfileSchema.virtual('contracts', {
  ref: 'Contract',
  localField: '_id',
  foreignField: 'teacherId'
});

// 中间件
teacherProfileSchema.pre('save', function(next) {
  // 更新总体评分
  if (this.isModified('ratings.teachingQuality') || 
      this.isModified('ratings.attitude') || 
      this.isModified('ratings.punctuality')) {
    const { teachingQuality, attitude, punctuality } = this.ratings;
    this.ratings.overall = ((teachingQuality + attitude + punctuality) / 3).toFixed(1);
  }
  next();
});

// 实例方法
teacherProfileSchema.methods.isAvailable = function(date, timeSlot) {
  // 实现可用性检查逻辑
};

teacherProfileSchema.methods.calculatePrice = function(duration, subject, grade) {
  // 实现价格计算逻辑
};

teacherProfileSchema.methods.getUpcomingSchedule = function(startDate, endDate) {
  // 实现课程安排查询逻辑
};

const TeacherProfile = mongoose.model('TeacherProfile', teacherProfileSchema);

module.exports = TeacherProfile;
