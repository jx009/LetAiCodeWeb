/**
 * 订阅管理控制器
 */
import { Request, Response } from 'express';
import { subscriptionService } from '@/services/subscription.service';
import { creditBalanceService } from '@/services/credit-balance.service';
import { logger } from '@/utils/logger.util';

/**
 * 获取当前用户订阅状态
 * GET /api/subscription
 */
export const getSubscription = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const subscription = await subscriptionService.getActiveSubscription(userId);

    return res.json({
      success: true,
      data: subscription,
    });
  } catch (error: any) {
    logger.error('Get subscription error:', error);
    return res.status(500).json({
      success: false,
      message: '获取订阅信息失败',
      error: error.message,
    });
  }
};

/**
 * 获取用户积分余额详情
 * GET /api/subscription/balance
 */
export const getBalance = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const balance = await creditBalanceService.getBalance(userId);

    return res.json({
      success: true,
      data: balance,
    });
  } catch (error: any) {
    logger.error('Get balance error:', error);
    return res.status(500).json({
      success: false,
      message: '获取积分余额失败',
      error: error.message,
    });
  }
};

/**
 * 取消订阅
 * POST /api/subscription/cancel
 */
export const cancelSubscription = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    await subscriptionService.cancelSubscription(userId);

    return res.json({
      success: true,
      message: '订阅已取消，将在到期后失效',
    });
  } catch (error: any) {
    logger.error('Cancel subscription error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || '取消订阅失败',
    });
  }
};

/**
 * 设置自动续费
 * POST /api/subscription/auto-renew
 */
export const setAutoRenew = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { autoRenew } = req.body;

    if (typeof autoRenew !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: '参数错误',
      });
    }

    await subscriptionService.setAutoRenew(userId, autoRenew);

    return res.json({
      success: true,
      message: autoRenew ? '已开启自动续费' : '已关闭自动续费',
    });
  } catch (error: any) {
    logger.error('Set auto renew error:', error);
    return res.status(500).json({
      success: false,
      message: '设置失败',
      error: error.message,
    });
  }
};

/**
 * 获取订阅历史
 * GET /api/subscription/history
 */
export const getSubscriptionHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const history = await subscriptionService.getSubscriptionHistory(userId);

    return res.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    logger.error('Get subscription history error:', error);
    return res.status(500).json({
      success: false,
      message: '获取订阅历史失败',
      error: error.message,
    });
  }
};

/**
 * 获取积分交易记录
 * GET /api/subscription/transactions
 */
export const getTransactions = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const type = req.query.type as string | undefined;

    const result = await creditBalanceService.getTransactions(userId, page, pageSize, type as any);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Get transactions error:', error);
    return res.status(500).json({
      success: false,
      message: '获取交易记录失败',
      error: error.message,
    });
  }
};

/**
 * 获取订阅统计（管理员）
 * GET /api/admin/subscriptions/stats
 */
export const getSubscriptionStats = async (req: Request, res: Response) => {
  try {
    const stats = await subscriptionService.getSubscriptionStats();

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    logger.error('Get subscription stats error:', error);
    return res.status(500).json({
      success: false,
      message: '获取统计信息失败',
      error: error.message,
    });
  }
};

/**
 * 管理员调整用户积分
 * POST /api/admin/users/:userId/credits/adjust
 */
export const adjustUserCredits = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { amount, reason } = req.body;

    if (typeof amount !== 'number' || !reason) {
      return res.status(400).json({
        success: false,
        message: '参数错误',
      });
    }

    await creditBalanceService.adjustCredits(userId, amount, reason);

    return res.json({
      success: true,
      message: `已${amount > 0 ? '增加' : '扣除'} ${Math.abs(amount)} 积分`,
    });
  } catch (error: any) {
    logger.error('Adjust user credits error:', error);
    return res.status(500).json({
      success: false,
      message: '调整积分失败',
      error: error.message,
    });
  }
};

/**
 * 管理员查询所有用户使用记录
 * GET /api/admin/usage/records
 */
export const getAdminUsageRecords = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const email = req.query.email as string | undefined;
    const model = req.query.model as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const result = await creditBalanceService.getAdminUsageRecords({
      page,
      pageSize,
      email,
      model,
      startDate,
      endDate,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Get admin usage records error:', error);
    return res.status(500).json({
      success: false,
      message: '获取使用记录失败',
      error: error.message,
    });
  }
};

/**
 * 管理员获取使用统计
 * GET /api/admin/usage/stats
 */
export const getAdminUsageStats = async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const stats = await creditBalanceService.getAdminUsageStats({
      startDate,
      endDate,
    });

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    logger.error('Get admin usage stats error:', error);
    return res.status(500).json({
      success: false,
      message: '获取统计信息失败',
      error: error.message,
    });
  }
};

/**
 * 获取所有使用过的模型列表
 * GET /api/admin/usage/models
 */
export const getUsedModels = async (req: Request, res: Response) => {
  try {
    const models = await creditBalanceService.getUsedModels();

    return res.json({
      success: true,
      data: models,
    });
  } catch (error: any) {
    logger.error('Get used models error:', error);
    return res.status(500).json({
      success: false,
      message: '获取模型列表失败',
      error: error.message,
    });
  }
};

/**
 * 用户手动重置积分到天花板
 * POST /api/subscription/reset-credits
 */
export const resetCredits = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const result = await creditBalanceService.dailyReset(userId);

    if (!result.reset) {
      return res.status(400).json({
        success: false,
        message: '积分已满，无需重置',
      });
    }

    return res.json({
      success: true,
      message: '积分已重置',
      data: {
        newCredits: result.newCredits,
      },
    });
  } catch (error: any) {
    logger.error('Reset credits error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || '重置积分失败',
    });
  }
};
