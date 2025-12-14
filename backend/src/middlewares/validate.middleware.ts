/**
 * 参数验证中间件
 */
import { Request, Response, NextFunction } from 'express';

/**
 * 邮箱格式验证
 */
export const validateEmail = (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: '邮箱不能为空',
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: '邮箱格式不正确',
    });
  }

  next();
};

/**
 * 验证码格式验证
 */
export const validateCode = (req: Request, res: Response, next: NextFunction) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({
      success: false,
      message: '验证码不能为空',
    });
  }

  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({
      success: false,
      message: '验证码格式不正确（6位数字）',
    });
  }

  next();
};
