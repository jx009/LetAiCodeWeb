/**
 * 用户订阅服务
 * 负责订阅的创建、查询、续费、取消等操作
 */
import prisma from '@/utils/prisma';
import { SubscriptionStatus } from '@prisma/client';
import { logger } from '@/utils/logger.util';
import { creditBalanceService } from './credit-balance.service';

// 订阅详情
export interface SubscriptionDetail {
  id: string;
  userId: string;
  packageId: string;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  daysRemaining: number;
  package: {
    id: string;
    name: string;
    cycle: string;
    cycleDays: number;
    price: number;
    baseCredits: number;
    replenishCredits: number;
  };
}

class SubscriptionService {
  /**
   * 获取用户当前订阅
   */
  async getActiveSubscription(userId: string): Promise<SubscriptionDetail | null> {
    const subscription = await prisma.userSubscription.findFirst({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
      },
      include: {
        package: true,
      },
    });

    if (!subscription) {
      return null;
    }

    // 检查是否过期
    if (new Date() > subscription.endDate) {
      // 标记为过期并清零积分
      await this.expireSubscription(subscription.id, subscription.userId);
      return null;
    }

    // 计算剩余天数
    const now = new Date();
    const daysRemaining = Math.ceil(
      (subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      id: subscription.id,
      userId: subscription.userId,
      packageId: subscription.packageId,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      autoRenew: subscription.autoRenew,
      daysRemaining: Math.max(0, daysRemaining),
      package: {
        id: subscription.package.id,
        name: subscription.package.name,
        cycle: subscription.package.cycle,
        cycleDays: subscription.package.cycleDays,
        price: subscription.package.price.toNumber(),
        baseCredits: subscription.package.baseCredits,
        replenishCredits: subscription.package.replenishCredits,
      },
    };
  }

  /**
   * 创建订阅（支付成功后调用）
   */
  async createSubscription(userId: string, packageId: string, orderId?: string): Promise<void> {
    // 获取套餐信息
    const pkg = await prisma.subscriptionPackage.findUnique({
      where: { id: packageId },
    });

    if (!pkg) {
      throw new Error('套餐不存在');
    }

    const now = new Date();
    const endDate = new Date(now.getTime() + pkg.cycleDays * 24 * 60 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      // 检查是否已有订阅
      const existingSubscription = await tx.userSubscription.findUnique({
        where: { userId },
      });

      if (existingSubscription) {
        // 如果已有订阅，检查是否是同一套餐的续费
        if (existingSubscription.status === SubscriptionStatus.ACTIVE) {
          // 续费：在现有结束时间基础上延长
          const newEndDate = new Date(
            Math.max(existingSubscription.endDate.getTime(), now.getTime()) +
              pkg.cycleDays * 24 * 60 * 60 * 1000
          );

          await tx.userSubscription.update({
            where: { userId },
            data: {
              packageId,
              endDate: newEndDate,
              status: SubscriptionStatus.ACTIVE,
            },
          });

          // 更新积分配置（如果套餐变更）
          if (existingSubscription.packageId !== packageId) {
            await creditBalanceService.initializeCredits(
              userId,
              pkg.baseCredits,
              pkg.replenishCredits
            );
          }

          logger.info(
            `Renewed subscription for user ${userId}, package: ${packageId}, new end date: ${newEndDate}`
          );
        } else {
          // 重新激活订阅
          await tx.userSubscription.update({
            where: { userId },
            data: {
              packageId,
              startDate: now,
              endDate,
              status: SubscriptionStatus.ACTIVE,
            },
          });

          // 初始化积分
          await creditBalanceService.initializeCredits(userId, pkg.baseCredits, pkg.replenishCredits);

          logger.info(`Reactivated subscription for user ${userId}, package: ${packageId}`);
        }
      } else {
        // 创建新订阅
        await tx.userSubscription.create({
          data: {
            userId,
            packageId,
            startDate: now,
            endDate,
            status: SubscriptionStatus.ACTIVE,
            autoRenew: false,
          },
        });

        // 初始化积分
        await creditBalanceService.initializeCredits(userId, pkg.baseCredits, pkg.replenishCredits);

        logger.info(`Created new subscription for user ${userId}, package: ${packageId}`);
      }
    });
  }

  /**
   * 续费订阅
   */
  async renewSubscription(userId: string, packageId: string): Promise<void> {
    await this.createSubscription(userId, packageId);
  }

  /**
   * 取消订阅（不会立即失效，到期后不再续费）
   */
  async cancelSubscription(userId: string): Promise<void> {
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new Error('没有找到订阅');
    }

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new Error('订阅已过期或已取消');
    }

    await prisma.userSubscription.update({
      where: { userId },
      data: {
        autoRenew: false,
        status: SubscriptionStatus.CANCELLED,
      },
    });

    logger.info(`Cancelled subscription for user ${userId}`);
  }

  /**
   * 设置自动续费
   */
  async setAutoRenew(userId: string, autoRenew: boolean): Promise<void> {
    await prisma.userSubscription.update({
      where: { userId },
      data: { autoRenew },
    });

    logger.info(`Set auto renew to ${autoRenew} for user ${userId}`);
  }

  /**
   * 标记订阅为过期，并清零积分
   */
  private async expireSubscription(subscriptionId: string, userId: string): Promise<void> {
    await prisma.userSubscription.update({
      where: { id: subscriptionId },
      data: { status: SubscriptionStatus.EXPIRED },
    });

    // 清零用户积分
    await creditBalanceService.clearCreditsOnExpire(userId);

    logger.info(`Marked subscription ${subscriptionId} as expired and cleared credits for user ${userId}`);
  }

  /**
   * 批量检查并过期订阅（定时任务调用）
   */
  async checkAndExpireSubscriptions(): Promise<number> {
    const now = new Date();

    // 先查询需要过期的订阅，以便获取用户ID来清零积分
    const expiredSubscriptions = await prisma.userSubscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: { lt: now },
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (expiredSubscriptions.length === 0) {
      return 0;
    }

    // 逐个过期订阅并清零积分
    for (const sub of expiredSubscriptions) {
      try {
        await this.expireSubscription(sub.id, sub.userId);
      } catch (error) {
        logger.error(`Failed to expire subscription ${sub.id}:`, error);
      }
    }

    logger.info(`Expired ${expiredSubscriptions.length} subscriptions`);

    return expiredSubscriptions.length;
  }

  /**
   * 获取用户订阅历史
   */
  async getSubscriptionHistory(userId: string) {
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId },
      include: {
        package: true,
      },
    });

    // 获取相关的支付订单
    const orders = await prisma.paymentOrder.findMany({
      where: {
        userId,
        status: 'PAID',
      },
      include: {
        package: true,
      },
      orderBy: {
        paidAt: 'desc',
      },
      take: 10,
    });

    return {
      currentSubscription: subscription,
      paymentHistory: orders,
    };
  }

  /**
   * 获取订阅统计
   */
  async getSubscriptionStats() {
    const [total, active, expired, cancelled] = await Promise.all([
      prisma.userSubscription.count(),
      prisma.userSubscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
      prisma.userSubscription.count({ where: { status: SubscriptionStatus.EXPIRED } }),
      prisma.userSubscription.count({ where: { status: SubscriptionStatus.CANCELLED } }),
    ]);

    // 获取即将到期的订阅（7天内）
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const expiringSoon = await prisma.userSubscription.count({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: {
          gte: new Date(),
          lte: sevenDaysLater,
        },
      },
    });

    return {
      total,
      active,
      expired,
      cancelled,
      expiringSoon,
    };
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;
