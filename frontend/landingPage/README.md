# Smart Tutor - Landing Page

这是 Smart Tutor 平台的登录页面，用户可以在这里选择自己的角色（家长、教师或管理员）并跳转到相应的页面。

## 功能特点

- 角色选择：用户可以选择以下三种角色之一：
  - 家长：跳转到家长端（端口：5001）
  - 教师：跳转到教师端（端口：5002）
  - 管理员：跳转到管理员端（端口：5003）
- 响应式设计：适配各种屏幕尺寸
- 平滑过渡动画：提供良好的用户体验

## 技术栈

- Vue 3
- Vite
- Tailwind CSS
- Vue Router

## 开发设置

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```
服务器将在 http://localhost:3000 启动

3. 构建生产版本：
```bash
npm run build
```

## 项目结构

```
landingPage/
├── public/          # 静态资源
├── src/
│   ├── assets/      # 图片、样式等资源
│   ├── components/  # Vue 组件
│   │   ├── HomeView.vue
│   │   ├── FeaturesSection.vue
│   │   └── RoleChoose.vue
│   ├── App.vue      # 根组件
│   └── main.js      # 入口文件
├── index.html
└── vite.config.js   # Vite 配置
