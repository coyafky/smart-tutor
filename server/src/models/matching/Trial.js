const mongoose = require('mongoose');

const trialSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  schedule: {
    date: {
      type: Date,
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
    duration: Number // 分钟
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
      enum: ['线下', '线上']
    }
  },
  subjects: [{
    name: String,
    topics: [String],
    materials: [String]
  }],
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'missed'],
    default: 'scheduled'
  },
  feedback: {
    parent: {
      rating: Number,
      comment: String,
      aspects: {
        teachingQuality: Number,
        attitude: Number,
        punctuality: Number
      },
      submitTime: Date
    },
    teacher: {
      rating: Number,
      comment: String,
      aspects: {
        studentAttitude: Number,
        parentCooperation: Number,
        learningEnvironment: Number
      },
      submitTime: Date
    }
  },
  notes: {
    beforeClass: String,
    afterClass: String
  },
  price: {
    amount: Number,
    currency: {
      type: String,
      default: 'CNY'
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending'
    }
  },
  cancellation: {
    reason: String,
    cancelledBy: {
      type: String,
      enum: ['parent', 'teacher', 'system']
    },
    cancelTime: Date
  }
}, {
  timestamps: true
});

// 创建索引
trialSchema.index({ postId: 1 });
trialSchema.index({ teacherId: 1 });
trialSchema.index({ parentId: 1 });
trialSchema.index({ status: 1 });
trialSchema.index({ 'schedule.date': 1 });
trialSchema.index({ 'price.status': 1 });
trialSchema.index({ createdAt: -1 });

const Trial = mongoose.model('Trial', trialSchema);

module.exports = Trial;
