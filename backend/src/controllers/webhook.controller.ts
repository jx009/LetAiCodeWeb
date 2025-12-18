/**
 * Webhook 控制器
 * 处理来自 new-api 的 webhook 请求
 */
import { Request, Response } from 'express';
import webhookService from '../services/webhook.service';

class WebhookController {
  /**
   * 处理 webhook 事件
   * POST /api/webhooks/usage
   * Headers:
   *   - x-webhook-signature: HMAC-SHA256 签名
   * Body:
   *   - eventId: 事件 ID（用于幂等性）
   *   - eventType: 事件类型（usage）
   *   - timestamp: 时间戳
   *   - data: 事件数据
   */
  async handleWebhook(req: Request, res: Response) {
    try {
      // 1. 验证 webhook 签名
      const signature = req.headers['x-webhook-signature'] as string;
      const secret = process.env.WEBHOOK_SECRET || 'default-secret';

      if (!signature) {
        return res.status(400).json({
          success: false,
          message: 'Missing webhook signature',
        });
      }

      // 将 body 转换为字符串用于签名验证
      const rawBody = JSON.stringify(req.body);

      if (!webhookService.verifyWebhookSignature(rawBody, signature, secret)) {
        return res.status(403).json({
          success: false,
          message: 'Invalid webhook signature',
        });
      }

      // 2. 验证必要字段
      const { eventId, eventType, data } = req.body;

      if (!eventId || !eventType || !data) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: eventId, eventType, data',
        });
      }

      // 3. 处理 webhook 事件
      const result = await webhookService.handleWebhookEvent(req.body);

      res.status(200).json({
        success: result.success,
        message: result.message,
        eventId,
      });
    } catch (error: any) {
      console.error('[WebhookController] handleWebhook error:', error);

      // 返回 200 OK，但在响应中指示处理失败
      // 这样 new-api 知道应该重试
      res.status(200).json({
        success: false,
        message: error.message || 'Failed to process webhook',
        error: error.message,
      });
    }
  }

  /**
   * 健康检查端点
   * GET /api/webhooks/health
   */
  async healthCheck(req: Request, res: Response) {
    res.status(200).json({
      success: true,
      message: 'Webhook service is healthy',
      timestamp: new Date().toISOString(),
    });
  }
}

export default new WebhookController();