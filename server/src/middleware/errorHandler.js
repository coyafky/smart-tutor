const { AppError, ErrorCodes } = require('../utils/errors');
const { logger } = require('../utils/logger');
const mongoose = require('mongoose');

// 开发环境错误处理
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: {
      statusCode: err.statusCode,
      status: err.status,
      message: err.message,
      code: err.errorCode,
      stack: err.stack,
      errors: err.errors
    }
  });
};

// 生产环境错误处理
const sendErrorProd = (err, res) => {
  // 可操作的错误，发送详细信息
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        errors: err.errors
      }
    });
  }
  // 编程错误，不泄露错误详情
  else {
    logger.error('Programming Error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: ErrorCodes.SYSTEM_ERROR,
        message: '服务器内部错误'
      }
    });
  }
};

// 处理Mongoose验证错误
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(error => ({
    field: error.path,
    message: error.message
  }));

  return new AppError('数据验证失败', 400, ErrorCodes.VALIDATION_ERROR, errors);
};

// 处理Mongoose重复键错误
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];

  return new AppError(
    `字段 ${field} 的值 '${value}' 已存在`,
    409,
    ErrorCodes.CONFLICT
  );
};

// 处理Mongoose转换错误
const handleCastErrorDB = (err) => {
  return new AppError(
    `无效的 ${err.path}: ${err.value}`,
    400,
    ErrorCodes.VALIDATION_ERROR
  );
};

// 处理JWT错误
const handleJWTError = () => {
  return new AppError('无效的令牌', 401, ErrorCodes.UNAUTHORIZED);
};

// 处理JWT过期错误
const handleJWTExpiredError = () => {
  return new AppError('令牌已过期', 401, ErrorCodes.UNAUTHORIZED);
};

// 处理文件上传错误
const handleMulterError = (err) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new AppError('文件大小超出限制', 400, ErrorCodes.FILE_TOO_LARGE);
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return new AppError('文件数量超出限制', 400, ErrorCodes.FILE_UPLOAD_FAILED);
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError('未预期的文件类型', 400, ErrorCodes.INVALID_FILE_TYPE);
  }
  return new AppError('文件上传失败', 400, ErrorCodes.FILE_UPLOAD_FAILED);
};

// 主错误处理中间件
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // 记录错误日志
  if (err.statusCode >= 500) {
    logger.error('Server Error:', {
      error: err,
      request: {
        method: req.method,
        url: req.originalUrl,
        body: req.body,
        user: req.user
      }
    });
  }

  // 处理特定类型的错误
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  if (err instanceof mongoose.Error.ValidationError) {
    error = handleValidationErrorDB(err);
  }
  if (err.code === 11000) {
    error = handleDuplicateFieldsDB(err);
  }
  if (err instanceof mongoose.Error.CastError) {
    error = handleCastErrorDB(err);
  }
  if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  }
  if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }
  if (err.name === 'MulterError') {
    error = handleMulterError(err);
  }

  // 根据环境发送错误响应
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

// 404错误处理中间件
const notFoundHandler = (req, res, next) => {
  next(new AppError(`找不到路径: ${req.originalUrl}`, 404, ErrorCodes.NOT_FOUND));
};

// 异步错误包装器
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  catchAsync
};
