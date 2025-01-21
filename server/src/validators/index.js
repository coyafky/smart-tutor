const { body, query, param } = require('express-validator');

// 通用验证规则
const commonValidators = {
  // 分页验证
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须大于0'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间')
  ],

  // ID验证
  mongoId: (field) => param(field).isMongoId().withMessage('无效的ID格式'),

  // 日期验证
  dateRange: [
    query('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式无效')
  ],

  // 排序验证
  sorting: [
    query('sortBy').optional().isString().withMessage('排序字段必须是字符串'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('排序方向无效')
  ],

  // 地理位置验证
  location: [
    body('location.coordinates').optional().isArray().withMessage('坐标必须是数组'),
    body('location.coordinates.*').optional().isFloat().withMessage('坐标必须是数字'),
    body('location.type').optional().equals('Point').withMessage('位置类型必须是Point')
  ]
};

// 用户相关验证
const userValidators = {
  // 注册验证
  register: [
    body('username').trim().notEmpty().withMessage('用户名不能为空')
      .isLength({ min: 2, max: 30 }).withMessage('用户名长度必须在2-30之间'),
    body('email').isEmail().withMessage('邮箱格式不正确')
      .normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('密码至少6个字符')
      .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/).withMessage('密码必须包含字母和数字'),
    body('role').isIn(['teacher', 'parent']).withMessage('角色无效'),
    body('phone').matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确')
  ],

  // 个人资料验证
  profile: {
    teacher: [
      body('teachingExperience').optional().isInt({ min: 0 }).withMessage('教学经验必须是非负整数'),
      body('education').optional().isString().withMessage('教育背景必须是字符串'),
      body('subjects').optional().isArray().withMessage('科目必须是数组'),
      body('subjects.*').optional().isString().withMessage('科目必须是字符串'),
      body('grades').optional().isArray().withMessage('年级必须是数组'),
      body('grades.*').optional().isString().withMessage('年级必须是字符串'),
      body('introduction').optional().isString().withMessage('简介必须是字符串')
        .isLength({ max: 1000 }).withMessage('简介不能超过1000字符')
    ],
    parent: [
      body('children').isArray().withMessage('children必须是数组'),
      body('children.*.name').notEmpty().withMessage('孩子姓名不能为空')
        .isLength({ max: 20 }).withMessage('姓名不能超过20字符'),
      body('children.*.grade').notEmpty().withMessage('孩子年级不能为空'),
      body('children.*.school').optional().isString().withMessage('学校必须是字符串')
    ]
  }
};

// 帖子相关验证
const postValidators = {
  // 创建帖子
  create: [
    body('title').notEmpty().withMessage('标题不能为空')
      .isLength({ max: 100 }).withMessage('标题不能超过100字符'),
    body('subject').notEmpty().withMessage('科目不能为空'),
    body('grade').notEmpty().withMessage('年级不能为空'),
    body('schedule').isObject().withMessage('课程安排必须是对象'),
    body('schedule.frequency').notEmpty().withMessage('上课频率不能为空'),
    body('schedule.duration').isInt({ min: 1 }).withMessage('课程时长必须大于0'),
    body('schedule.preferredTime').isArray().withMessage('首选时间必须是数组'),
    body('price').isInt({ min: 0 }).withMessage('价格必须大于等于0'),
    body('requirements').optional().isString().withMessage('要求必须是字符串')
      .isLength({ max: 500 }).withMessage('要求不能超过500字符')
  ],

  // 搜索帖子
  search: [
    query('keyword').optional().isString(),
    query('subject').optional().isString(),
    query('grade').optional().isString(),
    query('minPrice').optional().isInt({ min: 0 }),
    query('maxPrice').optional().isInt({ min: 0 }),
    query('status').optional().isIn(['open', 'closed', 'in_progress']),
    ...commonValidators.pagination
  ]
};

