const mongoose = require('mongoose');

const successCaseSchema = new mongoose.Schema({
  description: String,
  improvement: Number,
  duration: Number,
  feedback: String
});

const subjectSchema = new mongoose.Schema({
  name: String,
  grades: [String],
  experience: Number,
  successCases: [successCaseSchema]
});

const timeSlotSchema = new mongoose.Schema({
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

const teacherProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tutorId: {
    type: String,
    required: true,
    unique: true,
    match: /^TUTOR_\d{14}$/
  },
  firstName: String,
  lastName: String,
  gender: String,
  education: {
    level: {
      type: String,
      enum: ['985', '211', '一本', '二本', '其他']
    },
    school: String,
    major: String,
    graduationYear: Number
  },
  teachingExperience: {
    years: Number,
    subjects: [subjectSchema]
  },
  availabilityStatus: {
    type: String,
    enum: ['available', 'busy', 'offline'],
    default: 'available'
  },
  schedule: {
    workdays: [{
      day: {
        type: String,
        enum: ['周一', '周二', '周三', '周四', '周五']
      },
      evening: {
        available: Boolean,
        startTime: {
          type: String,
          default: "18:00",
          required: true
        },
        endTime: {
          type: String,
          default: "21:00",
          required: true
        },
        duration: {
          type: Number,
          required: true,
          default: 120
        },
        status: {
          type: String,
          enum: ['available', 'booked', 'blocked'],
          default: 'available'
        }
      }
    }],
    weekend: {
      sessions: [{
        day: {
          type: String,
          enum: ['周六', '周日'],
          required: true
        },
        period: {
          type: String,
          enum: ['早上', '下午', '晚上'],
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
          default: 120
        },
        status: {
          type: String,
          enum: ['available', 'booked', 'blocked'],
          default: 'available'
        }
      }],
      defaultTimes: {
        早上: {
          startTime: {
            type: String,
            default: "09:00"
          },
          endTime: {
            type: String,
            default: "12:00"
          }
        },
        下午: {
          startTime: {
            type: String,
            default: "14:00"
          },
          endTime: {
            type: String,
            default: "17:00"
          }
        },
        晚上: {
          startTime: {
            type: String,
            default: "19:00"
          },
          endTime: {
            type: String,
            default: "21:00"
          }
        }
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
  pricing: {
    basePrice: Number,
    adjustments: {
      experienceMultiplier: Number,
      subjectMultiplier: Number,
      gradeMultiplier: Number
    },
    specialOffers: [{
      description: String,
      discount: Number,
      validUntil: Date
    }]
  },
  ratings: {
    overall: Number,
    teachingQuality: Number,
    attitude: Number,
    punctuality: Number
  },
  statistics: {
    totalStudents: {
      type: Number,
      default: 0
    },
    totalClasses: {
      type: Number,
      default: 0
    },
    totalHours: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 100
    },
    averageRating: {
      type: Number,
      default: 0
    },
    totalIncome: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// 创建索引
teacherProfileSchema.index({ userId: 1 });
teacherProfileSchema.index({ tutorId: 1 });
teacherProfileSchema.index({ 'location.city': 1 });
teacherProfileSchema.index({ 'location.district': 1 });
teacherProfileSchema.index({ 'ratings.overall': -1 });
teacherProfileSchema.index({ 'teachingExperience.years': -1 });
teacherProfileSchema.index({ 'pricing.basePrice': 1 });
teacherProfileSchema.index({ availabilityStatus: 1 });

const TeacherProfile = mongoose.model('TeacherProfile', teacherProfileSchema);

module.exports = TeacherProfile;
