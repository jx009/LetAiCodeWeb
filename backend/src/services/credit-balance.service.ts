/**
 * 用户积分余额服务
 * 负责积分的查询、扣除、补充、重置等操作
 */
import prisma from '@/utils/prisma';
import { TransactionType, Prisma } from '@prisma/client';
import { logger } from '@/utils/logger.util';
import optionService from './option.service';

// 积分余额信息
export interface CreditBalanceInfo {
  baseCredits: number; // 基础积分（天花板）
  replenishCredits: number; // 每小时补充量
  currentCredits: number; // 当前可用积分
  nextReplenishAt: Date | null; // 下次补充时间
  nextDailyResetAt: Date | null; // 下次每日重置时间
  hasSubscription: boolean; // 是否有有效订阅
}

class CreditBalanceService {
  /**
   * 获取用户积分余额信息
   */
  async getBalance(userId: string): Promise<CreditBalanceInfo> {
    // 获取用户积分余额记录
    let balance = await prisma.userCreditBalance.findUnique({
      where: { userId },
    });

    // 如果没有记录，创建一个默认的
    if (!balance) {
      balance = await prisma.userCreditBalance.create({
        data: {
          userId,
          baseCredits: 0,
          replenishCredits: 0,
          currentCredits: 0,
        },
      });
    }

    // 检查是否有有效订阅
    const subscription = await prisma.userSubscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { gt: new Date() },
      },
    });

    const hasSubscription = !!subscription;

    // 计算下次补充时间（下一个整点）
    let nextReplenishAt: Date | null = null;
    if (hasSubscription && balance.currentCredits < balance.baseCredits) {
      const now = new Date();
      nextReplenishAt = new Date(now);
      nextReplenishAt.setMinutes(0, 0, 0);
      nextReplenishAt.setHours(nextReplenishAt.getHours() + 1);
    }

    // 计算下次每日重置时间（明天0点，按用户时区）
    let nextDailyResetAt: Date | null = null;
    if (hasSubscription) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { timezone: true },
      });

      const timezone = user?.timezone || 'Asia/Shanghai';
      nextDailyResetAt = this.getNextMidnight(timezone);
    }

    return {
      baseCredits: balance.baseCredits,
      replenishCredits: balance.replenishCredits,
      currentCredits: balance.currentCredits,
      nextReplenishAt,
      nextDailyResetAt,
      hasSubscription,
    };
  }

  /**
   * 获取用户当前可用积分（简化版本）
   */
  async getCurrentCredits(userId: string): Promise<number> {
    const balance = await prisma.userCreditBalance.findUnique({
      where: { userId },
    });

    return balance?.currentCredits ?? 0;
  }

  /**
   * 扣除积分（API 调用时）
   *
   * 积分扣除规则：
   * - 当前积分 > 0：允许调用，扣除后可以为负数
   * - 当前积分 <= 0：拒绝调用，提示余额不足
   *
   * @returns 是否扣除成功
   */
  async deductCredits(
    userId: string,
    amount: number,
    reason: string,
    ref?: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // 获取当前余额
        const balance = await tx.userCreditBalance.findUnique({
          where: { userId },
        });

        if (!balance) {
          return { success: false, message: '用户积分账户不存在' };
        }

        // 检查余额是否为正数（只有正数才能调用，扣除后可以为负）
        if (balance.currentCredits <= 0) {
          return { success: false, message: '积分余额不足' };
        }

        // 扣除积分（允许扣成负数）
        const newCredits = balance.currentCredits - amount;

        await tx.userCreditBalance.update({
          where: { userId },
          data: { currentCredits: newCredits },
        });

        // 记录交易
        await tx.creditTransaction.create({
          data: {
            userId,
            type: TransactionType.DEDUCT,
            amount: -amount,
            balance: newCredits,
            ref,
            desc: reason,
          },
        });

        return { success: true };
      });

      if (result.success) {
        logger.info(`Deducted ${amount} credits from user ${userId}: ${reason}`);
      }

      return result;
    } catch (error) {
      logger.error(`Error deducting credits for user ${userId}:`, error);
      return { success: false, message: '扣除积分失败' };
    }
  }

  /**
   * 从 USD 扣除积分（Webhook 调用时）
   */
  async deductCreditsFromUsd(
    userId: string,
    costUsd: number,
    reason: string,
    ref?: string
  ): Promise<{ success: boolean; creditCost: number; message?: string }> {
    // 获取汇率
    const creditCost = await optionService.calculateCreditsFromUsd(costUsd);

    if (creditCost <= 0) {
      return { success: true, creditCost: 0 };
    }

    const result = await this.deductCredits(userId, creditCost, reason, ref);

    return {
      ...result,
      creditCost,
    };
  }

  /**
   * 补充积分（每小时调用）
   */
  async replenishCredits(userId: string): Promise<{ replenished: number }> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // 获取用户积分余额
        const balance = await tx.userCreditBalance.findUnique({
          where: { userId },
        });

        if (!balance || balance.replenishCredits <= 0) {
          return { replenished: 0 };
        }

        // 检查是否需要补充（当前积分未满）
        if (balance.currentCredits >= balance.baseCredits) {
          return { replenished: 0 };
        }

        // 检查订阅是否有效
        const subscription = await tx.userSubscription.findFirst({
          where: {
            userId,
            status: 'ACTIVE',
            endDate: { gt: new Date() },
          },
        });

        if (!subscription) {
          return { replenished: 0 };
        }

        // 计算补充量（不超过天花板）
        const replenishAmount = Math.min(
          balance.replenishCredits,
          balance.baseCredits - balance.currentCredits
        );

        const newCredits = balance.currentCredits + replenishAmount;

        // 更新积分
        await tx.userCreditBalance.update({
          where: { userId },
          data: {
            currentCredits: newCredits,
            lastReplenishAt: new Date(),
          },
        });

        // 记录交易
        await tx.creditTransaction.create({
          data: {
            userId,
            type: TransactionType.REPLENISH,
            amount: replenishAmount,
            balance: newCredits,
            desc: `每小时自动补充 ${replenishAmount} 积分`,
          },
        });

        return { replenished: replenishAmount };
      });

      if (result.replenished > 0) {
        logger.info(`Replenished ${result.replenished} credits for user ${userId}`);
      }

      return result;
    } catch (error) {
      logger.error(`Error replenishing credits for user ${userId}:`, error);
      return { replenished: 0 };
    }
  }

  /**
   * 每日重置积分（将积分恢复到天花板）
   */
  async dailyReset(userId: string): Promise<{ reset: boolean; newCredits: number }> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // 获取用户信息（包含时区）
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { timezone: true },
        });

        const timezone = user?.timezone || 'Asia/Shanghai';

        // 获取用户积分余额
        const balance = await tx.userCreditBalance.findUnique({
          where: { userId },
        });

        if (!balance || balance.baseCredits <= 0) {
          return { reset: false, newCredits: 0 };
        }

        // 检查今天是否已经重置过
        if (balance.lastDailyResetAt) {
          const lastResetDate = this.getDateInTimezone(balance.lastDailyResetAt, timezone);
          const todayDate = this.getDateInTimezone(new Date(), timezone);

          if (lastResetDate === todayDate) {
            return { reset: false, newCredits: balance.currentCredits };
          }
        }

        // 检查订阅是否有效
        const subscription = await tx.userSubscription.findFirst({
          where: {
            userId,
            status: 'ACTIVE',
            endDate: { gt: new Date() },
          },
        });

        if (!subscription) {
          return { reset: false, newCredits: balance.currentCredits };
        }

        // 重置积分到天花板
        const newCredits = balance.baseCredits;
        const addedCredits = newCredits - balance.currentCredits;

        await tx.userCreditBalance.update({
          where: { userId },
          data: {
            currentCredits: newCredits,
            lastDailyResetAt: new Date(),
          },
        });

        // 只有当积分有变化时才记录交易
        if (addedCredits !== 0) {
          await tx.creditTransaction.create({
            data: {
              userId,
              type: TransactionType.DAILY_RESET,
              amount: addedCredits,
              balance: newCredits,
              desc: `每日重置，积分恢复到 ${newCredits}`,
            },
          });
        }

        return { reset: true, newCredits };
      });

      if (result.reset) {
        logger.info(`Daily reset for user ${userId}, new credits: ${result.newCredits}`);
      }

      return result;
    } catch (error) {
      logger.error(`Error daily reset for user ${userId}:`, error);
      return { reset: false, newCredits: 0 };
    }
  }

  /**
   * 初始化用户积分（购买订阅时）
   * 注意：初始积分为 0，需要等待每小时补充或每日重置
   */
  async initializeCredits(
    userId: string,
    baseCredits: number,
    replenishCredits: number
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // 获取当前积分余额（如果存在）
      const existingBalance = await tx.userCreditBalance.findUnique({
        where: { userId },
      });

      // 更新或创建积分余额记录
      // 初始积分为 0，不直接给满额
      await tx.userCreditBalance.upsert({
        where: { userId },
        create: {
          userId,
          baseCredits,
          replenishCredits,
          currentCredits: 0, // 初始积分为 0
        },
        update: {
          baseCredits,
          replenishCredits,
          // 续订时保持当前积分不变，只更新天花板和补充量
          currentCredits: existingBalance?.currentCredits ?? 0,
        },
      });

      // 记录交易
      await tx.creditTransaction.create({
        data: {
          userId,
          type: TransactionType.SUBSCRIPTION,
          amount: 0,
          balance: existingBalance?.currentCredits ?? 0,
          desc: `订阅开通，天花板 ${baseCredits} 积分，每小时补充 ${replenishCredits} 积分`,
        },
      });
    });

    logger.info(
      `Initialized credits for user ${userId}: base=${baseCredits}, replenish=${replenishCredits}, currentCredits=0`
    );
  }

  /**
   * 订阅到期时清零积分
   */
  async clearCreditsOnExpire(userId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const balance = await tx.userCreditBalance.findUnique({
        where: { userId },
      });

      if (!balance) {
        return;
      }

      const previousCredits = balance.currentCredits;

      // 清零积分和配置
      await tx.userCreditBalance.update({
        where: { userId },
        data: {
          currentCredits: 0,
          baseCredits: 0,
          replenishCredits: 0,
        },
      });

      // 只有当之前有积分时才记录交易
      if (previousCredits !== 0) {
        await tx.creditTransaction.create({
          data: {
            userId,
            type: TransactionType.SUBSCRIPTION,
            amount: -previousCredits,
            balance: 0,
            desc: '订阅到期，积分清零',
          },
        });
      }
    });

    logger.info(`Cleared credits for user ${userId} due to subscription expiry`);
  }

  /**
   * 管理员调整积分
   */
  async adjustCredits(userId: string, amount: number, reason: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // 获取当前余额
      let balance = await tx.userCreditBalance.findUnique({
        where: { userId },
      });

      if (!balance) {
        // 如果没有余额记录，创建一个
        balance = await tx.userCreditBalance.create({
          data: {
            userId,
            baseCredits: 0,
            replenishCredits: 0,
            currentCredits: 0,
          },
        });
      }

      const newCredits = Math.max(0, balance.currentCredits + amount);

      // 更新积分
      await tx.userCreditBalance.update({
        where: { userId },
        data: { currentCredits: newCredits },
      });

      // 记录交易
      await tx.creditTransaction.create({
        data: {
          userId,
          type: TransactionType.ADMIN_ADJUST,
          amount,
          balance: newCredits,
          desc: `管理员调整：${reason}`,
        },
      });
    });

    logger.info(`Admin adjusted ${amount} credits for user ${userId}: ${reason}`);
  }

  /**
   * 获取用户时区的日期字符串（YYYY-MM-DD）
   */
  private getDateInTimezone(date: Date, timezone: string): string {
    try {
      return date.toLocaleDateString('en-CA', { timeZone: timezone });
    } catch {
      // 如果时区无效，使用默认时区
      return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
    }
  }

  /**
   * 获取用户时区的下一个午夜时间
   */
  private getNextMidnight(timezone: string): Date {
    try {
      const now = new Date();
      // 获取当前时区的今天日期
      const todayStr = now.toLocaleDateString('en-CA', { timeZone: timezone });
      const [year, month, day] = todayStr.split('-').map(Number);

      // 计算明天的日期
      const tomorrow = new Date(year, month - 1, day + 1);

      // 转换回 UTC
      const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}T00:00:00`;

      // 使用 Intl 获取时区偏移
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        timeZoneName: 'short',
      });

      // 简化处理：直接返回明天0点的估计时间
      const nextMidnight = new Date(tomorrowStr);
      return nextMidnight;
    } catch {
      // 如果出错，返回 24 小时后
      const next = new Date();
      next.setHours(24, 0, 0, 0);
      return next;
    }
  }

  /**
   * 获取积分交易记录
   */
  async getTransactions(
    userId: string,
    page: number = 1,
    pageSize: number = 20,
    type?: TransactionType
  ) {
    const where: Prisma.CreditTransactionWhereInput = { userId };
    if (type) {
      where.type = type;
    }

    const [total, records] = await Promise.all([
      prisma.creditTransaction.count({ where }),
      prisma.creditTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      records,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 管理员查询所有用户积分消耗记录
   */
  async getAdminUsageRecords(params: {
    page?: number;
    pageSize?: number;
    email?: string;
    model?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { page = 1, pageSize = 20, email, model, startDate, endDate } = params;

    // 构建查询条件
    const where: Prisma.UsageRecordWhereInput = {};

    // 按邮箱筛选 - 需要先查用户ID
    if (email) {
      const users = await prisma.user.findMany({
        where: {
          email: { contains: email },
        },
        select: { id: true },
      });
      const userIds = users.map((u) => u.id);

      if (userIds.length === 0) {
        return {
          records: [],
          pagination: { total: 0, page, pageSize, totalPages: 0 },
        };
      }

      // 获取这些用户的 API Key IDs
      const apiKeys = await prisma.apiKey.findMany({
        where: { userId: { in: userIds } },
        select: { id: true },
      });
      where.apiKeyId = { in: apiKeys.map((k) => k.id) };
    }

    // 按模型筛选
    if (model) {
      where.model = { contains: model };
    }

    // 按时间筛选
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.timestamp.lte = end;
      }
    }

    const [total, records] = await Promise.all([
      prisma.usageRecord.count({ where }),
      prisma.usageRecord.findMany({
        where,
        include: {
          apiKey: {
            select: {
              id: true,
              label: true,
              userId: true,
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      records: records.map((r) => ({
        id: r.id,
        timestamp: r.timestamp,
        model: r.model,
        promptTokens: r.promptTokens,
        completionTokens: r.completionTokens,
        totalTokens: r.totalTokens,
        costUsd: r.costUsd,
        creditCost: r.creditCost,
        user: r.apiKey.user,
        apiKeyLabel: r.apiKey.label,
      })),
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 管理员获取使用统计
   */
  async getAdminUsageStats(params: { startDate?: string; endDate?: string }) {
    const { startDate, endDate } = params;

    const where: Prisma.UsageRecordWhereInput = {};
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.timestamp.lte = end;
      }
    }

    // 总体统计
    const [totalRecords, aggregation] = await Promise.all([
      prisma.usageRecord.count({ where }),
      prisma.usageRecord.aggregate({
        where,
        _sum: {
          totalTokens: true,
          creditCost: true,
          costUsd: true,
        },
      }),
    ]);

    // 按模型分组统计
    const modelStats = await prisma.usageRecord.groupBy({
      by: ['model'],
      where,
      _count: true,
      _sum: {
        totalTokens: true,
        creditCost: true,
        costUsd: true,
      },
      orderBy: {
        _sum: {
          creditCost: 'desc',
        },
      },
      take: 10,
    });

    return {
      totalRecords,
      totalTokens: aggregation._sum.totalTokens || 0,
      totalCredits: aggregation._sum.creditCost || 0,
      totalCostUsd: aggregation._sum.costUsd || 0,
      modelStats: modelStats.map((m) => ({
        model: m.model,
        count: m._count,
        totalTokens: m._sum.totalTokens || 0,
        creditCost: m._sum.creditCost || 0,
        costUsd: m._sum.costUsd || 0,
      })),
    };
  }

  /**
   * 获取所有使用过的模型列表（用于筛选下拉框）
   */
  async getUsedModels(): Promise<string[]> {
    const models = await prisma.usageRecord.findMany({
      select: { model: true },
      distinct: ['model'],
      orderBy: { model: 'asc' },
    });
    return models.map((m) => m.model);
  }
}

export const creditBalanceService = new CreditBalanceService();
export default creditBalanceService;
