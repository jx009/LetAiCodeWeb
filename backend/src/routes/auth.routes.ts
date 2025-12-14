/**
 * 认证路由
 */
import { Router } from 'express';
import authController from '@/controllers/auth.controller';
import { validateEmail, validateCode } from '@/middlewares/validate.middleware';
import { authMiddleware } from '@/middlewares/auth.middleware';

const router = Router();

/**
 * POST /api/auth/send-code
 * 发送邮箱验证码
 */
router.post('/send-code', validateEmail, authController.sendCode);

/**
 * POST /api/auth/login
 * 邮箱登录
 */
router.post('/login', validateEmail, validateCode, authController.login);

/**
 * POST /api/auth/logout
 * 登出
 */
router.post('/logout', authController.logout);

/**
 * POST /api/auth/refresh
 * 刷新 Token
 */
router.post('/refresh', authController.refresh);

/**
 * GET /api/auth/me
 * 获取当前用户信息（需要登录）
 */
router.get('/me', authMiddleware, authController.getCurrentUser);

export default router;
