// 自定义错误类
class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 业务错误
class BusinessError extends AppError {
  constructor(message, errorCode = 'BUSINESS_ERROR') {
    super(message, 400, errorCode);
  }
}

// 认证错误
class AuthenticationError extends AppError {
  constructor(message = '认证失败', errorCode = 'AUTH_ERROR') {
    super(message, 401, errorCode);
  }
}

// 授权错误
class AuthorizationError extends AppError {
  constructor(message = '权限不足', errorCode = 'FORBIDDEN') {
    super(message, 403, errorCode);
  }
}

// 资源不存在错误
class NotFoundError extends AppError {
  constructor(resource = 'Resource', errorCode = 'NOT_FOUND') {
    super(`${resource}不存在`, 404, errorCode);
  }
}

// 验证错误
class ValidationError extends AppError {
  constructor(message = '数据验证失败', errors = [], errorCode = 'VALIDATION_ERROR') {
    super(message, 400, errorCode);
    this.errors = errors;
  }
}

// 冲突错误
class ConflictError extends AppError {
  constructor(message, errorCode = 'CONFLICT') {
    super(message, 409, errorCode);
  }
}

// 文件错误
class FileError extends AppError {
  constructor(message, errorCode = 'FILE_ERROR') {
    super(message, 400, errorCode);
  }
}

// 第三方服务错误
class ExternalServiceError extends AppError {
  constructor(message = '外部服务错误', service, errorCode = 'EXTERNAL_ERROR') {
    super(message, 502, errorCode);
    this.service = service;
  }
}

// 数据库错误
class DatabaseError extends AppError {
  constructor(message = '数据库错误', errorCode = 'DB_ERROR') {
    super(message, 500, errorCode);
  }
}

// 错误代码映射
const ErrorCodes = {
  // 通用错误 (1xxx)
  UNKNOWN_ERROR: 1000,
  VALIDATION_ERROR: 1001,
  NOT_FOUND: 1002,
  UNAUTHORIZED: 1003,
  FORBIDDEN: 1004,
  CONFLICT: 1005,
  
  // 用户相关错误 (2xxx)
  USER_NOT_FOUND: 2000,
  INVALID_CREDENTIALS: 2001,
  USER_ALREADY_EXISTS: 2002,
  ACCOUNT_DISABLED: 2003,
  
  // 课程相关错误 (3xxx)
  COURSE_NOT_FOUND: 3000,
  INVALID_COURSE_STATUS: 3001,
  COURSE_ALREADY_STARTED: 3002,
  
  // 支付相关错误 (4xxx)
  PAYMENT_FAILED: 4000,
  INSUFFICIENT_BALANCE: 4001,
  INVALID_PAYMENT_STATUS: 4002,
  
  // 文件相关错误 (5xxx)
  FILE_UPLOAD_FAILED: 5000,
  INVALID_FILE_TYPE: 5001,
  FILE_TOO_LARGE: 5002,
  
  // 第三方服务错误 (6xxx)
  EXTERNAL_SERVICE_ERROR: 6000,
  API_LIMIT_EXCEEDED: 6001,
  
  // 数据库错误 (7xxx)
  DB_CONNECTION_ERROR: 7000,
  DB_QUERY_ERROR: 7001,
  DB_WRITE_ERROR: 7002,
  
  // 系统错误 (9xxx)
  SYSTEM_ERROR: 9000,
  MAINTENANCE_MODE: 9001
};

module.exports = {
  AppError,
  BusinessError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  ConflictError,
  FileError,
  ExternalServiceError,
  DatabaseError,
  ErrorCodes
};
