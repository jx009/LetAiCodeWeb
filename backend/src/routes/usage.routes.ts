/**
 * 使用记录路由
 */
import { Router } from 'express';
import usageController from '../controllers/usage.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * GET /api/usage
 * 获取使用记录列表
 * Query: keyId, startDate, endDate, model, page, pageSize
 */
router.get('/', usageController.getUsageRecords);

/**
 * GET /api/usage/statistics
 * 获取使用统计（按模型分组）
 * Query: startDate, endDate
 */
router.get('/statistics', usageController.getUsageStatistics);

/**
 * POST /api/usage/sync
 * 手动触发同步（同步当前用户的所有 Keys）
 */
router.post('/sync', usageController.manualSync);

export default router;
