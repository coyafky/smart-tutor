const mongoose = require('mongoose');

const feedbackRecordSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
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
  studentProgress: {
    subject: {
      type: String,
      required: true
    },
    topics: [{
      name: String,
      description: String,
      difficulty: {
        type: Number,
        min: 1,
        max: 5
      }
    }],
    mastery: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    improvements: [{
      area: String,
      description: String,
      suggestion: String
    }]
  },
  nextGoals: [{
    goal: {
      type: String,
      required: true
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    targetDate: Date,
    metrics: {
      type: String,
      required: true
    }
  }],
  learningMaterials: [{
    type: {
      type: String,
      enum: ['homework', 'exercise', 'reading', 'video', 'other']
    },
    title: String,
    description: String,
    url: String,
    dueDate: Date
  }],
  classPerformance: {
    attendance: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      required: true
    },
    participation: {
      type: String,
      enum: ['active', 'moderate', 'passive'],
      required: true
    },
    homework: {
      completion: {
        type: Number,
        min: 0,
        max: 100
      },
      quality: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor']
      }
    }
  },
  recommendations: {
    studyHabits: [String],
    resources: [String],
    practiceAreas: [String]
  },
  parentFeedback: {
    required: {
      type: Boolean,
      default: true
    },
    deadline: Date,
    received: {
      type: Boolean,
      default: false
    },
    content: String
  }
}, {
  timestamps: true
});

// 创建索引
feedbackRecordSchema.index({ orderId: 1 });
feedbackRecordSchema.index({ teacherId: 1 });
feedbackRecordSchema.index({ parentId: 1 });
feedbackRecordSchema.index({ createdAt: -1 });
feedbackRecordSchema.index({ 'studentProgress.mastery': 1 });

// 复合索引
feedbackRecordSchema.index({ teacherId: 1, parentId: 1 });
feedbackRecordSchema.index({ orderId: 1, createdAt: -1 });

// 添加方法获取进度变化
feedbackRecordSchema.statics.getProgressHistory = async function(parentId, subject) {
  return this.find({
    parentId,
    'studentProgress.subject': subject
  })
  .sort({ createdAt: 1 })
  .select('studentProgress.mastery createdAt')
  .lean();
};

// 添加方法检查是否需要家长反馈
feedbackRecordSchema.methods.needsParentFeedback = function() {
  if (!this.parentFeedback.required) return false;
  if (this.parentFeedback.received) return false;
  
  return this.parentFeedback.deadline > new Date();
};

// 添加方法生成进度报告
feedbackRecordSchema.methods.generateProgressReport = function() {
  const report = {
    subject: this.studentProgress.subject,
    mastery: this.studentProgress.mastery,
    topicsLearned: this.studentProgress.topics.length,
    performance: this.classPerformance,
    nextSteps: this.nextGoals.map(goal => ({
      goal: goal.goal,
      deadline: goal.targetDate
    })),
    recommendations: this.recommendations
  };
  
  if (this.parentFeedback.received) {
    report.parentFeedback = this.parentFeedback.content;
  }
  
  return report;
};

const FeedbackRecord = mongoose.model('FeedbackRecord', feedbackRecordSchema);

module.exports = FeedbackRecord;
