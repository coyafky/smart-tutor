const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Course = require('../models/Course');
const Contract = require('../models/Contract');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// 创建订单
const createOrder = async (req, res) => {
  try {
    const { userId } = req.user;
    const { contractId, amount, description } = req.body;

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // 查找合同
    const contract = await Contract.findOne({
      _id: contractId,
      parentId: userId,
      status: 'confirmed'
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: '未找到可支付的合同'
      });
    }

    // 创建订单
    const order = new Order({
      contractId,
      parentId: userId,
      teacherId: contract.teacherId,
      amount,
      description,
      status: 'pending'
    });

    await order.save();
    logger.info(`Order created: ${order._id}`);

    res.json({
      success: true,
      message: '订单创建成功',
      data: order
    });
  } catch (error) {
    logger.error('Create order failed:', error);
    res.status(500).json({
      success: false,
      message: '创建订单失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 处理支付
const processPayment = async (req, res) => {
  try {
    const { userId } = req.user;
    const { orderId, paymentMethod, paymentDetails } = req.body;

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // 查找订单
    const order = await Order.findOne({
      _id: orderId,
      parentId: userId,
      status: 'pending'
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '未找到待支付的订单'
      });
    }

    // 创建支付记录
    const payment = new Payment({
      orderId,
      parentId: userId,
      teacherId: order.teacherId,
      amount: order.amount,
      paymentMethod,
      paymentDetails,
      status: 'processing'
    });

    await payment.save();

    // TODO: 调用实际的支付网关API
    // 这里模拟支付成功
    payment.status = 'completed';
    payment.completedAt = new Date();
    await payment.save();

    // 更新订单状态
    order.status = 'paid';
    order.paymentId = payment._id;
    await order.save();

    // 更新课程状态
    await Course.findOneAndUpdate(
      { contractId: order.contractId },
      { 
        $set: { status: 'active' },
        $push: { payments: payment._id }
      }
    );

    logger.info(`Payment processed: ${payment._id}`);

    res.json({
      success: true,
      message: '支付成功',
      data: {
        order,
        payment
      }
    });
  } catch (error) {
    logger.error('Process payment failed:', error);
    res.status(500).json({
      success: false,
      message: '支付处理失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 申请退款
const requestRefund = async (req, res) => {
  try {
    const { userId } = req.user;
    const { paymentId, reason } = req.body;

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // 查找支付记录
    const payment = await Payment.findOne({
      _id: paymentId,
      parentId: userId,
      status: 'completed'
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: '未找到可退款的支付记录'
      });
    }

    // 创建退款记录
    const refund = new Payment({
      orderId: payment.orderId,
      parentId: userId,
      teacherId: payment.teacherId,
      amount: -payment.amount, // 负数表示退款
      paymentMethod: 'refund',
      refundReason: reason,
      status: 'processing',
      relatedPaymentId: payment._id
    });

    await refund.save();

    // TODO: 调用实际的退款API
    // 这里模拟退款成功
    refund.status = 'completed';
    refund.completedAt = new Date();
    await refund.save();

    // 更新原支付记录状态
    payment.status = 'refunded';
    payment.refundId = refund._id;
    await payment.save();

    // 更新订单状态
    await Order.findByIdAndUpdate(payment.orderId, {
      status: 'refunded'
    });

    logger.info(`Refund processed: ${refund._id}`);

    res.json({
      success: true,
      message: '退款申请已处理',
      data: {
        payment,
        refund
      }
    });
  } catch (error) {
    logger.error('Request refund failed:', error);
    res.status(500).json({
      success: false,
      message: '退款申请失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取支付记录（家长）
const getParentPayments = async (req, res) => {
  try {
    const { userId } = req.user;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { parentId: userId };
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('orderId')
      .populate('teacherId', 'username avatar');

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get parent payments failed:', error);
    res.status(500).json({
      success: false,
      message: '获取支付记录失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取收入记录（教师）
const getTeacherIncomes = async (req, res) => {
  try {
    const { userId } = req.user;
    const { 
      status,
      startDate,
      endDate,
      page = 1,
      limit = 10
    } = req.query;

    const query = { 
      teacherId: userId,
      status: 'completed',
      amount: { $gt: 0 } // 只查询收入，不包括退款
    };
    
    if (status) query.status = status;
    if (startDate || endDate) {
      query.completedAt = {};
      if (startDate) query.completedAt.$gte = new Date(startDate);
      if (endDate) query.completedAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const incomes = await Payment.find(query)
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('orderId')
      .populate('parentId', 'username avatar');

    // 计算总收入
    const totalIncome = await Payment.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: {
        incomes,
        totalIncome: totalIncome[0]?.total || 0,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get teacher incomes failed:', error);
    res.status(500).json({
      success: false,
      message: '获取收入记录失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createOrder,
  processPayment,
  requestRefund,
  getParentPayments,
  getTeacherIncomes
};
