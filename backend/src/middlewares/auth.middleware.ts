/**
 * 认证中间件
 * 验证 JWT Token，保护需要登录的路由
 */
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@/utils/jwt.util';
import prisma from '@/utils/prisma';
import { logger } from '@/utils/logger.util';

/**
 * JWT 认证中间件
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 从 Header 中获取 Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌',
      });
    }

    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀

    // 验证 Token
    const payload = verifyToken(token);

    // 查询用户
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在',
      });
    }

    // 将用户信息附加到 Request 对象
    req.userId = user.id;
    req.user = user;

    next();
  } catch (error: any) {
    logger.error('Auth middleware error:', error);

    if (error.message === 'Invalid or expired token') {
      return res.status(401).json({
        success: false,
        message: 'Token 无效或已过期',
      });
    }

    return res.status(401).json({
      success: false,
      message: '认证失败',
    });
  }
};

/**
 * 可选认证中间件（不强制要求登录）
 */
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (user) {
        req.userId = user.id;
        req.user = user;
      }
    }
  } catch (error) {
    // 可选认证失败不阻止请求
    logger.debug('Optional auth failed, continuing without user');
  }

  next();
};
