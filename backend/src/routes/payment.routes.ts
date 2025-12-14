/**
 * 支付路由
 * 处理易支付回调
 */
import { Router } from 'express';
import { paymentController } from '@/controllers/payment.controller';

const router = Router();

/**
 * 易支付异步回调通知（不需要认证）
 * GET /api/payment/epay/callback
 */
router.get('/epay/callback', paymentController.handleEpayCallback);

/**
 * 易支付同步返回（页面跳转，不需要认证）
 * GET /api/payment/epay/return
 */
router.get('/epay/return', paymentController.handleEpayReturn);

export default router;
