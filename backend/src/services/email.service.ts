/**
 * 邮件服务
 * 负责发送各类邮件（验证码、通知等）
 */
import nodemailer, { Transporter } from 'nodemailer';
import { emailConfig } from '@/config/email.config';
import { logger } from '@/utils/logger.util';

class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.auth,
    });

    // 验证邮件配置
    this.verifyConnection();
  }

  /**
   * 验证邮件服务器连接
   */
  private async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info('Email service is ready');
    } catch (error) {
      logger.error('Email service connection failed:', error);
    }
  }

  /**
   * 发送邮箱验证码
   */
  async sendVerificationCode(email: string, code: string): Promise<void> {
    try {
      const mailOptions = {
        from: emailConfig.from,
        to: email,
        subject: 'LetAiCode - 邮箱验证码',
        html: this.generateVerificationCodeTemplate(code),
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Verification code sent to ${email}, messageId: ${info.messageId}`);
    } catch (error) {
      logger.error('Failed to send verification code:', error);
      throw new Error('发送验证码失败，请稍后重试');
    }
  }

  /**
   * 生成验证码邮件模板
   */
  private generateVerificationCodeTemplate(code: string): string {
    return `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>邮箱验证码</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .logo {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo h1 {
            color: #24be58;
            margin: 0;
            font-size: 28px;
          }
          .content {
            text-align: center;
          }
          .content h2 {
            color: #262626;
            margin-bottom: 20px;
          }
          .code-box {
            background-color: #f0fff2;
            border: 2px dashed #24be58;
            border-radius: 8px;
            padding: 30px;
            margin: 30px 0;
          }
          .code {
            font-size: 36px;
            font-weight: bold;
            color: #24be58;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
          }
          .tips {
            color: #666;
            font-size: 14px;
            margin-top: 20px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e8e8e8;
            color: #999;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <h1>LetAiCode</h1>
          </div>
          <div class="content">
            <h2>邮箱验证码</h2>
            <p>您正在使用邮箱登录 LetAiCode，验证码为：</p>
            <div class="code-box">
              <div class="code">${code}</div>
            </div>
            <div class="tips">
              <p>验证码有效期为 5 分钟，请尽快完成验证。</p>
              <p>如果这不是您本人的操作，请忽略此邮件。</p>
            </div>
          </div>
          <div class="footer">
            <p>这是一封自动发送的邮件，请勿直接回复。</p>
            <p>© 2024 LetAiCode. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * 发送欢迎邮件（可选）
   */
  async sendWelcomeEmail(email: string, name?: string): Promise<void> {
    try {
      const mailOptions = {
        from: emailConfig.from,
        to: email,
        subject: '欢迎使用 LetAiCode',
        html: this.generateWelcomeTemplate(name || email),
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Welcome email sent to ${email}`);
    } catch (error) {
      logger.error('Failed to send welcome email:', error);
      // 不抛出错误，欢迎邮件失败不影响注册流程
    }
  }

  /**
   * 生成欢迎邮件模板
   */
  private generateWelcomeTemplate(name: string): string {
    return `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <title>欢迎使用 LetAiCode</title>
      </head>
      <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px;">
          <h1 style="color: #24be58;">欢迎来到 LetAiCode！</h1>
          <p>亲爱的 ${name}，</p>
          <p>感谢您注册 LetAiCode。我们很高兴您加入我们的 AI 编程助手平台。</p>
          <p>您现在可以：</p>
          <ul>
            <li>创建 API 密钥</li>
            <li>查看使用记录和积分消耗</li>
            <li>购买套餐充值积分</li>
            <li>阅读开发文档</li>
          </ul>
          <p>如有任何问题，欢迎随时联系我们。</p>
          <p style="margin-top: 40px;">祝您使用愉快！</p>
          <p style="color: #24be58; font-weight: bold;">LetAiCode 团队</p>
        </div>
      </body>
      </html>
    `;
  }
}

export default new EmailService();