// 课程相关验证
const courseValidators = {
  // 创建课程合同
  contract: [
    body('postId').notEmpty().withMessage('帖子ID不能为空'),
    body('teacherId').notEmpty().withMessage('教师ID不能为空'),
    body('schedule').isObject().withMessage('课程安排必须是对象'),
    body('schedule.startDate').isISO8601().withMessage('开始日期格式无效'),
    body('schedule.endDate').isISO8601().withMessage('结束日期格式无效'),
    body('schedule.frequency').notEmpty().withMessage('上课频率不能为空'),
    body('schedule.time').isArray().withMessage('上课时间必须是数组'),
    body('price').isInt({ min: 0 }).withMessage('价格必须大于等于0')
  ],

  // 课程记录
  record: [
    body('content').notEmpty().withMessage('课程内容不能为空')
      .isLength({ max: 2000 }).withMessage('内容不能超过2000字符'),
    body('homework').optional().isString().withMessage('作业必须是字符串')
      .isLength({ max: 500 }).withMessage('作业不能超过500字符'),
    body('performance').optional().isString().withMessage('表现评价必须是字符串')
      .isLength({ max: 500 }).withMessage('表现评价不能超过500字符')
  ]
};

// 支付相关验证
const paymentValidators = {
  // 创建订单
  order: [
    body('contractId').notEmpty().withMessage('合同ID不能为空'),
    body('amount').isInt({ min: 0 }).withMessage('金额必须大于等于0'),
    body('description').notEmpty().withMessage('订单描述不能为空')
      .isLength({ max: 200 }).withMessage('描述不能超过200字符')
  ],

  // 退款申请
  refund: [
    body('orderId').notEmpty().withMessage('订单ID不能为空'),
    body('amount').isInt({ min: 0 }).withMessage('退款金额必须大于等于0'),
    body('reason').notEmpty().withMessage('退款原因不能为空')
      .isLength({ max: 200 }).withMessage('原因不能超过200字符')
  ]
};

// 评价相关验证
const reviewValidators = {
  // 创建评价
  create: [
    body('courseId').notEmpty().withMessage('课程ID不能为空'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('评分必须在1-5之间'),
    body('content').notEmpty().withMessage('评价内容不能为空')
      .isLength({ max: 500 }).withMessage('内容不能超过500字符'),
    body('tags').optional().isArray().withMessage('标签必须是数组'),
    body('tags.*').optional().isString().withMessage('标签必须是字符串')
  ],

  // 回复评价
  reply: [
    body('content').notEmpty().withMessage('回复内容不能为空')
      .isLength({ max: 200 }).withMessage('内容不能超过200字符')
  ]
};

// 消息相关验证
const messageValidators = {
  // 发送消息
  send: [
    body('receiverId').notEmpty().withMessage('接收者ID不能为空'),
    body('content').notEmpty().withMessage('消息内容不能为空')
      .isLength({ max: 500 }).withMessage('内容不能超过500字符')
  ],

  // 获取消息列表
  list: [
    query('contactId').optional().isString(),
    ...commonValidators.pagination
  ]
};

// 应用相关验证
const applicationValidators = {
  // 创建应聘申请
  create: [
    body('postId').notEmpty().withMessage('帖子ID不能为空'),
    body('introduction').notEmpty().withMessage('自我介绍不能为空')
      .isLength({ max: 500 }).withMessage('介绍不能超过500字符'),
    body('availableTime').isArray().withMessage('可用时间必须是数组'),
    body('expectedPrice').optional().isInt({ min: 0 }).withMessage('期望价格必须大于等于0')
  ],

  // 试讲安排
  trial: [
    body('time').isISO8601().withMessage('时间格式无效'),
    body('duration').isInt({ min: 15 }).withMessage('时长必须大于15分钟'),
    body('location').notEmpty().withMessage('地点不能为空')
  ]
};

module.exports = {
  commonValidators,
  userValidators,
  postValidators,
  courseValidators,
  paymentValidators,
  reviewValidators,
  messageValidators,
  applicationValidators
};
