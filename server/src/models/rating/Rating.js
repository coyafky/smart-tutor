const mongoose = require('mongoose');

// 评分验证函数
const validateScore = {
  validator: function(value) {
    return value >= 1 && value <= 5;
  },
  message: '评分必须在1到5之间'
};

const ratingSchema = new mongoose.Schema({
  fromId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  type: {
    type: String,
    enum: ['parent_to_teacher', 'teacher_to_parent'],
    required: true
  },
  scores: {
    // 教师评分项
    teachingProfessional: {
      type: Number,
      validate: validateScore,
      required: function() {
        return this.type === 'parent_to_teacher';
      }
    },
    teachingAttitude: {
      type: Number,
      validate: validateScore,
      required: function() {
        return this.type === 'parent_to_teacher';
      }
    },
    teachingEffect: {
      type: Number,
      validate: validateScore,
      required: function() {
        return this.type === 'parent_to_teacher';
      }
    },
    punctuality: {
      type: Number,
      validate: validateScore,
      required: function() {
        return this.type === 'parent_to_teacher';
      }
    },
    communication: {
      type: Number,
      validate: validateScore,
      required: function() {
        return this.type === 'parent_to_teacher';
      }
    },
    
    // 学生/家长评分项
    studyAttitude: {
      type: Number,
      validate: validateScore,
      required: function() {
        return this.type === 'teacher_to_parent';
      }
    },
    basicLevel: {
      type: Number,
      validate: validateScore,
      required: function() {
        return this.type === 'teacher_to_parent';
      }
    },
    homeworkCompletion: {
      type: Number,
      validate: validateScore,
      required: function() {
        return this.type === 'teacher_to_parent';
      }
    },
    parentCooperation: {
      type: Number,
      validate: validateScore,
      required: function() {
        return this.type === 'teacher_to_parent';
      }
    },
    studyEnvironment: {
      type: Number,
      validate: validateScore,
      required: function() {
        return this.type === 'teacher_to_parent';
      }
    }
  },
  comment: {
    type: String,
    required: true,
    maxlength: [1000, '评价内容不能超过1000字']
  },
  continueIntention: {
    type: Boolean,
    required: true
  },
  recommendation: {
    type: Boolean,
    required: true
  },
  teachingAdvice: {
    type: String,
    maxlength: [500, '教学建议不能超过500字'],
    required: function() {
      return this.type === 'teacher_to_parent';
    }
  },
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  status: {
    type: String,
    enum: ['normal', 'appealed', 'hidden'],
    default: 'normal'
  },
  appealInfo: {
    reason: String,
    evidence: [{
      type: String,
      url: String,
      description: String
    }],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    handledAt: Date,
    resolution: String
  }
}, {
  timestamps: true
});

// 创建索引
ratingSchema.index({ fromId: 1 });
ratingSchema.index({ toId: 1 });
ratingSchema.index({ postId: 1 });
ratingSchema.index({ type: 1 });
ratingSchema.index({ status: 1 });
ratingSchema.index({ createdAt: -1 });
ratingSchema.index({ 'appealInfo.status': 1 });

// 复合索引
ratingSchema.index({ fromId: 1, postId: 1 }, { unique: true });

// 计算总评分的虚拟字段
ratingSchema.virtual('averageScore').get(function() {
  const scores = this.scores;
  let sum = 0;
  let count = 0;
  
  if (this.type === 'parent_to_teacher') {
    const teacherScores = [
      scores.teachingProfessional,
      scores.teachingAttitude,
      scores.teachingEffect,
      scores.punctuality,
      scores.communication
    ];
    sum = teacherScores.reduce((acc, score) => acc + (score || 0), 0);
    count = teacherScores.filter(score => score != null).length;
  } else {
    const parentScores = [
      scores.studyAttitude,
      scores.basicLevel,
      scores.homeworkCompletion,
      scores.parentCooperation,
      scores.studyEnvironment
    ];
    sum = parentScores.reduce((acc, score) => acc + (score || 0), 0);
    count = parentScores.filter(score => score != null).length;
  }
  
  return count > 0 ? sum / count : 0;
});

// 中间件：在保存前验证评分项
ratingSchema.pre('save', function(next) {
  const scores = this.scores;
  if (this.type === 'parent_to_teacher') {
    // 清除不相关的评分项
    scores.studyAttitude = undefined;
    scores.basicLevel = undefined;
    scores.homeworkCompletion = undefined;
    scores.parentCooperation = undefined;
    scores.studyEnvironment = undefined;
  } else {
    // 清除不相关的评分项
    scores.teachingProfessional = undefined;
    scores.teachingAttitude = undefined;
    scores.teachingEffect = undefined;
    scores.punctuality = undefined;
    scores.communication = undefined;
  }
  next();
});

// 添加方法检查评价是否可以被修改
ratingSchema.methods.canBeModified = function() {
  const now = new Date();
  const createdAt = this.createdAt;
  const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
  return hoursSinceCreation <= 24 && this.status === 'normal';
};

// 添加方法检查评价是否可以被申诉
ratingSchema.methods.canBeAppealed = function() {
  const now = new Date();
  const createdAt = this.createdAt;
  const daysSinceCreation = (now - createdAt) / (1000 * 60 * 60 * 24);
  return daysSinceCreation <= 7 && this.status === 'normal';
};

const Rating = mongoose.model('Rating', ratingSchema);

module.exports = Rating;
