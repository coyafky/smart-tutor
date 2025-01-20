# 数据库设计

## 用户

```json
{
  _id: ObjectId,
    customId: {                   // 自定义用户ID
    type: String,              // 格式：TUTOR_20231201000001/PARENT_20231201000001/ADMIN_20231201000001
    required: true,
    unique: true,
    match: /^(TUTOR|PARENT|ADMIN)_\d{14}$/
  },              // 用户ID
  username: String,             // 用户名
  password: String,             // 加密密码
  email: String,               // 邮箱
  phone: String,               // 手机号
   role: {                      // 角色
    type: String,
    enum: ['parent', 'teacher', 'admin'],
    required: true
  },                // 角色：parent/teacher/admin
  avatar: String,              // 头像URL
 status: {                    // 状态
    type: String,
    enum: ['active', 'inactive', 'banned'],
    default: 'active'
  },              // 状态：active/inactive/banned
  createdAt: Date,             // 创建时间
  updatedAt: Date              // 更新时间
}

索引：
{
  customId: 1,                 // 自定义ID唯一索引
  username: 1,                 // 用户名唯一索引
  email: 1,                    // 邮箱唯一索引
  phone: 1,                    // 手机号唯一索引
  role: 1,                     // 角色索引
  status: 1                    // 状态索引
}
```

## 教师模块

**teacher_profiles（教师档案集合）**

```json
{
  _id: ObjectId,                // 档案ID
  userId: ObjectId,
   tutorId: {                    // 教师自定义ID
    type: String,
    required: true,
    unique: true,
    match: /^TUTOR_\d{14}$/
  },          // 关联用户ID
  firstName: String,            // 名
  lastName: String,             // 姓
  gender: String,               // 性别：男/女
  education: {
    level: String,              // 学历：985/211/一本/二本/其他
    school: String,             // 毕业院校
    major: String,              // 专业
    graduationYear: Number      // 毕业年份
  },
  teachingExperience: {
    years: Number,              // 教龄
    subjects: [{                // 教授科目
      name: String,             // 科目名称
      grades: [String],         // 适用年级
      experience: Number        // 该科目教龄
    }]
  },

  schedule: {
    workdays: [{              // 工作日
      day: {
        type: String,
        enum: ['周一', '周二', '周三', '周四', '周五']
      },
      evening: {              // 晚上时间段
        available: Boolean,    // 是否可用
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
        duration: {           // 课程时长（分钟）
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
      sessions: [{           // 周末课程时间段
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
        timeSlot: {
          startTime: {
            type: String,
            required: true,
            validate: {
              validator: function(v) {
                return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
              }
            }
          },
          endTime: {
            type: String,
            required: true,
            validate: {
              validator: function(v) {
                return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
              }
            }
          }
        },
        duration: {          // 课程时长（分钟）
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
      defaultTimes: {       // 默认时间设置
        早上: {
          startTime: "09:00",
          endTime: "12:00"
        },
        下午: {
          startTime: "14:00",
          endTime: "17:00"
        },
        晚上: {
          startTime: "19:00",
          endTime: "21:00"
        }
      }
    }
  },
  location: {                   // 位置信息
    address: String,            // 详细地址
    district: String,           // 区域
    city: String,              // 城市
    coordinates: {              // 坐标
      latitude: Number,
      longitude: Number
    }
  },
  pricing: {                    // 价格设置
    basePrice: Number,          // 基础价格（每小时）
    priceRange: {              // 价格范围
      min: Number,
      max: Number
    },
    specialPricing: [{         // 特殊价格
      type: String,            // 类型：trial/package/holiday
      price: Number,           // 价格
      description: String      // 说明
    }]
  },
  teachingStyle: {             // 教学风格
    description: String,       // 风格描述
    keywords: [String],        // 关键词标签
    strengths: [String]        // 教学特长
  },
  credentials: [{              // 资质证书
    name: String,              // 证书名称
    issuer: String,           // 发证机构
    issueDate: Date,          // 发证日期
    expiryDate: Date,         // 有效期
    imageUrl: String,         // 证书图片
    verificationStatus: String // 验证状态：pending/verified/rejected
  }],
  ratings: {                   // 评分统计
    overall: Number,           // 总体评分
    professional: Number,      // 专业能力
    attitude: Number,          // 教学态度
    punctuality: Number,       // 准时程度
    communication: Number,     // 沟通能力
    ratingCount: Number       // 评价数量
  },
  statistics: {               // 统计数据
    totalStudents: Number,    // 总学生数
    totalClasses: Number,     // 总课时数
    completionRate: Number,   // 课程完成率
    repeatRate: Number        // 续课率
  },
  status: String,             // 状态：active/inactive/suspended
  createdAt: Date,
  updatedAt: Date

}

索引：
{
  userId: 1,                  // 用户ID索引
  subjects: 1,                // 科目索引
  "location.coordinates": "2dsphere",  // 地理位置索引
 // ... 其他索引保持不变 ...
  "schedule.workdays.day": 1,
  "schedule.weekend.sessions.day": 1,
  "schedule.weekend.sessions.period": 1,
  "schedule.weekend.sessions.status": 1
}
```

