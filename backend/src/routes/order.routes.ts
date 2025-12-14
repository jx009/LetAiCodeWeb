/**
 * 订单路由
 */
import { Router } from 'express';
import { orderController } from '@/controllers/order.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';

const router = Router();

/**
 * 所有订单路由都需要登录
 */

// 获取支付配置信息
router.get('/payment-info', orderController.getPaymentInfo);

// 创建订单
router.post('/', authMiddleware, orderController.createOrder);

// 发起支付请求
router.post('/request-payment', authMiddleware, orderController.requestPayment);

// 获取用户订单列表
router.get('/', authMiddleware, orderController.getUserOrders);

// 根据订单号查询订单
router.get('/no/:orderNo', authMiddleware, orderController.getOrderByOrderNo);

// 获取订单详情
router.get('/:id', authMiddleware, orderController.getOrderById);

// 取消订单
router.post('/:id/cancel', authMiddleware, orderController.cancelOrder);

export default router;
