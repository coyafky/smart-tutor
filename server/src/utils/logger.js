const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// 定义日志级别
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// 定义日志颜色
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

// 添加颜色支持
winston.addColors(colors);

// 定义日志格式
const format = winston.format.combine(
  // 添加时间戳
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  // 添加错误堆栈
  winston.format.errors({ stack: true }),
  // 格式化输出
  winston.format.printf(info => {
    const { timestamp, level, message, ...meta } = info;
    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // 添加元数据
    if (Object.keys(meta).length > 0) {
      if (meta.stack) {
        logMessage += `\n${meta.stack}`;
      } else {
        logMessage += `\n${JSON.stringify(meta, null, 2)}`;
      }
    }
    
    return logMessage;
  })
);

// 控制台输出格式（带颜色）
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  format
);

// 创建日志目录
const logDir = path.join(__dirname, '../../logs');

// 创建日志传输器
const transports = [
  // 控制台输出
  new winston.transports.Console({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: consoleFormat
  }),
  
  // 错误日志文件
  new DailyRotateFile({
    level: 'error',
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format
  }),
  
  // 组合日志文件
  new DailyRotateFile({
    filename: path.join(logDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format
  }),
  
  // HTTP请求日志
  new DailyRotateFile({
    level: 'http',
    filename: path.join(logDir, 'http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format
  })
];

// 创建日志记录器
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  levels,
  format,
  transports
});

// 请求日志中间件
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // 请求完成后记录日志
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.id
    });
  });
  
  next();
};

// 错误日志中间件
const errorLogger = (err, req, res, next) => {
  const errorInfo = {
    error: {
      message: err.message,
      stack: err.stack,
      code: err.errorCode,
      status: err.statusCode
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      params: req.params,
      query: req.query,
      ip: req.ip,
      userId: req.user?.id
    }
  };

  // 根据错误级别记录日志
  if (err.statusCode >= 500) {
    logger.error('Server Error:', errorInfo);
  } else if (err.statusCode >= 400) {
    logger.warn('Client Error:', errorInfo);
  } else {
    logger.info('Operation Error:', errorInfo);
  }

  next(err);
};

// 性能监控
const performanceLogger = {
  startTimer: () => {
    const start = process.hrtime();
    return {
      end: (operation) => {
        const diff = process.hrtime(start);
        const duration = (diff[0] * 1e9 + diff[1]) / 1e6; // 转换为毫秒
        logger.debug(`Performance: ${operation} took ${duration.toFixed(2)}ms`);
        return duration;
      }
    };
  }
};

// 数据库操作日志
const dbLogger = {
  query: (query, params) => {
    logger.debug('DB Query:', { query, params });
  },
  error: (error) => {
    logger.error('DB Error:', error);
  }
};

// 安全日志
const securityLogger = {
  authAttempt: (success, userId, ip) => {
    const level = success ? 'info' : 'warn';
    logger[level]('Authentication attempt:', { success, userId, ip });
  },
  accessDenied: (userId, resource, ip) => {
    logger.warn('Access denied:', { userId, resource, ip });
  }
};

module.exports = {
  logger,
  requestLogger,
  errorLogger,
  performanceLogger,
  dbLogger,
  securityLogger
};
