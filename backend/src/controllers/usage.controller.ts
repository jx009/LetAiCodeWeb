/**
 * 使用记录控制器
 */
import { Request, Response } from 'express';
import usageService from '../services/usage.service';

class UsageController {
  /**
   * 获取使用记录列表
   * GET /api/usage
   * Query: keyId, startDate, endDate, model, page, pageSize
   */
  async getUsageRecords(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { keyId, startDate, endDate, model, page, pageSize } = req.query;

      const params: any = {};

      if (keyId) params.keyId = keyId as string;
      if (model) params.model = model as string;
      if (page) params.page = parseInt(page as string, 10);
      if (pageSize) params.pageSize = parseInt(pageSize as string, 10);

      // 解析日期
      if (startDate) {
        params.startDate = new Date(startDate as string);
      }
      if (endDate) {
        params.endDate = new Date(endDate as string);
      }

      const result = await usageService.getUsageRecords(userId, params);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('[UsageController] getUsageRecords error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get usage records',
      });
    }
  }

  /**
   * 获取使用统计（按模型分组）
   * GET /api/usage/statistics
   * Query: startDate, endDate
   */
  async getUsageStatistics(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { startDate, endDate } = req.query;

      const params: any = {};

      if (startDate) {
        params.startDate = new Date(startDate as string);
      }
      if (endDate) {
        params.endDate = new Date(endDate as string);
      }

      const result = await usageService.getUsageStatistics(
        userId,
        params.startDate,
        params.endDate
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('[UsageController] getUsageStatistics error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get usage statistics',
      });
    }
  }

  /**
   * 手动触发同步（已禁用）
   * POST /api/usage/sync
   *
   * 注意：现在使用 webhook 实时推送，手动同步已禁用以避免重复扣费
   */
  async manualSync(req: Request, res: Response) {
    res.status(400).json({
      success: false,
      message: '手动同步已禁用，使用记录通过 webhook 实时推送',
    });
  }
}

export default new UsageController();
