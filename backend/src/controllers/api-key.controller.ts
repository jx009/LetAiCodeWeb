/**
 * API Key 控制器
 * 处理 API Key 相关的业务逻辑
 */
import { Request, Response } from 'express';
import prisma from '@/utils/prisma';
import creditService from '@/services/credit.service';

class ApiKeyController {
  /**
   * 获取用户积分余额（供 new-api 调用）
   * GET /api/api-keys/:keyId/credit-balance
   *
   * Headers:
   *   - X-API-Key: admin_token
   *
   * Response:
   *   {
   *     "success": true,
   *     "data": {
   *       "credit": 1000,
   *       "userId": "user-id",
   *       "keyId": "key-id",
   *       "remoteKeyId": 42,
   *       "lastUpdated": "2024-12-18T12:00:00Z"
   *     }
   *   }
   */
  async getCreditBalance(req: Request, res: Response) {
    try {
      const { keyId } = req.params;
      const adminToken = req.headers['x-api-key'];

      // 1. 验证 admin token
      if (adminToken !== process.env.NEW_API_ADMIN_TOKEN) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: Invalid API key'
        });
      }

      // 2. 根据 keyId 找到 API Key
      const apiKey = await prisma.apiKey.findUnique({
        where: { id: keyId },
        include: { user: true }
      });

      if (!apiKey) {
        return res.status(404).json({
          success: false,
          message: `API Key not found: ${keyId}`
        });
      }

      if (apiKey.status !== 'ACTIVE') {
        return res.status(403).json({
          success: false,
          message: `API Key is not active: ${apiKey.status}`
        });
      }

      // 3. 获取用户的实时积分余额
      const balance = await creditService.getBalance(apiKey.userId);

      // 4. 返回响应
      return res.status(200).json({
        success: true,
        data: {
          credit: balance,
          userId: apiKey.userId,
          keyId: apiKey.id,
          remoteKeyId: apiKey.remoteKeyId,
          label: apiKey.label,
          lastUpdated: new Date().toISOString(),
          timestamp: Math.floor(Date.now() / 1000)
        }
      });
    } catch (error: any) {
      console.error('[ApiKeyController] getCreditBalance error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  /**
   * 获取 API Key 详情
   * GET /api/api-keys/:keyId
   */
  async getDetail(req: Request, res: Response) {
    try {
      const { keyId } = req.params;

      const apiKey = await prisma.apiKey.findUnique({
        where: { id: keyId },
        include: { user: true }
      });

      if (!apiKey) {
        return res.status(404).json({
          success: false,
          message: 'API Key not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          id: apiKey.id,
          label: apiKey.label,
          maskedValue: apiKey.maskedValue,
          status: apiKey.status,
          remoteKeyId: apiKey.remoteKeyId,
          createdAt: apiKey.createdAt,
          lastUsedAt: apiKey.lastUsedAt
        }
      });
    } catch (error: any) {
      console.error('[ApiKeyController] getDetail error:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 健康检查端点
   * GET /api/api-keys/health
   */
  async health(req: Request, res: Response) {
    try {
      // 验证数据库连接
      await prisma.apiKey.findFirst({ take: 1 });

      return res.status(200).json({
        success: true,
        message: 'API Key service is healthy',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      return res.status(503).json({
        success: false,
        message: 'Service unavailable: ' + error.message
      });
    }
  }
}

export default new ApiKeyController();