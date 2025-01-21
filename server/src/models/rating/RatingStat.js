const mongoose = require('mongoose');

const ratingStatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['teacher', 'parent'],
    required: true
  },
  totalRatings: {
    type: Number,
    default: 0,
    min: 0
  },
  averageScores: {
    // 教师评分项
    teachingProfessional: {
      type: Number,
      min: 0,
      max: 5
    },
    teachingAttitude: {
      type: Number,
      min: 0,
      max: 5
    },
    teachingEffect: {
      type: Number,
      min: 0,
      max: 5
    },
    punctuality: {
      type: Number,
      min: 0,
      max: 5
    },
    communication: {
      type: Number,
      min: 0,
      max: 5
    },
    
    // 家长/学生评分项
    studyAttitude: {
      type: Number,
      min: 0,
      max: 5
    },
    basicLevel: {
      type: Number,
      min: 0,
      max: 5
    },
    homeworkCompletion: {
      type: Number,
      min: 0,
      max: 5
    },
    parentCooperation: {
      type: Number,
      min: 0,
      max: 5
    },
    studyEnvironment: {
      type: Number,
      min: 0,
      max: 5
    }
  },
  recommendationRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  continueIntentionRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  ranking: {
    type: Number,
    min: 1,
    validate: {
      validator: function(v) {
        return this.role === 'teacher' ? v > 0 : true;
      },
      message: '排名只适用于教师角色'
    }
  },
  ratingDistribution: {
    five: {
      type: Number,
      default: 0
    },
    four: {
      type: Number,
      default: 0
    },
    three: {
      type: Number,
      default: 0
    },
    two: {
      type: Number,
      default: 0
    },
    one: {
      type: Number,
      default: 0
    }
  },
  monthlyStats: [{
    year: Number,
    month: Number,
    totalRatings: Number,
    averageScore: Number,
    recommendationRate: Number,
    continueIntentionRate: Number
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 创建索引
ratingStatSchema.index({ userId: 1 });
ratingStatSchema.index({ role: 1 });
ratingStatSchema.index({ ranking: 1 });
ratingStatSchema.index({ lastUpdated: -1 });

// 复合索引
ratingStatSchema.index({ role: 1, ranking: 1 });

// 计算总体评分的虚拟字段
ratingStatSchema.virtual('overallScore').get(function() {
  const scores = this.averageScores;
  let sum = 0;
  let count = 0;

  if (this.role === 'teacher') {
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

  return count > 0 ? (sum / count).toFixed(1) : 0;
});

// 获取评分趋势
ratingStatSchema.methods.getRatingTrend = function(months = 6) {
  const stats = this.monthlyStats
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    })
    .slice(0, months)
    .reverse();

  return stats.map(stat => ({
    period: `${stat.year}-${String(stat.month).padStart(2, '0')}`,
    averageScore: stat.averageScore,
    recommendationRate: stat.recommendationRate,
    continueIntentionRate: stat.continueIntentionRate
  }));
};

const RatingStat = mongoose.model('RatingStat', ratingStatSchema);

module.exports = RatingStat;
