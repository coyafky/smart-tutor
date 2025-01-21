const { errorHandler, notFoundHandler, catchAsync } = require('../../../src/middleware/errorHandler');
const { AppError, ErrorCodes } = require('../../../src/utils/errors');
const mongoose = require('mongoose');

describe('Error Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = mockNext;
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('errorHandler', () => {
    it('should handle operational errors in development', () => {
      const error = new AppError('Test error', 400, ErrorCodes.VALIDATION_ERROR);

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          statusCode: 400,
          status: 'fail',
          message: 'Test error',
          code: ErrorCodes.VALIDATION_ERROR,
          stack: error.stack,
          errors: undefined
        }
      });
    });

    it('should handle operational errors in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new AppError('Test error', 400, ErrorCodes.VALIDATION_ERROR);

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Test error',
          errors: undefined
        }
      });
    });

    it('should handle mongoose validation errors', () => {
      const error = new mongoose.Error.ValidationError();
      error.errors = {
        field: {
          path: 'field',
          message: 'Invalid field'
        }
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].error.code).toBe(ErrorCodes.VALIDATION_ERROR);
    });

    it('should handle mongoose duplicate key errors', () => {
      const error = { code: 11000, keyValue: { email: 'test@example.com' } };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json.mock.calls[0][0].error.code).toBe(ErrorCodes.CONFLICT);
    });
  });

  describe('notFoundHandler', () => {
    it('should create not found error', () => {
      req.originalUrl = '/not-found';
      
      notFoundHandler(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(404);
      expect(error.errorCode).toBe(ErrorCodes.NOT_FOUND);
    });
  });

  describe('catchAsync', () => {
    it('should handle async errors', async () => {
      const asyncFn = async () => {
        throw new Error('Async error');
      };
      const wrappedFn = catchAsync(asyncFn);

      await wrappedFn(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe('Async error');
    });

    it('should pass through successful async results', async () => {
      const asyncFn = async (req, res) => {
        res.json({ success: true });
      };
      const wrappedFn = catchAsync(asyncFn);

      await wrappedFn(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ success: true });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
