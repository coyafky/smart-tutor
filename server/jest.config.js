module.exports = {
  // 测试环境
  testEnvironment: 'node',

  // 测试文件匹配模式
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],

  // 覆盖率收集
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/tests/**',
    '!**/node_modules/**'
  ],

  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // 测试超时时间
  testTimeout: 10000,

  // 在每个测试文件执行前运行的代码
  setupFilesAfterEnv: ['./tests/setup.js'],

  // 模块别名
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },

  // 忽略的文件夹
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],

  // 是否显示每个测试用例的执行时间
  verbose: true
};
