const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    match: /^(TUTOR|PARENT)_\d{14}$/
  },
  type: {
    type: String,
    enum: ['teacher', 'post'],
    required: true
  },
  targetId: {
    type: String,
    required: true
  },
  note: String,
  tags: [String],
  status: {
    type: String,
    enum: ['active', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: true
});

// 创建索引
favoriteSchema.index({ userId: 1 });
favoriteSchema.index({ type: 1 });
favoriteSchema.index({ targetId: 1 });
favoriteSchema.index({ status: 1 });
favoriteSchema.index({ createdAt: -1 });

// 复合索引，确保用户不能重复收藏同一个目标
favoriteSchema.index({ userId: 1, type: 1, targetId: 1 }, { unique: true });

// 添加方法检查是否是活跃收藏
favoriteSchema.methods.isActive = function() {
  return this.status === 'active';
};

const Favorite = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;
