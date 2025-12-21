/**
 * 积分交易记录控制器
 */
import { Request, Response } from 'express';
import { creditBalanceService } from '../services/credit-balance.service';
import { TransactionType } from '@prisma/client';

class TransactionController {
  /**
   * 获取交易记录列表
   * GET /api/transactions
   * Query: type, startDate, endDate, page, pageSize
   */
  async getTransactions(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { type, startDate, endDate, page, pageSize } = req.query;

      const params: any = {};

      if (type && Object.values(TransactionType).includes(type as TransactionType)) {
        params.type = type as TransactionType;
      }

      if (page) params.page = parseInt(page as string, 10);
      if (pageSize) params.pageSize = parseInt(pageSize as string, 10);

      // 解析日期
      if (startDate) {
        params.startDate = new Date(startDate as string);
      }
      if (endDate) {
        params.endDate = new Date(endDate as string);
      }

      const result = await creditBalanceService.getTransactions(
        userId,
        params.page,
        params.pageSize,
        params.type
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('[TransactionController] getTransactions error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get transactions',
      });
    }
  }

  /**
   * 获取当前余额
   * GET /api/transactions/balance
   */
  async getBalance(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      const balanceInfo = await creditBalanceService.getBalance(userId);

      res.json({
        success: true,
        data: {
          balance: balanceInfo.currentCredits,
          baseCredits: balanceInfo.baseCredits,
          replenishCredits: balanceInfo.replenishCredits,
          nextReplenishAt: balanceInfo.nextReplenishAt,
          hasSubscription: balanceInfo.hasSubscription,
        },
      });
    } catch (error: any) {
      console.error('[TransactionController] getBalance error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get balance',
      });
    }
  }

  /**
   * 获取统计信息
   * GET /api/transactions/statistics
   * Query: startDate, endDate
   */
  async getStatistics(req: Request, res: Response) {
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

      const result = await creditBalanceService.getStatistics(
        userId,
        params.startDate,
        params.endDate
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('[TransactionController] getStatistics error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get statistics',
      });
    }
  }
}

export default new TransactionController();
