/**
 * 订阅路由
 */
import { Router } from 'express';
import {
  getSubscription,
  getBalance,
  cancelSubscription,
  setAutoRenew,
  getSubscriptionHistory,
  getTransactions,
  getSubscriptionStats,
  adjustUserCredits,
  getAdminUsageRecords,
  getAdminUsageStats,
  getUsedModels,
} from '@/controllers/subscription.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { adminAuth, rootAuth } from '@/middlewares/role.middleware';

const router = Router();

// 所有路由都需要登录
router.use(authMiddleware);

/**
 * 用户路由
 */

// 获取当前订阅
router.get('/', getSubscription);

// 获取积分余额
router.get('/balance', getBalance);

// 取消订阅
router.post('/cancel', cancelSubscription);

// 设置自动续费
router.post('/auto-renew', setAutoRenew);

// 获取订阅历史
router.get('/history', getSubscriptionHistory);

// 获取积分交易记录
router.get('/transactions', getTransactions);

/**
 * 管理员路由
 */

// 获取订阅统计
router.get('/admin/stats', rootAuth, getSubscriptionStats);

// 调整用户积分
router.post('/admin/users/:userId/credits/adjust', rootAuth, adjustUserCredits);

// 获取所有用户使用记录
router.get('/admin/usage/records', adminAuth, getAdminUsageRecords);

// 获取使用统计
router.get('/admin/usage/stats', adminAuth, getAdminUsageStats);

// 获取模型列表（用于筛选）
router.get('/admin/usage/models', adminAuth, getUsedModels);

export default router;
