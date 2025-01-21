const { validate, customValidators } = require('../../../src/middleware/validator');
const { validationResult } = require('express-validator');

jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

describe('Validator Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = mockNext;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should call next() when validation passes', () => {
      validationResult.mockReturnValue({ isEmpty: () => true });

      validate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should return 400 status with errors when validation fails', () => {
      const mockErrors = {
        isEmpty: () => false,
        array: () => [{
          param: 'email',
          msg: 'Invalid email',
          value: 'invalid-email'
        }]
      };
      validationResult.mockReturnValue(mockErrors);

      validate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '输入验证失败',
        errors: [{
          field: 'email',
          message: 'Invalid email',
          value: 'invalid-email'
        }]
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('customValidators', () => {
    describe('isValidDateRange', () => {
      it('should return true for valid date range', () => {
        const startDate = '2025-01-01';
        const endDate = '2025-12-31';
        expect(customValidators.isValidDateRange(startDate, endDate)).toBe(true);
      });

      it('should return false for invalid date range', () => {
        const startDate = '2025-12-31';
        const endDate = '2025-01-01';
        expect(customValidators.isValidDateRange(startDate, endDate)).toBe(false);
      });

      it('should return true when dates are equal', () => {
        const date = '2025-01-01';
        expect(customValidators.isValidDateRange(date, date)).toBe(true);
      });
    });

    describe('isValidPriceRange', () => {
      it('should return true for valid price range', () => {
        expect(customValidators.isValidPriceRange('100', '200')).toBe(true);
      });

      it('should return false for invalid price range', () => {
        expect(customValidators.isValidPriceRange('200', '100')).toBe(false);
      });

      it('should return true when prices are equal', () => {
        expect(customValidators.isValidPriceRange('100', '100')).toBe(true);
      });
    });

    describe('isTimeFormat', () => {
      it('should return true for valid time format', () => {
        expect(customValidators.isTimeFormat('13:30')).toBe(true);
        expect(customValidators.isTimeFormat('00:00')).toBe(true);
        expect(customValidators.isTimeFormat('23:59')).toBe(true);
      });

      it('should return false for invalid time format', () => {
        expect(customValidators.isTimeFormat('24:00')).toBe(false);
        expect(customValidators.isTimeFormat('13:60')).toBe(false);
        expect(customValidators.isTimeFormat('1:30')).toBe(false);
        expect(customValidators.isTimeFormat('13:3')).toBe(false);
      });
    });

    describe('isPhoneNumber', () => {
      it('should return true for valid phone numbers', () => {
        expect(customValidators.isPhoneNumber('13800138000')).toBe(true);
        expect(customValidators.isPhoneNumber('15900000000')).toBe(true);
      });

      it('should return false for invalid phone numbers', () => {
        expect(customValidators.isPhoneNumber('1380013800')).toBe(false);
        expect(customValidators.isPhoneNumber('12800138000')).toBe(false);
        expect(customValidators.isPhoneNumber('138001380001')).toBe(false);
      });
    });

    describe('isStrongPassword', () => {
      it('should return true for strong passwords', () => {
        expect(customValidators.isStrongPassword('Password123')).toBe(true);
        expect(customValidators.isStrongPassword('StrongPass1')).toBe(true);
      });

      it('should return false for weak passwords', () => {
        expect(customValidators.isStrongPassword('password')).toBe(false);
        expect(customValidators.isStrongPassword('12345678')).toBe(false);
        expect(customValidators.isStrongPassword('Password')).toBe(false);
      });
    });
  });
});