### 课程安排模块

```json
{
  _id: ObjectId,                // 课程安排ID
  teacherId: {                  // 教师ID
    type: String,
    required: true,
    match: /^TUTOR_\d{14}$/
  },
  contractId: {                 // 关联的契约ID
    type: String,
    required: true
  },
  scheduleInfo: {              // 课程信息
    subject: String,           // 科目
    studentName: String,       // 学生姓名
    location: String,          // 上课地点
    startTime: Date,          // 开始时间
    endTime: Date,            // 结束时间
    duration: Number,         // 时长(分钟)
    status: {                 // 课程状态
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled'
    }
  },
  attendance: {                // 考勤记录
    teacherCheckin: Date,     // 教师签到时间
    teacherCheckout: Date,    // 教师签退时间
    parentConfirm: {          // 家长确认
      status: Boolean,
      time: Date
    }
  },
  lessonSummary: {            // 课程总结
    content: String,          // 总结内容
    homework: String,         // 作业安排
    nextGoals: String,        // 下次目标
    attachments: [{           // 附件
      type: String,
      url: String
    }]
  },
  createdAt: Date,
  updatedAt: Date
}

索引：
{
  teacherId: 1,               // 教师ID索引
  contractId: 1,              // 契约ID索引
  "scheduleInfo.status": 1,   // 状态索引
  "scheduleInfo.startTime": 1 // 开始时间索引
}
```

### 收入

```json
{
  _id: ObjectId,               // 收入记录ID
  teacherId: {                 // 教师ID
    type: String,
    required: true,
    match: /^TUTOR_\d{14}$/
  },
  contractId: String,          // 关联契约ID
  type: {                      // 收入类型
    type: String,
    enum: ['class', 'trial', 'bonus'],
    required: true
  },
  amount: Number,              // 金额
  status: {                    // 状态
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  periodInfo: {                // 结算周期
    startDate: Date,           // 开始日期
    endDate: Date,            // 结束日期
    totalHours: Number        // 总课时
  },
  details: [{                  // 收入明细
    date: Date,               // 日期
    hours: Number,            // 课时数
    rate: Number,            // 课时费率
    amount: Number           // 金额
  }],
  createdAt: Date,
  updatedAt: Date
}

索引：
{
  teacherId: 1,               // 教师ID索引
  contractId: 1,              // 契约ID索引
  type: 1,                    // 类型索引
  status: 1,                  // 状态索引
  "periodInfo.startDate": 1   // 开始日期索引
}
```

## 家长模块

基本信息

