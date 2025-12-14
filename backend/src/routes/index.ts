/**
 * 路由统一注册
 */
import { Router } from 'express';
import authRoutes from './auth.routes';
import packageRoutes from './package.routes';
import orderRoutes from './order.routes';
import paymentRoutes from './payment.routes';
import keysRoutes from './keys.routes';
import usageRoutes from './usage.routes';
import transactionRoutes from './transaction.routes';
import optionRoutes from './option.routes';
import adminRoutes from './admin.routes';

const router = Router();

// 认证路由
router.use('/auth', authRoutes);

// 套餐路由
router.use('/packages', packageRoutes);

// 订单路由
router.use('/orders', orderRoutes);

// 支付路由（易支付回调）
router.use('/payment', paymentRoutes);

// API Keys 路由
router.use('/keys', keysRoutes);

// 使用记录路由
router.use('/usage', usageRoutes);

// 积分交易记录路由
router.use('/transactions', transactionRoutes);

// 系统配置路由（超级管理员）
router.use('/options', optionRoutes);

// 管理员路由（用户管理）
router.use('/admin', adminRoutes);

export default router;
