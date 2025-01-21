const { logger, requestLogger, errorLogger, performanceLogger, dbLogger, securityLogger } = require('../../../src/utils/logger');

// 模拟winston
jest.mock('winston', () => ({
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    printf: jest.fn(),
    colorize: jest.fn()
  },
  createLogger: jest.fn(() => ({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    http: jest.fn(),
    debug: jest.fn()
  })),
  transports: {
    Console: jest.fn(),
    File: jest.fn()
  },
  addColors: jest.fn()
}));

describe('Logger', () => {
  let req, res, next;

  beforeEach(() => {
    req = mockRequest({
      method: 'GET',
      originalUrl: '/test',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-agent'),
      user: { id: 1 }
    });
    res = mockResponse();
    next = mockNext;
    jest.clearAllMocks();
  });

  describe('requestLogger', () => {
    it('should log HTTP requests', () => {
      requestLogger(req, res, next);

      // 模拟请求完成
      res.emit('finish');

      expect(next).toHaveBeenCalled();
      expect(logger.http).toHaveBeenCalled();
    });

    it('should include request details in log', () => {
      requestLogger(req, res, next);
      res.emit('finish');

      expect(logger.http).toHaveBeenCalledWith(expect.objectContaining({
        method: 'GET',
        url: '/test',
        ip: '127.0.0.1',
        userAgent: 'test-agent',
        userId: 1
      }));
    });
  });

  describe('errorLogger', () => {
    it('should log server errors (500+)', () => {
      const error = new Error('Server error');
      error.statusCode = 500;

      errorLogger(error, req, res, next);

      expect(logger.error).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });

    it('should log client errors (400-499)', () => {
      const error = new Error('Client error');
      error.statusCode = 400;

      errorLogger(error, req, res, next);

      expect(logger.warn).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('performanceLogger', () => {
    it('should measure operation duration', () => {
      const timer = performanceLogger.startTimer();
      const duration = timer.end('test operation');

      expect(typeof duration).toBe('number');
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('test operation')
      );
    });
  });

  describe('dbLogger', () => {
    it('should log database queries', () => {
      const query = 'SELECT * FROM users';
      const params = ['param1', 'param2'];

      dbLogger.query(query, params);

      expect(logger.debug).toHaveBeenCalledWith(
        'DB Query:',
        expect.objectContaining({
          query,
          params
        })
      );
    });

    it('should log database errors', () => {
      const error = new Error('DB Error');

      dbLogger.error(error);

      expect(logger.error).toHaveBeenCalledWith(
        'DB Error:',
        error
      );
    });
  });

  describe('securityLogger', () => {
    it('should log successful authentication attempts', () => {
      securityLogger.authAttempt(true, 1, '127.0.0.1');

      expect(logger.info).toHaveBeenCalledWith(
        'Authentication attempt:',
        expect.objectContaining({
          success: true,
          userId: 1,
          ip: '127.0.0.1'
        })
      );
    });

    it('should log failed authentication attempts', () => {
      securityLogger.authAttempt(false, null, '127.0.0.1');

      expect(logger.warn).toHaveBeenCalledWith(
        'Authentication attempt:',
        expect.objectContaining({
          success: false,
          userId: null,
          ip: '127.0.0.1'
        })
      );
    });

    it('should log access denied events', () => {
      securityLogger.accessDenied(1, '/admin', '127.0.0.1');

      expect(logger.warn).toHaveBeenCalledWith(
        'Access denied:',
        expect.objectContaining({
          userId: 1,
          resource: '/admin',
          ip: '127.0.0.1'
        })
      );
    });
  });
});
