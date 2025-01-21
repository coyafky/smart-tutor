const mongoose = require('mongoose');
const moment = require('moment');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '请选择科目名称'],
    enum: {
      values: ['语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理'],
      message: '{VALUE} 不是有效的科目'
    }
  },
  currentLevel: {
    type: String,
    required: [true, '请选择当前水平'],
    enum: {
      values: ['优秀', '良好', '中等', '待提高'],
      message: '{VALUE} 不是有效的水平评价'
    }
  },
  targetLevel: {
    type: String,
    required: [true, '请选择目标水平'],
    enum: {
      values: ['优秀', '良好', '中等'],
      message: '{VALUE} 不是有效的水平评价'
    },
    validate: {
      validator: function(v) {
        const levels = ['优秀', '良好', '中等'];
        const currentIndex = levels.indexOf(this.currentLevel);
        const targetIndex = levels.indexOf(v);
        return targetIndex <= currentIndex;
      },
      message: '目标水平必须高于当前水平'
    }
  },
  weakPoints: {
    type: [String],
    validate: {
      validator: function(v) {
        return v.length > 0 && v.length <= 5;
      },
      message: '薄弱点数量应在1-5个之间'
    }
  }
});

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '请填写学校名称'],
    trim: true,
    minlength: [2, '学校名称至少需要2个字符'],
    maxlength: [50, '学校名称不能超过50个字符']
  },
  type: {
    type: String,
    required: [true, '请选择学校类型'],
    enum: {
      values: ['私立', '国际学校', '公立'],
      message: '{VALUE} 不是有效的学校类型'
    }
  }
});

const childSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '请填写孩子姓名'],
    trim: true,
    minlength: [2, '姓名至少需要2个字符'],
    maxlength: [20, '姓名不能超过20个字符']
  },
  grade: {
    type: String,
    required: [true, '请选择年级'],
    enum: {
      values: [
        '小学一年级', '小学二年级', '小学三年级', '小学四年级', '小学五年级', '小学六年级',
        '初中一年级', '初中二年级', '初中三年级',
        '高中一年级', '高中二年级', '高中三年级'
      ],
      message: '{VALUE} 不是有效的年级'
    }
  },
  school: {
    type: schoolSchema,
    required: [true, '请填写学校信息']
  },
  subjects: {
    type: [subjectSchema],
    validate: {
      validator: function(v) {
        return v.length > 0;
      },
      message: '至少需要添加一个学习科目'
    }
  },
  birthDate: {
    type: Date,
    required: [true, '请填写出生日期'],
    validate: {
      validator: function(v) {
        const age = moment().diff(moment(v), 'years');
        return age >= 6 && age <= 18;
      },
      message: '孩子年龄必须在6-18岁之间'
    }
  },
  gender: {
    type: String,
    required: [true, '请选择性别'],
    enum: {
      values: ['male', 'female'],
      message: '{VALUE} 不是有效的性别选项'
    }
  }
});

const parentProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  parentId: {
    type: String,
    required: [true, '家长ID是必需的'],
    unique: true,
    match: [/^PARENT_\d{14}$/, '家长ID格式不正确']
  },
  children: {
    type: [childSchema],
    validate: {
      validator: function(v) {
        return v.length > 0 && v.length <= 5;
      },
      message: '孩子数量应在1-5个之间'
    }
  },
  preferences: {
    teachingLocation: {
      type: String,
      required: [true, '请选择授课地点'],
      enum: {
        values: ['家里', '教师家', '其他'],
        message: '{VALUE} 不是有效的授课地点'
      }
    },
    teacherGender: {
      type: String,
      required: [true, '请选择教师性别偏好'],
      enum: {
        values: ['男', '女', '不限'],
        message: '{VALUE} 不是有效的性别选项'
      }
    },
    teachingStyle: {
      type: [String],
      validate: {
        validator: function(v) {
          const validStyles = ['严厉', '温和', '启发式', '互动式', '专注式'];
          return v.every(style => validStyles.includes(style));
        },
        message: '包含无效的教学风格'
      }
    },
    budget: {
      min: {
        type: Number,
        required: [true, '请设置最低预算'],
        min: [50, '最低预算不能低于50元'],
        max: [1000, '最低预算不能超过1000元']
      },
      max: {
        type: Number,
        required: [true, '请设置最高预算'],
        min: [50, '最高预算不能低于50元'],
        max: [1000, '最高预算不能超过1000元']
      },
      period: {
        type: String,
        required: [true, '请选择计费周期'],
        enum: {
          values: ['per_hour', 'per_session'],
          message: '{VALUE} 不是有效的计费周期'
        }
      }
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
  statistics: {
    totalPosts: {
      type: Number,
      default: 0,
      min: [0, '发帖数量不能为负数']
    },
    totalTeachers: {
      type: Number,
      default: 0,
      min: [0, '教师数量不能为负数']
    },
    totalClasses: {
      type: Number,
      default: 0,
      min: [0, '课程数量不能为负数']
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: [0, '消费金额不能为负数']
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, '评分不能为负数'],
      max: [5, '评分不能超过5分']
    }
  },
  reviewHistory: [{
    teacherId: {
      type: String,
      required: [true, '教师ID是必需的'],
      match: [/^TUTOR_\d{14}$/, '教师ID格式不正确']
    },
    trialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trial'
    },
    rating: {
      type: Number,
      required: [true, '请给出评分'],
      min: [1, '评分不能低于1分'],
      max: [5, '评分不能超过5分']
    },
    comment: {
      type: String,
      required: [true, '请填写评价内容'],
      minlength: [10, '评价内容至少需要10个字符'],
      maxlength: [500, '评价内容不能超过500个字符']
    },
    aspects: {
      teachingQuality: {
        type: Number,
        required: [true, '请评价教学质量'],
        min: [1, '评分不能低于1分'],
        max: [5, '评分不能超过5分']
      },
      attitude: {
        type: Number,
        required: [true, '请评价教学态度'],
        min: [1, '评分不能低于1分'],
        max: [5, '评分不能超过5分']
      },
      punctuality: {
        type: Number,
        required: [true, '请评价准时程度'],
        min: [1, '评分不能低于1分'],
        max: [5, '评分不能超过5分']
      }
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 添加索引
parentProfileSchema.index({ userId: 1 });
parentProfileSchema.index({ parentId: 1 });
parentProfileSchema.index({ "location.coordinates": "2dsphere" });
parentProfileSchema.index({ "location.city": 1, "location.district": 1 });
parentProfileSchema.index({ "children.grade": 1 });
parentProfileSchema.index({ "children.subjects.name": 1 });
parentProfileSchema.index({ "statistics.totalPosts": -1 });
parentProfileSchema.index({ "statistics.totalClasses": -1 });
parentProfileSchema.index({ createdAt: -1 });

// 虚拟字段
parentProfileSchema.virtual('activeChildren').get(function() {
  return this.children.length;
});

parentProfileSchema.virtual('averageSpentPerClass').get(function() {
  if (this.statistics.totalClasses === 0) return 0;
  return (this.statistics.totalSpent / this.statistics.totalClasses).toFixed(2);
});

// 关联
parentProfileSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

parentProfileSchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'parentId'
});

parentProfileSchema.virtual('contracts', {
  ref: 'Contract',
  localField: '_id',
  foreignField: 'parentId'
});

// 中间件
parentProfileSchema.pre('save', function(next) {
  // 验证预算范围
  if (this.preferences.budget.min > this.preferences.budget.max) {
    next(new Error('最低预算不能高于最高预算'));
  }
  next();
});

// 实例方法
parentProfileSchema.methods.addChild = async function(childData) {
  if (this.children.length >= 5) {
    throw new Error('最多只能添加5个孩子');
  }
  this.children.push(childData);
  return this.save();
};

parentProfileSchema.methods.updateStatistics = async function() {
  // 实现统计更新逻辑
};

parentProfileSchema.methods.findNearbyTeachers = async function(maxDistance) {
  // 实现附近教师查找逻辑
};

const ParentProfile = mongoose.model('ParentProfile', parentProfileSchema);

module.exports = ParentProfile;
