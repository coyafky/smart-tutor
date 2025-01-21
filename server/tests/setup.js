const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const config = require('../src/config');

let mongod;

// 在所有测试开始前连接到内存数据库
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri, config.database.options);
});

// 每个测试后清理数据库
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
});

// 所有测试结束后关闭连接
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
});

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

// 全局测试工具函数
global.createTestUser = async (role = 'parent') => {
  const User = require('../src/models/user');
  return await User.create({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    role
  });
};

// 模拟请求对象
global.mockRequest = (overrides = {}) => {
  const req = {
    body: {},
    query: {},
    params: {},
    headers: {},
    ...overrides
  };
  return req;
};

// 模拟响应对象
global.mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

// 模拟下一个中间件
global.mockNext = jest.fn();
