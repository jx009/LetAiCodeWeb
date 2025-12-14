/**
 * 角色权限验证中间件
 * 参考 new-api 的权限设计
 */
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

/**
 * 管理员权限验证中间件
 * 要求用户角色 >= ADMIN
 */
export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: '未授权：请先登录',
      });
    }

    // 检查是否为管理员或超级管理员
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.ROOT) {
      return res.status(403).json({
        success: false,
        message: '权限不足：需要管理员权限',
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '权限验证失败',
    });
  }
};

/**
 * 超级管理员权限验证中间件
 * 要求用户角色 = ROOT
 */
export const rootAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: '未授权：请先登录',
      });
    }

    // 只允许超级管理员
    if (userRole !== UserRole.ROOT) {
      return res.status(403).json({
        success: false,
        message: '权限不足：需要超级管理员权限',
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '权限验证失败',
    });
  }
};

/**
 * 用户状态检查中间件
 * 检查用户是否被禁用
 */
export const statusCheck = (req: Request, res: Response, next: NextFunction) => {
  try {
    const userStatus = req.user?.status;

    if (userStatus === undefined) {
      return res.status(401).json({
        success: false,
        message: '未授权：请先登录',
      });
    }

    // 检查用户是否被禁用
    if (userStatus === 0) {
      return res.status(403).json({
        success: false,
        message: '账户已被禁用，请联系管理员',
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '状态检查失败',
    });
  }
};