```json
{
  _id: ObjectId,                // 档案ID
  parentId: {                   // 家长自定义ID
    type: String,
    required: true,
    unique: true,
    match: /^PARENT_\d{14}$/
  },
  firstName: String,            // 名
  lastName: String,             // 姓
  gender: String,               // 性别
  location: {                   // 位置信息
    address: String,            // 详细地址
    district: String,           // 区域
    city: String,              // 城市
    coordinates: {              // 坐标
      latitude: Number,
      longitude: Number
    }
  },
  preferences: {                // 教学偏好
    teachingLocation: {         // 上课地点
      type: String,
      enum: ['家里', '教师家', '其他']
    },
    teacherGender: {           // 教师性别偏好
      type: String,
      enum: ['男', '女', '不限']
    },
    teachingStyle: [String],   // 期望的教学风格
    budget: {                  // 预算
      min: Number,
      max: Number,
      period: String          // 计费周期：per_hour/per_session
    }
  },
  statistics: {                // 统计数据
    totalPosts: Number,        // 发布帖子数
    totalTeachers: Number,     // 聘请教师数
    totalClasses: Number,      // 总课时数
    totalSpent: Number         // 总支出
  },
  status: {                    // 状态
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: Date,
  updatedAt: Date
}

```

帖子模块

```json
{
  _id: ObjectId,                // 帖子ID
  parentId: {                   // 关联家长ID
    type: String,
    required: true,
    ref: 'Parent'
  },


  grade: {                      // 年级
    type: String,
    enum: ['小学一年级', '小学二年级', '小学三年级', '小学四年级', '小学五年级', '小学六年级',
           '初中一年级', '初中二年级', '初中三年级',
           '高中一年级', '高中二年级', '高中三年级']
  },
  school: {                     // 学校信息
    name: String,               // 学校名称
    type: {                     // 学校类型
      type: String,
      enum: ['私立', '国际学校', '公立']
    }
  },
   "location": {
    "address": "北京市朝阳区XX路XX号",
    "district": "朝阳区",
    "city": "北京",
    "coordinates": {
      "latitude": 39.9042,
      "longitude": 116.4074
    }
  }
  subjects: [{                  // 需要辅导的科目
    name: String,              // 科目名称
    currentScore: String,      // 当前成绩
    targetScore: String,       // 目标成绩
    difficulty: String         // 困难点
  }],
  preferences: {                // 教学偏好（可覆盖家长模块的偏好）
    teachingLocation: {         // 上课地点
      type: String,
      enum: ['家里', '教师家', '其他']
    },
    teacherGender: {           // 教师性别偏好
      type: String,
      enum: ['男', '女', '不限']
    },
    teachingStyle: [String],   // 期望的教学风格
    budget: {                  // 预算
      min: Number,
      max: Number,
      period: String          // 计费周期：per_hour/per_session
    }
  },
  status: {                    // 帖子状态
    type: String,
    enum: ['open', 'closed', 'archived'],
    default: 'open'
  },
  createdAt: Date,
  updatedAt: Date
}

```

## 管理员模块

```json

{
  _id: ObjectId,                // 档案ID
  adminId: {                    // 管理员自定义ID
    type: String,
    required: true,
    unique: true,
    match: /^ADMIN_\d{14}$/
  },
  name: String,                 // 管理员姓名
  role: {                       // 管理员角色
    type: String,
    enum: ['super', 'normal'],  // super: 超级管理员, normal: 普通管理员
    default: 'normal'
  },
  permissions: {                // 权限设置
    userManage: Boolean,        // 用户管理权限
    postManage: Boolean,        // 帖子管理权限
    reviewManage: Boolean,      // 审核管理权限
    systemConfig: Boolean       // 系统配置权限
  },
  contactInfo: {                // 联系方式
    email: String,              // 邮箱
    phone: String               // 电话
  },
  lastLoginAt: Date,            // 最后登录时间
  status: {                     // 状态
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: Date,
  updatedAt: Date
}

索引：
{
  adminId: 1,                   // 管理员ID唯一索引
  role: 1,                      // 角色索引
  status: 1                     // 状态索引
}
```

## 家长教师交互的数据

应聘模块

