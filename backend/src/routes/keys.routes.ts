/**
 * API Keys 路由
 */
import { Router } from 'express';
import keysController from '../controllers/keys.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * GET /api/keys
 * 获取用户的所有 API Keys
 */
router.get('/', keysController.getKeys);

/**
 * POST /api/keys
 * 创建新的 API Key
 * Body: { label: string }
 */
router.post('/', keysController.createKey);

/**
 * GET /api/keys/:id
 * 获取单个 API Key 详情
 */
router.get('/:id', keysController.getKeyById);

/**
 * PATCH /api/keys/:id/status
 * 更新 API Key 状态（启用/禁用）
 * Body: { status: 'ACTIVE' | 'DISABLED' }
 */
router.patch('/:id/status', keysController.updateKeyStatus);

/**
 * DELETE /api/keys/:id
 * 删除 API Key（软删除）
 */
router.delete('/:id', keysController.deleteKey);

/**
 * POST /api/keys/:id/decrypt
 * 解密 API Key（获取完整的 Key）
 * 注意：此接口应谨慎使用，可能需要额外的安全验证（如二次密码验证）
 */
router.post('/:id/decrypt', keysController.decryptKey);

export default router;
