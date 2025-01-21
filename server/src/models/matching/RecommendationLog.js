const mongoose = require('mongoose');

const recommendationLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recommendationType: {
    type: String,
    enum: ['teacher', 'course', 'resource', 'study_plan'],
    required: true
  },
  recommendedItems: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'recommendationType'
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    features: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    },
    rank: {
      type: Number,
      required: true
    },
    displayed: {
      type: Boolean,
      default: true
    }
  }],
  userAction: {
    type: String,
    enum: ['viewed', 'clicked', 'contacted', 'ignored', 'hidden'],
    required: true
  },
  contextFeatures: {
    userLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    },
    userPreferences: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    },
    timeOfDay: String,
    dayOfWeek: String,
    deviceType: String
  },
  algorithmVersion: {
    type: String,
    required: true
  },
  modelFeatures: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  metrics: {
    responseTime: Number,  // 推荐生成时间（毫秒）
    clickThroughRate: Number,
    conversionRate: Number
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String
  }
}, {
  timestamps: true
});

// 创建索引
recommendationLogSchema.index({ userId: 1 });
recommendationLogSchema.index({ recommendationType: 1 });
recommendationLogSchema.index({ createdAt: -1 });
recommendationLogSchema.index({ 'recommendedItems.score': -1 });
recommendationLogSchema.index({ userAction: 1 });
recommendationLogSchema.index({ algorithmVersion: 1 });

// 复合索引
recommendationLogSchema.index({ userId: 1, recommendationType: 1 });
recommendationLogSchema.index({ userId: 1, createdAt: -1 });

// 2dsphere索引用于地理位置查询
recommendationLogSchema.index({ 'contextFeatures.userLocation': '2dsphere' });

// 添加方法计算推荐效果
recommendationLogSchema.statics.calculateEffectiveness = async function(timeRange) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeRange);
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$recommendationType',
        totalRecommendations: { $sum: 1 },
        interactions: {
          $sum: {
            $cond: [
              { $in: ['$userAction', ['clicked', 'contacted']] },
              1,
              0
            ]
          }
        },
        averageScore: { $avg: { $avg: '$recommendedItems.score' } }
      }
    },
    {
      $project: {
        effectiveness: {
          $divide: ['$interactions', '$totalRecommendations']
        },
        averageScore: 1,
        totalRecommendations: 1,
        interactions: 1
      }
    }
  ]);
};

// 添加方法获取用户兴趣特征
recommendationLogSchema.statics.getUserInterests = async function(userId) {
  const recentLogs = await this.find({
    userId,
    userAction: { $in: ['clicked', 'contacted'] }
  })
  .sort({ createdAt: -1 })
  .limit(50)
  .select('recommendedItems.features')
  .lean();
  
  const features = {};
  recentLogs.forEach(log => {
    log.recommendedItems.forEach(item => {
      if (!item.features) return;
      item.features.forEach((value, key) => {
        if (!features[key]) features[key] = [];
        features[key].push(value);
      });
    });
  });
  
  return features;
};

const RecommendationLog = mongoose.model('RecommendationLog', recommendationLogSchema);

module.exports = RecommendationLog;