```json

{
  _id: ObjectId,              // 应聘ID
  postId: {                   // 帖子ID
    type: String,
    required: true
  },
  teacherId: {                // 教师ID
    type: String,
    required: true,
    match: /^TUTOR_\d{14}$/
  },
  parentId: {                 // 家长ID
    type: String,
    required: true,
    match: /^PARENT_\d{14}$/
  },
  applicationInfo: {          // 应聘信息
    message: String,          // 应聘留言
    expectedSalary: Number,   // 期望薪资
    availableTime: [{         // 可用时间
      day: String,
      period: String,
      startTime: String,
      endTime: String
    }],
    attachments: [{           // 附件（如试讲视频）
      type: String,
      url: String
    }]
  },
  processInfo: {              // 处理信息
    status: {                 // 应聘状态
      type: String,
      enum: ['pending', 'viewed', 'shortlisted', 'rejected', 'withdrawn', 'accepted'],
      default: 'pending'
    },
    parentResponse: {         // 家长回复
      content: String,
      time: Date
    },
    teacherResponse: {        // 教师回复
      content: String,
      time: Date
    },
    trialClassId: String     // 关联的试听课程ID
  },
  createdAt: Date,
  updatedAt: Date
}

索引：
{
  postId: 1,                 // 帖子ID索引
  teacherId: 1,              // 教师ID索引
  parentId: 1,               // 家长ID索引
  "processInfo.status": 1,   // 状态索引
  createdAt: -1             // 创建时间降序索引
}

```

```json

{
  _id: ObjectId,             // 试听ID
  postId: ObjectId,          // 帖子ID
  teacherId: ObjectId,       // 教师ID
  parentId: ObjectId,        // 家长ID
  studentInfo: {             // 学生信息
    name: String,           // 学生姓名
    grade: String,          // 年级
    subject: String,        // 试听科目
    requirements: String    // 特殊要求
  },
  scheduleInfo: {           // 排课信息
    scheduleTime: Date,     // 预约时间
    duration: Number,       // 时长（分钟）
    location: String,       // 上课地点
    onlineLink: String      // 线上课程链接（如果是线上课程）
  },
  status: {                 // 状态管理
    current: String,        // 当前状态：pending/confirmed/completed/cancelled
    history: [{            // 状态变更历史
      status: String,      // 状态
      time: Date,          // 变更时间
      operator: String,    // 操作者ID
      reason: String       // 变更原因
    }]
  },
  attendance: {             // 考勤记录
    teacherCheckin: Date,  // 教师签到时间
    teacherCheckout: Date, // 教师签退时间
    parentConfirm: {       // 家长确认
      status: Boolean,     // 是否确认
      time: Date          // 确认时间
    }
  },
  feedback: {               // 试听反馈
    parent: {              // 家长反馈
      rating: Number,      // 总体评分
      teachingRating: Number, // 教学评分
      attitudeRating: Number, // 态度评分
      comment: String,     // 评价内容
      continueIntention: Boolean, // 继续意向
      suggestions: String  // 建议
    },
    teacher: {             // 教师反馈
      comment: String,     // 课程总结
      studentPerformance: String, // 学生表现
      suggestions: String, // 建议
      teachingPlan: String // 教学计划建议
    },
    submittedAt: Date      // 反馈提交时间
  },
  notifications: [{         // 通知记录
    type: String,          // 通知类型：reminder/status_change/feedback_request
    content: String,       // 通知内容
    sentAt: Date,         // 发送时间
    status: String        // 通知状态：sent/read
  }],
  createdAt: Date,         // 创建时间
  updatedAt: Date          // 更新时间
}

索引：
{
  postId: 1,                // 帖子ID索引
  teacherId: 1,             // 教师ID索引
  scheduleTime: 1           // 预约时间索引
}
```

**contracts（教学契约集合）**

