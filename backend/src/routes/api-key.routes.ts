/**
 * API Key 路由
 */
import { Router } from 'express';
import apiKeyController from '@/controllers/api-key.controller';

const router = Router();

// 健康检查（无需认证）
router.get('/health', apiKeyController.health.bind(apiKeyController));

// 获取用户积分余额（供 new-api 调用，需要 admin token）
router.get('/:keyId/credit-balance', apiKeyController.getCreditBalance.bind(apiKeyController));

// 获取 API Key 详情（需要认证）
router.get('/:keyId/detail', apiKeyController.getDetail.bind(apiKeyController));

export default router;