# Smart Tutor - Parent Portal

这是 Smart Tutor 平台的家长端，家长可以在这里发布求教需求、查看教师反馈、与教师进行交流等。

## 功能特点

- 发布求教帖子
  - 填写孩子的年级、科目、学习需求
  - 设置预算和期望上课时间
  - 选择所在地区
  - 设置帖子公开性
- 查看教师反馈
  - 查看教师的应聘信息
  - 查看教师对孩子的学习记录
  - 对教师进行评价和打分
- 实时交流
  - 与教师进行实时文字交流
  - 支持发送图片和文件
  - 查看历史消息记录
- 个人中心
  - 管理个人帖子
  - 查看教师反馈
  - 修改个人信息
  - 账户安全设置

## 技术栈

- Vue 3
- Vite
- Tailwind CSS
- Vue Router
- Vuex
- Socket.io（实时通信）

## 开发设置

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```
服务器将在 http://localhost:3001 启动

3. 构建生产版本：
```bash
npm run build
```

## 项目结构

```
parentPage/
├── public/          # 静态资源
├── src/
│   ├── assets/      # 图片、样式等资源
│   ├── components/  # Vue 组件
│   ├── views/       # 页面视图
│   ├── store/       # Vuex 状态管理
│   ├── router/      # 路由配置
│   ├── services/    # API 服务
│   ├── utils/       # 工具函数
│   ├── App.vue      # 根组件
│   └── main.js      # 入口文件
├── index.html
└── vite.config.js   # Vite 配置
```

## API 接口

家长端主要使用以下 API 接口：

- POST /api/posts - 创建求教帖子
- GET /api/posts - 获取帖子列表
- PUT /api/posts/:id - 更新帖子
- DELETE /api/posts/:id - 删除帖子
- GET /api/feedback - 获取教师反馈
- POST /api/feedback - 提交教师评价
- GET /api/messages - 获取消息记录
- POST /api/messages - 发送消息
