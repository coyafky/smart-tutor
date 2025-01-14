# Smart Tutor - Backend Server

这是 Smart Tutor 平台的后端服务器，提供用户认证、数据存储、业务逻辑处理等功能。

## 功能特点

- 用户认证
  - 用户注册和登录
  - JWT 令牌认证
  - 角色权限控制
- 帖子管理
  - 发布和更新帖子
  - 帖子搜索和筛选
  - 帖子状态管理
- 消息系统
  - 实时消息推送
  - 消息历史记录
  - 文件上传支持
- 反馈系统
  - 学习记录管理
  - 评价和评分
  - AI 辅助总结
- 地理服务
  - 地址解析
  - 路线规划
  - 距离计算

## 技术栈

- Node.js
- Express
- MongoDB
- Socket.io
- JWT
- bcryptjs
- 高德地图 API
- DeepSeek API

## 开发设置

1. 安装依赖：
```bash
npm install
```

2. 配置环境变量：
创建 `.env` 文件并设置以下变量：
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart-tutor
JWT_SECRET=your_jwt_secret_key
AMAP_KEY=your_amap_key
DEEPSEEK_KEY=your_deepseek_key
```

3. 启动开发服务器：
```bash
npm run dev
```

4. 构建生产版本：
```bash
npm run build
```

## 项目结构

```
server/
├── src/
│   ├── models/      # 数据模型
│   ├── routes/      # 路由处理
│   ├── controllers/ # 业务逻辑
│   ├── middleware/  # 中间件
│   ├── services/    # 外部服务
│   ├── utils/       # 工具函数
│   └── app.js       # 应用入口
├── .env             # 环境变量
└── package.json     # 项目配置
```

## API 文档

### 认证相关

- POST /api/auth/register - 用户注册
- POST /api/auth/login - 用户登录
- GET /api/auth/profile - 获取用户信息

### 帖子相关

- POST /api/posts - 创建帖子
- GET /api/posts - 获取帖子列表
- GET /api/posts/:id - 获取帖子详情
- PUT /api/posts/:id - 更新帖子
- DELETE /api/posts/:id - 删除帖子

### 反馈相关

- POST /api/feedback - 提交反馈
- GET /api/feedback - 获取反馈列表
- PUT /api/feedback/:id - 更新反馈

### 消息相关

- GET /api/messages - 获取消息历史
- POST /api/messages - 发送消息
- POST /api/upload - 上传文件

### 管理员相关

- GET /api/admin/users - 获取用户列表
- PUT /api/admin/users/:id/status - 更新用户状态
- GET /api/admin/statistics - 获取统计数据

## 数据库模型

### User 模型
```javascript
{
  name: String,
  email: String,
  password: String,
  role: Enum['parent', 'tutor', 'admin'],
  status: Enum['active', 'pending', 'banned']
}
```

### Post 模型
```javascript
{
  parentId: ObjectId,
  subject: String,
  grade: String,
  requirements: String,
  budget: Number,
  location: {
    address: String,
    coordinates: [Number]
  },
  status: Enum['open', 'closed', 'pending']
}
```

### Feedback 模型
```javascript
{
  tutorId: ObjectId,
  parentId: ObjectId,
  postId: ObjectId,
  content: String,
  rating: Number,
  status: Enum['active', 'disputed', 'resolved']
}
```

## 安全性

- 使用 bcryptjs 加密用户密码
- 实现 JWT 令牌认证
- 使用 CORS 控制跨域访问
- 实现请求速率限制
- 输入数据验证和清理
