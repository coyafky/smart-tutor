# Smart Tutor - Admin Portal

这是 Smart Tutor 平台的管理员端，管理员可以在这里管理用户、审核帖子、处理反馈等。

## 功能特点

- 用户管理
  - 审核用户注册申请
  - 管理用户状态（激活/禁用）
  - 查看用户详细信息
  - 处理用户投诉
- 帖子管理
  - 审核求教帖子
  - 对帖子进行分类
  - 设置帖子推荐
  - 处理违规帖子
- 反馈管理
  - 查看教师学习记录
  - 查看家长评价
  - 处理争议反馈
  - 评级教师表现
- 系统管理
  - 查看系统运行状态
  - 管理系统配置
  - 查看操作日志
  - 数据统计分析

## 技术栈

- Vue 3
- Vite
- Tailwind CSS
- Vue Router
- Vuex
- Element Plus（UI 组件库）
- ECharts（数据可视化）

## 开发设置

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```
服务器将在 http://localhost:3003 启动

3. 构建生产版本：
```bash
npm run build
```

## 项目结构

```
adminPage/
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

管理员端主要使用以下 API 接口：

- GET /api/admin/users - 获取用户列表
- PUT /api/admin/users/:id/status - 更新用户状态
- GET /api/admin/posts - 获取帖子列表
- PUT /api/admin/posts/:id/status - 更新帖子状态
- GET /api/admin/feedback - 获取反馈列表
- PUT /api/admin/feedback/:id/status - 更新反馈状态
- GET /api/admin/statistics - 获取统计数据
- GET /api/admin/logs - 获取操作日志

## 权限管理

管理员端实现了基于角色的访问控制（RBAC），确保只有具有管理员权限的用户才能访问相应功能。所有的 API 请求都需要携带管理员令牌进行身份验证。