````json
{
  _id: ObjectId,                // 契约ID
  parentId: {                   // 家长ID
    type: String,
    required: true,
    match: /^PARENT_\d{14}$/
  },
  teacherId: {                  // 教师ID
    type: String,
    required: true,
    match: /^TUTOR_\d{14}$/
  },
  postId: {                     // 关联帖子ID
    type: String,
    required: true
  },
  terms: {                      // 契约条款
    subject: String,            // 教授科目
    schedule: [{                // 上课安排
      day: String,              // 上课日期
      period: String,           // 时间段（早上/下午/晚上）
      startTime: String,        // 开始时间
      endTime: String,          // 结束时间
      duration: Number,         // 时长(分钟)
      status: {                 // 课时状态
        type: String,
        enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
        default: 'scheduled'
      },
      actualStartTime: String,  // 实际开始时间
      actualEndTime: String,    // 实际结束时间
      rescheduleReason: String  // 改期原因
    }],
    price: Number,              // 课时费（元/小时）
    location: String,           // 上课地点
    startDate: Date,           // 开始日期
    endDate: Date,             // 结束日期
    autoRenew: Boolean         // 是否自动续约
  },
  status: {                     // 契约状态
    type: String,
    enum: ['active', 'completed', 'terminated', 'renewed'],
    default: 'active'
  },
  matchScore: Number,           // 匹配度评分（用于推荐系统）
  teachingRecord: {             // 教学记录
    totalClasses: Number,       // 总课时数
    completedClasses: Number,   // 已完成课时
    cancelledClasses: Number,   // 取消课时
    averageRating: Number       // 平均评分
  },
  createdAt: Date,
  updatedAt: Date
}

