/**
 * 支付回调控制器
 * 处理易支付回调通知
 */
import { Request, Response } from 'express';
import { orderService } from '@/services/order.service';
import { logger } from '@/utils/logger.util';

class PaymentController {
  /**
   * 易支付异步回调通知
   * GET /api/payment/epay/callback?xxx=xxx
   */
  async handleEpayCallback(req: Request, res: Response) {
    try {
      // 易支付回调参数通过 query 传递
      const params = req.query as Record<string, string>;

      logger.info('Received epay callback:', params);

      // 处理回调
      const success = await orderService.handleEpayCallback(params);

      if (success) {
        // 返回 success 给易支付
        res.send('success');
      } else {
        // 返回 fail 让易支付重试
        res.send('fail');
      }
    } catch (error: any) {
      logger.error('Error in handleEpayCallback:', error);
      // 返回 fail 让易支付重试
      res.send('fail');
    }
  }

  /**
   * 易支付同步返回（页面跳转）
   * GET /api/payment/epay/return?xxx=xxx
   */
  async handleEpayReturn(req: Request, res: Response) {
    try {
      const params = req.query as Record<string, string>;
      const orderNo = params.out_trade_no;

      logger.info('Received epay return:', params);

      // 可以在这里验证签名，但主要以异步回调为准
      // 直接跳转到前端订单页面
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/orders?orderNo=${orderNo}`);
    } catch (error: any) {
      logger.error('Error in handleEpayReturn:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/orders?error=payment_failed`);
    }
  }
}

export const paymentController = new PaymentController();
