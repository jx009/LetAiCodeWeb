/**
 * 积分补充服务（定时任务）
 * 负责每小时积分补充和每日重置
 */
import prisma from '@/utils/prisma';
import { SubscriptionStatus } from '@prisma/client';
import { logger } from '@/utils/logger.util';
import { creditBalanceService } from './credit-balance.service';
import { subscriptionService } from './subscription.service';

class ReplenishService {
  private isRunningHourly = false;
  private isRunningDaily = false;

  /**
   * 每小时运行：补充所有有效用户的积分
   */
  async runHourlyReplenish(): Promise<{ processed: number; replenished: number }> {
    if (this.isRunningHourly) {
      logger.warn('Hourly replenish is already running, skipping...');
      return { processed: 0, replenished: 0 };
    }

    this.isRunningHourly = true;
    let processed = 0;
    let totalReplenished = 0;

    try {
      logger.info('Starting hourly credit replenish...');

      // 获取所有有效订阅的用户ID
      const activeSubscriptions = await prisma.userSubscription.findMany({
        where: {
          status: SubscriptionStatus.ACTIVE,
          endDate: { gt: new Date() },
        },
        select: { userId: true },
      });

      // 获取这些用户中积分未满的
      const userIds = activeSubscriptions.map((s) => s.userId);

      if (userIds.length === 0) {
        logger.info('No active subscriptions to replenish');
        return { processed: 0, replenished: 0 };
      }

      // 获取需要补充积分的用户（当前积分 < 基础积分）
      const balances = await prisma.userCreditBalance.findMany({
        where: {
          userId: { in: userIds },
        },
      });

      const needsReplenish = balances.filter((b) => b.currentCredits < b.baseCredits);

      // 逐个补充积分
      for (const balance of needsReplenish) {
        try {
          const result = await creditBalanceService.replenishCredits(balance.userId);
          processed++;
          totalReplenished += result.replenished;
        } catch (error) {
          logger.error(`Error replenishing credits for user ${balance.userId}:`, error);
        }
      }

      logger.info(
        `Hourly replenish completed: ${processed} users processed, ${totalReplenished} total credits replenished`
      );

      return { processed, replenished: totalReplenished };
    } catch (error) {
      logger.error('Error in hourly replenish:', error);
      throw error;
    } finally {
      this.isRunningHourly = false;
    }
  }

  /**
   * 每天运行：重置所有用户的积分到天花板
   */
  async runDailyReset(): Promise<{ processed: number; reset: number }> {
    if (this.isRunningDaily) {
      logger.warn('Daily reset is already running, skipping...');
      return { processed: 0, reset: 0 };
    }

    this.isRunningDaily = true;
    let processed = 0;
    let totalReset = 0;

    try {
      logger.info('Starting daily credit reset...');

      // 先检查并过期已结束的订阅
      await subscriptionService.checkAndExpireSubscriptions();

      // 获取所有有效订阅的用户
      const activeSubscriptions = await prisma.userSubscription.findMany({
        where: {
          status: SubscriptionStatus.ACTIVE,
          endDate: { gt: new Date() },
        },
        select: { userId: true },
      });

      const userIds = activeSubscriptions.map((s) => s.userId);

      if (userIds.length === 0) {
        logger.info('No active subscriptions to reset');
        return { processed: 0, reset: 0 };
      }

      // 逐个重置积分
      for (const userId of userIds) {
        try {
          const result = await creditBalanceService.dailyReset(userId);
          processed++;
          if (result.reset) {
            totalReset++;
          }
        } catch (error) {
          logger.error(`Error resetting credits for user ${userId}:`, error);
        }
      }

      logger.info(`Daily reset completed: ${processed} users processed, ${totalReset} users reset`);

      return { processed, reset: totalReset };
    } catch (error) {
      logger.error('Error in daily reset:', error);
      throw error;
    } finally {
      this.isRunningDaily = false;
    }
  }

  /**
   * 手动触发单个用户的积分补充（用于测试或管理）
   */
  async replenishUserCredits(userId: string): Promise<{ replenished: number }> {
    return creditBalanceService.replenishCredits(userId);
  }

  /**
   * 手动触发单个用户的每日重置（用于测试或管理）
   */
  async resetUserCredits(userId: string): Promise<{ reset: boolean; newCredits: number }> {
    return creditBalanceService.dailyReset(userId);
  }

  /**
   * 获取补充任务状态
   */
  getStatus() {
    return {
      isRunningHourly: this.isRunningHourly,
      isRunningDaily: this.isRunningDaily,
    };
  }
}

export const replenishService = new ReplenishService();
export default replenishService;