#### favorites（收藏集合）
```javascript
{
  _id: ObjectId,                // 收藏ID
  userId: {                     // 收藏用户ID
    type: String,
    required: true,
    match: /^(TUTOR|PARENT)_\d{14}$/
  },
  type: {                       // 收藏类型
    type: String,
    enum: ['teacher', 'post'],  // teacher: 收藏教师, post: 收藏帖子
    required: true
  },
  targetId: {                   // 目标ID（教师ID或帖子ID）
    type: String,
    required: true
  },
  note: String,                 // 收藏备注
  tags: [String],               // 自定义标签
  status: {                     // 收藏状态
    type: String,
    enum: ['active', 'deleted'],
    default: 'active'
  },
  createdAt: Date,
  updatedAt: Date
}

索引：
{
  userId: 1,                    // 用户ID索引
  type: 1,                      // 收藏类型索引
  targetId: 1,                  // 目标ID索引
  status: 1,                    // 状态索引
  createdAt: -1                 // 创建时间降序索引
}
````

**ratings（评价集合）**

```json
{
  _id: ObjectId,            // 评价ID
  fromId: ObjectId,         // 评价人ID
  toId: ObjectId,           // 被评价人ID
  postId: ObjectId,         // 帖子ID
  type: String,             // 类型：parent_to_teacher/teacher_to_parent
  scores: {                 // 评分详情
    teachingProfessional: Number,  // 教学专业度
    teachingAttitude: Number,      // 教学态度
    teachingEffect: Number,        // 教学效果
    punctuality: Number,           // 守时情况
    communication: Number,         // 沟通能力
    studyAttitude: Number,         // 学习态度
    basicLevel: Number,            // 学生基础
    homeworkCompletion: Number,    // 作业完成
    parentCooperation: Number,     // 家长配合度
    studyEnvironment: Number       // 学习环境
  },
  comment: String,          // 评价内容
  continueIntention: Boolean, // 继续意向
  recommendation: Boolean,  // 是否推荐给其他家长
  teachingAdvice: String,   // 教学建议（教师评价时填写）
  visibility: {            // 评价可见性设置
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  status: {                // 评价状态
    type: String,
    enum: ['normal', 'appealed', 'hidden'],
    default: 'normal'
  },
  createdAt: Date,         // 创建时间
  updatedAt: Date          // 更新时间
}

索引：
{
  fromId: 1,               // 评价人索引
  toId: 1,                 // 被评价人索引
  postId: 1,               // 帖子索引
  type: 1,                 // 类型索引
  status: 1,               // 状态索引
  createdAt: -1            // 创建时间降序索引
}
```

## 用户管理员 交互模块

ratingAppeals（评价申诉集合）

```json
{
  _id: ObjectId,           // 申诉ID
  ratingId: ObjectId,      // 评价ID
  appealerId: ObjectId,     // 申诉人ID
  reason: String,          // 申诉理由
  evidence: [{             // 申诉证据
    type: String,         // 文件类型
    url: String           // 文件URL
  }],
  status: {               // 申诉状态
    type: String,
    enum: ['pending', 'processing', 'resolved', 'rejected'],
    default: 'pending'
  },
  adminResponse: {        // 管理员处理结果
    adminId: ObjectId,    // 处理人ID
    result: String,       // 处理结果
    comment: String,      // 处理说明
    handledAt: Date       // 处理时间
  },
  createdAt: Date,        // 创建时间
  updatedAt: Date         // 更新时间
}

索引：
{
  ratingId: 1,            // 评价ID索引
  appealerId: 1,           // 申诉人索引
  status: 1,               // 状态索引
  createdAt: -1            // 创建时间降序索引
}

```

ratingStats（评分统计集合）

```json
{
  _id: ObjectId,           // 统计ID
  userId: ObjectId,        // 用户ID
  role: String,            // 角色：teacher/parent
  totalRatings: Number,    // 总评价数
  averageScores: {         // 平均分详情
    teachingProfessional: Number,  // 教学专业度
    teachingAttitude: Number,      // 教学态度
    teachingEffect: Number,        // 教学效果
    punctuality: Number,           // 守时情况
    communication: Number,         // 沟通能力
    studyAttitude: Number,         // 学习态度
    basicLevel: Number,            // 学生基础
    homeworkCompletion: Number,    // 作业完成
    parentCooperation: Number,     // 家长配合度
    studyEnvironment: Number       // 学习环境
  },
  recommendationRate: Number, // 推荐率
  continueIntentionRate: Number, // 继续意向率
  ranking: Number,         // 教师排名（仅教师角色）
  lastUpdated: Date        // 最后更新时间
}

索引：
{
  userId: 1,               // 用户ID索引
  role: 1,                 // 角色索引
  ranking: 1,              // 排名索引
  lastUpdated: -1          // 更新时间降序索引
}
```

**feedbacks（用户反馈集合）**

```json

{
  _id: ObjectId,                // 反馈ID
  userId: {                     // 用户ID
    type: String,
    required: true,
    match: /^(TUTOR|PARENT|ADMIN)_\d{14}$/
  },
  type: {                       // 反馈类型
    type: String,
    enum: ['bug', 'feature', 'suggestion', 'complaint', 'other'],
    required: true
  },
  module: {                     // 相关模块
    type: String,
    enum: ['用户系统', '家教匹配', '课程管理', '支付系统', '评价系统', '其他'],
    required: true
  },
  title: {                      // 反馈标题
    type: String,
    required: true
  },
  content: {                    // 反馈内容
    type: String,
    required: true
  },
  priority: {                   // 优先级
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  attachments: [{               // 附件（截图等）
    type: String,              // 文件URL
    fileType: String,          // 文件类型
    fileName: String           // 文件名
  }],
  status: {                     // 处理状态
    type: String,
    enum: ['pending', 'processing', 'resolved', 'rejected'],
    default: 'pending'
  },
  response: {                   // 处理结果
    content: String,           // 回复内容
    adminId: String,           // 处理人ID
    responseTime: Date         // 回复时间
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}

索引：
{
  userId: 1,                    // 用户ID索引
  type: 1,                      // 反馈类型索引
  module: 1,                    // 模块索引
  status: 1,                    // 状态索引
  priority: -1,                 // 优先级降序索引
  createdAt: -1                 // 创建时间降序索引
}
```

**审核记录相关集合**

### **post_reviews（帖子审核记录集合）**

### **teacher_verifications（教师认证审核记录集合）**
