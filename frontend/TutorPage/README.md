# Smart Tutor - Tutor Portal

这是 Smart Tutor 平台的教师端，教师可以在这里浏览求教帖子、与家长交流、记录学习情况等。

## 功能特点

- 浏览求教帖子
  - 按科目、年级、地区等条件筛选
  - 查看详细需求和联系方式
  - 收藏感兴趣的帖子
- 应聘与交流
  - 应聘感兴趣的帖子
  - 与家长进行初步沟通
  - 查看家长的反馈和评价
- 学习记录
  - 记录每次上课内容
  - 记录学生表现和作业完成情况
  - 使用 AI 工具生成学习汇总
- 实时交流
  - 与家长进行实时文字交流
  - 支持发送图片和文件
  - 查看历史消息记录
- 路线规划
  - 获取当前位置
  - 查看最优公共交通路线
  - 集成高德地图 API
- 个人中心
  - 管理应聘记录
  - 查看家长反馈
  - 修改个人信息
  - 账户安全设置

## 技术栈

- Vue 3
- Vite
- Tailwind CSS
- Vue Router
- Vuex
- Socket.io（实时通信）
- 高德地图 API
- DeepSeek API（AI 工具）

## 开发设置

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```
服务器将在 http://localhost:3002 启动

3. 构建生产版本：
```bash
npm run build
```

## 项目结构

```
tutorPage/
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

教师端主要使用以下 API 接口：

- GET /api/posts - 获取帖子列表
- POST /api/applications - 提交应聘申请
- POST /api/feedback - 提交学习记录
- GET /api/messages - 获取消息记录
- POST /api/messages - 发送消息
- GET /api/route - 获取路线规划
- POST /api/ai/summary - 生成学习汇总

## 第三方服务配置

### 高德地图 API

在 `.env` 文件中配置高德地图 API：
```
VITE_AMAP_KEY=your_amap_key
```

### DeepSeek API

在 `.env` 文件中配置 DeepSeek API：
```
VITE_DEEPSEEK_KEY=your_deepseek_key
