# 智能家教平台 API 文档

## 基础信息

- 基础URL: `http://api.smarttutor.com/v1`
- 所有请求都需要在header中携带token: `Authorization: Bearer <token>`
- 响应格式统一为JSON
- 时间格式: ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
- 分页参数: `page`（页码，默认1）, `limit`（每页数量，默认10）

## 1. 认证接口

### 1.1 用户注册
```http
POST /auth/register
```

请求体:
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "role": "teacher|parent",
  "phone": "string"
}
```

响应:
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "userId": "string",
    "username": "string",
    "email": "string",
    "role": "string"
  }
}
```

### 1.2 用户登录
```http
POST /auth/login
```

请求体:
```json
{
  "email": "string",
  "password": "string"
}
```

响应:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "string",
    "refreshToken": "string",
    "user": {
      "userId": "string",
      "username": "string",
      "role": "string"
    }
  }
}
```

## 2. 用户接口

### 2.1 教师接口

#### 2.1.1 更新教师资料
```http
PUT /teachers/profile
```

请求体:
```json
{
  "teachingExperience": "number",
  "education": "string",
  "subjects": ["string"],
  "grades": ["string"],
  "introduction": "string",
  "certificates": ["string"],
  "location": {
    "type": "Point",
    "coordinates": [0, 0]
  }
}
```

响应:
```json
{
  "success": true,
  "message": "资料更新成功",
  "data": {
    "profile": "object"
  }
}
```

### 2.2 家长接口

#### 2.2.1 更新家长资料
```http
PUT /parents/profile
```

请求体:
```json
{
  "children": [{
    "name": "string",
    "grade": "string",
    "school": "string"
  }],
  "location": {
    "type": "Point",
    "coordinates": [0, 0]
  }
}
```

## 3. 帖子接口

### 3.1 创建帖子
```http
POST /posts
```

请求体:
```json
{
  "title": "string",
  "subject": "string",
  "grade": "string",
  "schedule": {
    "frequency": "string",
    "duration": "number",
    "preferredTime": ["string"]
  },
  "price": "number",
  "requirements": "string",
  "location": {
    "type": "Point",
    "coordinates": [0, 0]
  }
}
```

### 3.2 搜索帖子
```http
GET /posts/search
```

查询参数:
```
subject: string
grade: string
minPrice: number
maxPrice: number
location: [longitude, latitude]
distance: number (km)
status: string
page: number
limit: number
```

## 4. 应聘接口

### 4.1 创建应聘
```http
POST /applications
```

请求体:
```json
{
  "postId": "string",
  "introduction": "string",
  "availableTime": ["string"],
  "expectedPrice": "number"
}
```

### 4.2 更新应聘状态
```http
PUT /applications/:applicationId/status
```

请求体:
```json
{
  "status": "accepted|rejected",
  "reason": "string"
}
```

## 5. 课程接口

### 5.1 创建课程合同
```http
POST /courses/contracts
```

请求体:
```json
{
  "postId": "string",
  "teacherId": "string",
  "schedule": {
    "startDate": "string",
    "endDate": "string",
    "frequency": "string",
    "time": ["string"]
  },
  "price": "number"
}
```

### 5.2 创建课程安排
```http
POST /courses/:courseId/schedules
```

请求体:
```json
{
  "scheduleData": [{
    "date": "string",
    "startTime": "string",
    "endTime": "string",
    "location": "string"
  }]
}
```

## 6. 支付接口

### 6.1 创建订单
```http
POST /payments/orders
```

请求体:
```json
{
  "contractId": "string",
  "amount": "number",
  "description": "string"
}
```

### 6.2 处理支付
```http
POST /payments/process
```

请求体:
```json
{
  "orderId": "string",
  "paymentMethod": "string",
  "paymentDetails": "object"
}
```

## 7. 消息接口

### 7.1 发送私信
```http
POST /messages
```

请求体:
```json
{
  "receiverId": "string",
  "content": "string"
}
```

### 7.2 获取消息列表
```http
GET /messages
```

查询参数:
```
contactId: string
page: number
limit: number
```

## 8. 评价接口

### 8.1 创建评价
```http
POST /reviews
```

请求体:
```json
{
  "courseId": "string",
  "rating": "number",
  "content": "string",
  "tags": ["string"]
}
```

### 8.2 获取教师评价
```http
GET /reviews/teachers/:teacherId
```

查询参数:
```
status: string
page: number
limit: number
```

## 9. 推荐接口

### 9.1 获取教师推荐
```http
GET /recommendations/teachers
```

查询参数:
```
postId: string
limit: number
```

### 9.2 获取帖子推荐
```http
GET /recommendations/posts
```

查询参数:
```
limit: number
```

## 10. 管理员接口

### 10.1 获取用户列表
```http
GET /admin/users
```

查询参数:
```
role: string
status: string
searchTerm: string
sortBy: string
sortOrder: string
page: number
limit: number
```

### 10.2 审核内容
```http
PUT /admin/content/:type/:contentId/review
```

请求体:
```json
{
  "status": "approved|rejected",
  "reason": "string"
}
```

## 11. 文件接口

### 11.1 上传文件
```http
POST /files/:type
```

请求体:
```
FormData:
file: File
```

### 11.2 获取文件列表
```http
GET /files/:type
```

查询参数:
```
page: number
limit: number
```

## 错误码说明

- 200: 请求成功
- 201: 创建成功
- 400: 请求参数错误
- 401: 未授权
- 403: 权限不足
- 404: 资源不存在
- 409: 资源冲突
- 500: 服务器错误

## 注意事项

1. 所有涉及金额的字段单位均为分
2. 地理位置坐标使用经纬度表示
3. 文件上传大小限制为5MB
4. 敏感操作需要二次验证
5. 部分接口需要特定角色权限
