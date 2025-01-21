const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

// 验证结果处理中间件
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation failed:', {
      path: req.path,
      method: req.method,
      errors: errors.array()
    });

    return res.status(400).json({
      success: false,
      message: '输入验证失败',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// 自定义验证器
const customValidators = {
  // 检查日期范围
  isValidDateRange: (startDate, endDate) => {
    if (!startDate || !endDate) return true;
    return new Date(startDate) <= new Date(endDate);
  },

  // 检查价格范围
  isValidPriceRange: (minPrice, maxPrice) => {
    if (!minPrice || !maxPrice) return true;
    return parseInt(minPrice) <= parseInt(maxPrice);
  },

  // 检查数组长度
  isArrayLength: (array, min, max) => {
    if (!Array.isArray(array)) return false;
    if (min !== undefined && array.length < min) return false;
    if (max !== undefined && array.length > max) return false;
    return true;
  },

  // 检查时间格式 (HH:mm)
  isTimeFormat: (time) => {
    if (!time) return false;
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
  },

  // 检查手机号格式
  isPhoneNumber: (phone) => {
    if (!phone) return false;
    return /^1[3-9]\d{9}$/.test(phone);
  },

  // 检查密码强度
  isStrongPassword: (password) => {
    if (!password) return false;
    // 至少包含一个大写字母、一个小写字母、一个数字，长度至少8位
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/.test(password);
  },

  // 检查URL格式
  isValidUrl: (url) => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch (err) {
      return false;
    }
  },

  // 检查文件大小
  isValidFileSize: (size, maxSize) => {
    if (!size) return false;
    return size <= maxSize;
  },

  // 检查文件类型
  isValidFileType: (mimetype, allowedTypes) => {
    if (!mimetype || !allowedTypes) return false;
    return allowedTypes.includes(mimetype);
  },

  // 检查字符串长度（考虑中文字符）
  isValidStringLength: (str, min, max) => {
    if (!str) return min === 0;
    const length = [...str].length; // 使用扩展运算符处理Unicode字符
    if (min !== undefined && length < min) return false;
    if (max !== undefined && length > max) return false;
    return true;
  }
};

// 验证错误处理
const handleValidationErrors = (errors) => {
  return errors.array().map(err => {
    let message = err.msg;
    
    // 根据错误类型提供更友好的错误信息
    switch (err.type) {
      case 'field':
        message = `字段 ${err.param} ${err.msg}`;
        break;
      case 'alternative':
        message = `需要提供以下字段之一: ${err.nestedErrors.map(e => e.param).join(', ')}`;
        break;
      case 'unknown_fields':
        message = `不允许的字段: ${err.fields.join(', ')}`;
        break;
      default:
        break;
    }

    return {
      field: err.param,
      message,
      value: err.value
    };
  });
};

// 验证错误格式化
const formatValidationErrors = (errors) => {
  const formattedErrors = {};
  
  errors.array().forEach(err => {
    if (!formattedErrors[err.param]) {
      formattedErrors[err.param] = [];
    }
    formattedErrors[err.param].push(err.msg);
  });

  return formattedErrors;
};

// 验证中间件工厂
const createValidator = (validations) => {
  return async (req, res, next) => {
    try {
      // 执行所有验证
      await Promise.all(validations.map(validation => validation.run(req)));

      // 检查验证结果
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '输入验证失败',
          errors: handleValidationErrors(errors)
        });
      }

      next();
    } catch (error) {
      logger.error('Validation middleware error:', error);
      next(error);
    }
  };
};

module.exports = {
  validate,
  customValidators,
  handleValidationErrors,
  formatValidationErrors,
  createValidator
};
