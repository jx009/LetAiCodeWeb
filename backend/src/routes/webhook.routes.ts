/**
 * Webhook 路由
 * 处理来自 new-api 的 webhook 请求
 */
import { Router } from 'express';
import webhookController from '../controllers/webhook.controller';

const router = Router();

// Webhook 事件处理（不需要认证，因为使用签名验证）
router.post('/events', webhookController.handleWebhook.bind(webhookController));

// 健康检查端点
router.get('/health', webhookController.healthCheck.bind(webhookController));

export default router;