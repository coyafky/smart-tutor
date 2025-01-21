const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  service: 'qq',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER || '2233606771@qq.com',
    pass: process.env.EMAIL_PASS || 'btkufucvyybedibd', // 建议使用环境变量
  },
});

const sendVerificationEmail = async (email, code) => {
  const mailOptions = {
    from: `"智慧家教平台"<${process.env.EMAIL_USER || '2233606771@qq.com'}>`,
    to: email,
    subject: '智慧家教 - 邮箱验证码',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">邮箱验证码</h2>
        <p style="color: #666; font-size: 16px;">您好！感谢您注册智慧家教平台。</p>
        <p style="color: #666; font-size: 16px;">您的验证码是：</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <span style="font-size: 24px; font-weight: bold; color: #333;">${code}</span>
        </div>
        <p style="color: #666; font-size: 14px;">验证码有效期为5分钟，请尽快完成验证。</p>
        <p style="color: #666; font-size: 14px;">如果不是您本人操作，请忽略此邮件。</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">此邮件由系统自动发送，请勿回复。</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Verification email sent to: ${email}`);
    return true;
  } catch (error) {
    logger.error('Send verification email failed:', error);
    return false;
  }
};

const sendPasswordResetEmail = async (email, resetToken) => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: `"智慧家教平台"<${process.env.EMAIL_USER || '2233606771@qq.com'}>`,
    to: email,
    subject: '智慧家教 - 密码重置',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">密码重置请求</h2>
        <p style="color: #666; font-size: 16px;">您好！我们收到了您的密码重置请求。</p>
        <p style="color: #666; font-size: 16px;">请点击下面的按钮重置您的密码：</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #4CAF50; 
                    color: white; 
                    padding: 12px 30px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    font-size: 16px;">
            重置密码
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">此链接将在30分钟后失效。</p>
        <p style="color: #666; font-size: 14px;">如果您没有请求重置密码，请忽略此邮件。</p>
        <p style="color: #666; font-size: 14px;">如果按钮无法点击，请复制以下链接到浏览器：</p>
        <p style="color: #666; font-size: 14px; word-break: break-all;">${resetLink}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">此邮件由系统自动发送，请勿回复。</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Password reset email sent to: ${email}`);
    return true;
  } catch (error) {
    logger.error('Send password reset email failed:', error);
    return false;
  }
};

const sendAccountDeletionEmail = async (email, deletionToken) => {
  const deletionLink = `${process.env.FRONTEND_URL}/confirm-deletion?token=${deletionToken}`;
  
  const mailOptions = {
    from: `"智慧家教平台"<${process.env.EMAIL_USER || '2233606771@qq.com'}>`,
    to: email,
    subject: '智慧家教 - 账号注销确认',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">账号注销确认</h2>
        <p style="color: #666; font-size: 16px;">您好！我们收到了您的账号注销请求。</p>
        <p style="color: #666; font-size: 16px;">请注意，账号注销后：</p>
        <ul style="color: #666; font-size: 14px;">
          <li>您的所有个人信息将被删除</li>
          <li>您将无法使用此邮箱重新注册</li>
          <li>所有相关的课程和评价记录将被删除</li>
          <li>此操作无法撤销</li>
        </ul>
        <p style="color: #666; font-size: 16px;">如果您确定要注销账号，请点击下面的按钮：</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${deletionLink}" 
             style="background-color: #dc3545; 
                    color: white; 
                    padding: 12px 30px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    font-size: 16px;">
            确认注销账号
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">此链接将在24小时后失效。</p>
        <p style="color: #666; font-size: 14px;">如果您没有请求注销账号，请立即修改密码并联系客服。</p>
        <p style="color: #666; font-size: 14px;">如果按钮无法点击，请复制以下链接到浏览器：</p>
        <p style="color: #666; font-size: 14px; word-break: break-all;">${deletionLink}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">此邮件由系统自动发送，请勿回复。</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Account deletion email sent to: ${email}`);
    return true;
  } catch (error) {
    logger.error('Send account deletion email failed:', error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendAccountDeletionEmail
};
