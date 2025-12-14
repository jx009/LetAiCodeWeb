/**
 * API Keys 控制器
 */
import { Request, Response } from 'express';
import keysService from '../services/keys.service';
import { KeyStatus } from '@prisma/client';

class KeysController {
  /**
   * 获取用户的所有 API Keys
   * GET /api/keys
   */
  async getKeys(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      const keys = await keysService.getUserKeys(userId);

      res.json({
        success: true,
        data: keys,
      });
    } catch (error: any) {
      console.error('[KeysController] getKeys error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get API keys',
      });
    }
  }

  /**
   * 获取单个 API Key 详情
   * GET /api/keys/:id
   */
  async getKeyById(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const key = await keysService.getKeyById(id, userId);

      res.json({
        success: true,
        data: key,
      });
    } catch (error: any) {
      console.error('[KeysController] getKeyById error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to get API key',
      });
    }
  }

  /**
   * 创建新的 API Key
   * POST /api/keys
   * Body: { label: string }
   */
  async createKey(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { label } = req.body;

      // 验证参数
      if (!label || typeof label !== 'string' || label.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Label is required and must be a non-empty string',
        });
      }

      if (label.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Label must be less than 100 characters',
        });
      }

      const key = await keysService.createKey({
        userId,
        label: label.trim(),
      });

      res.status(201).json({
        success: true,
        message: 'API Key created successfully',
        data: key,
      });
    } catch (error: any) {
      console.error('[KeysController] createKey error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create API key',
      });
    }
  }

  /**
   * 更新 API Key 状态（启用/禁用）
   * PATCH /api/keys/:id/status
   * Body: { status: 'ACTIVE' | 'DISABLED' }
   */
  async updateKeyStatus(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { status } = req.body;

      // 验证状态
      if (!status || ![KeyStatus.ACTIVE, KeyStatus.DISABLED].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be ACTIVE or DISABLED',
        });
      }

      const key = await keysService.updateKeyStatus(id, userId, { status });

      res.json({
        success: true,
        message: `API Key ${status === KeyStatus.ACTIVE ? 'enabled' : 'disabled'} successfully`,
        data: key,
      });
    } catch (error: any) {
      console.error('[KeysController] updateKeyStatus error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update API key status',
      });
    }
  }

  /**
   * 删除 API Key（软删除）
   * DELETE /api/keys/:id
   */
  async deleteKey(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const result = await keysService.deleteKey(id, userId);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      console.error('[KeysController] deleteKey error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete API key',
      });
    }
  }

  /**
   * 解密 API Key（谨慎使用，可能需要额外的安全验证）
   * POST /api/keys/:id/decrypt
   */
  async decryptKey(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const fullKey = await keysService.decryptKey(id, userId);

      res.json({
        success: true,
        data: {
          fullValue: fullKey,
        },
      });
    } catch (error: any) {
      console.error('[KeysController] decryptKey error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to decrypt API key',
      });
    }
  }
}

export default new KeysController();
