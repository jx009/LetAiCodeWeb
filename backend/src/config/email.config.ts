/**
 * 邮件配置
 */
export const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: parseInt(process.env.EMAIL_PORT || '465'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'noreply@letaicode.com',
    pass: process.env.EMAIL_PASSWORD || '',
  },
  from: process.env.EMAIL_FROM || 'LetAiCode <noreply@letaicode.com>',
};
