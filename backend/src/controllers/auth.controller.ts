/**
 * 认证控制器
 * 处理认证相关的 HTTP 请求
 */
import { Request, Response } from 'express';
import authService from '@/services/auth.service';
import { logger } from '@/utils/logger.util';

class AuthController {
  /**
   * 发送邮箱验证码
   * POST /api/auth/send-code
   */
  async sendCode(req: Request, res: Response) {
    try {
      const { email } = req.body;

      await authService.sendVerificationCode(email);

      res.json({
        success: true,
        message: '验证码已发送',
        data: {
          expiresIn: 300, // 5分钟
        },
      });
    } catch (error: any) {
      logger.error('Send code failed:', error);
      res.status(400).json({
        success: false,
        message: error.message || '发送验证码失败',
      });
    }
  }

  /**
   * 邮箱登录
   * POST /api/auth/login
   */
  async login(req: Request, res: Response) {
    try {
      const { email, code } = req.body;

      const { user, token } = await authService.login(email, code);

      // 获取用户余额
      const balance = await authService.getUserBalance(user.id);

      res.json({
        success: true,
        message: '登录成功',
        data: {
          user: {
            ...user,
            balance,
          },
          token,
        },
      });
    } catch (error: any) {
      logger.error('Login failed:', error);
      res.status(400).json({
        success: false,
        message: error.message || '登录失败',
      });
    }
  }

  /**
   * 登出
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        await authService.logout(token);
      }

      res.json({
        success: true,
        message: '登出成功',
      });
    } catch (error: any) {
      logger.error('Logout failed:', error);
      res.status(400).json({
        success: false,
        message: error.message || '登出失败',
      });
    }
  }

  /**
   * 刷新 Token
   * POST /api/auth/refresh
   */
  async refresh(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: '未提供认证令牌',
        });
      }

      const token = authHeader.substring(7);
      const user = await authService.validateSession(token);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Session 无效或已过期',
        });
      }

      // 生成新 Token（可选，取决于需求）
      // 这里简单返回用户信息即可

      res.json({
        success: true,
        data: {
          user,
          token, // 返回原 Token
        },
      });
    } catch (error: any) {
      logger.error('Refresh token failed:', error);
      res.status(401).json({
        success: false,
        message: error.message || '刷新失败',
      });
    }
  }

  /**
   * 获取当前用户信息
   * GET /api/auth/me
   */
  async getCurrentUser(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未登录',
        });
      }

      const balance = await authService.getUserBalance(req.user.id);

      res.json({
        success: true,
        data: {
          user: {
            ...req.user,
            balance,
          },
        },
      });
    } catch (error: any) {
      logger.error('Get current user failed:', error);
      res.status(400).json({
        success: false,
        message: error.message || '获取用户信息失败',
      });
    }
  }
}

export default new AuthController();
