/**
 * 积分管理服务
 * 负责积分充值、扣除、查询等操作
 */
import prisma from '@/utils/prisma';
import { TransactionType } from '@prisma/client';

interface DeductCreditParams {
  userId: string;
  apiKeyId: string;
  tokens: number;
  model: string;
  usageRecordId: string;
}

interface RechargeCreditParams {
  userId: string;
  amount: number;
  bonusAmount: number;
  orderNo: string;
}

class CreditService {
  // 积分换算比例配置（每1000 tokens = X 积分）
  private readonly TOKEN_TO_CREDIT_RATIO = 1; // 可配置

  /**
   * 扣除积分（API 调用）
   * @param params 扣除参数
   */
  async deductCredit(params: DeductCreditParams): Promise<void> {
    const { userId, apiKeyId, tokens, model, usageRecordId } = params;

    // 计算积分消耗
    const creditCost = Math.ceil((tokens / 1000) * this.TOKEN_TO_CREDIT_RATIO);

    await prisma.$transaction(async (tx: any) => {
      // 1. 获取当前余额
      const currentBalance = await this.getBalance(userId, tx);

      // 2. 检查余额是否足够
      if (currentBalance < creditCost) {
        throw new Error('积分余额不足');
      }

      // 3. 计算新余额
      const newBalance = currentBalance - creditCost;

      // 4. 创建扣费记录
      await tx.creditTransaction.create({
        data: {
          userId,
          type: TransactionType.DEDUCT,
          amount: -creditCost,
          balance: newBalance,
          ref: usageRecordId,
          desc: `API 调用扣费（${model}，${tokens} tokens）`,
        },
      });
    });
  }

  /**
   * 充值积分
   * @param params 充值参数
   */
  async rechargeCredit(params: RechargeCreditParams): Promise<void> {
    const { userId, amount, bonusAmount, orderNo } = params;

    await prisma.$transaction(async (tx: any) => {
      const currentBalance = await this.getBalance(userId, tx);

      // 1. 基础充值
      const newBalanceBase = currentBalance + amount;
      await tx.creditTransaction.create({
        data: {
          userId,
          type: TransactionType.RECHARGE,
          amount,
          balance: newBalanceBase,
          ref: orderNo,
          desc: `充值积分`,
        },
      });

      // 2. 赠送积分（如果有）
      if (bonusAmount > 0) {
        const newBalanceBonus = newBalanceBase + bonusAmount;
        await tx.creditTransaction.create({
          data: {
            userId,
            type: TransactionType.BONUS,
            amount: bonusAmount,
            balance: newBalanceBonus,
            ref: orderNo,
            desc: `充值赠送积分`,
          },
        });
      }
    });
  }

  /**
   * 退款积分
   * @param userId 用户 ID
   * @param amount 退款金额
   * @param orderNo 订单号
   */
  async refundCredit(userId: string, amount: number, orderNo: string): Promise<void> {
    await prisma.$transaction(async (tx: any) => {
      const currentBalance = await this.getBalance(userId, tx);

      // 检查余额是否足够退款（不能退款超过当前余额）
      if (currentBalance < amount) {
        throw new Error('余额不足，无法退款');
      }

      const newBalance = currentBalance - amount;

      await tx.creditTransaction.create({
        data: {
          userId,
          type: TransactionType.REFUND,
          amount: -amount,
          balance: newBalance,
          ref: orderNo,
          desc: `退款扣除积分`,
        },
      });
    });
  }

  /**
   * 管理员调整积分
   * @param userId 用户 ID
   * @param amount 调整金额（正数为增加，负数为减少）
   * @param reason 调整原因
   */
  async adjustCredit(userId: string, amount: number, reason: string): Promise<void> {
    await prisma.$transaction(async (tx: any) => {
      const currentBalance = await this.getBalance(userId, tx);
      const newBalance = currentBalance + amount;

      if (newBalance < 0) {
        throw new Error('调整后余额不能为负数');
      }

      await tx.creditTransaction.create({
        data: {
          userId,
          type: TransactionType.ADMIN_ADJUST,
          amount,
          balance: newBalance,
          ref: null,
          desc: `管理员调整：${reason}`,
        },
      });
    });
  }

  /**
   * 获取当前余额
   * @param userId 用户 ID
   * @param tx 可选的事务对象
   * @returns 当前余额
   */
  async getBalance(userId: string, tx?: any): Promise<number> {
    const prismaClient = tx || prisma;

    const lastTransaction = await prismaClient.creditTransaction.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return lastTransaction?.balance || 0;
  }

  /**
   * 获取交易记录
   * @param userId 用户 ID
   * @param type 交易类型（可选）
   * @param startDate 开始日期（可选）
   * @param endDate 结束日期（可选）
   * @param page 页码
   * @param pageSize 每页数量
   * @returns 交易记录列表
   */
  async getTransactions(
    userId: string,
    type?: TransactionType,
    startDate?: Date,
    endDate?: Date,
    page: number = 1,
    pageSize: number = 20
  ) {
    const where: any = { userId };

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    // 获取总数
    const total = await prisma.creditTransaction.count({ where });

    // 获取记录
    const records = await prisma.creditTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 获取当前余额
    const currentBalance = await this.getBalance(userId);

    return {
      records,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      summary: {
        currentBalance,
      },
    };
  }

  /**
   * 获取统计信息
   * @param userId 用户 ID
   * @param startDate 开始日期（可选）
   * @param endDate 结束日期（可选）
   * @returns 统计信息
   */
  async getStatistics(userId: string, startDate?: Date, endDate?: Date) {
    const where: any = { userId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    // 获取各类型交易的统计
    const stats = await prisma.creditTransaction.groupBy({
      by: ['type'],
      where,
      _sum: {
        amount: true,
      },
    });

    // 当前余额
    const currentBalance = await this.getBalance(userId);

    // 转换为易读的格式
    const statistics: any = {
      currentBalance,
      totalRecharge: 0,
      totalBonus: 0,
      totalDeduct: 0,
      totalRefund: 0,
    };

    stats.forEach((stat) => {
      const amount = stat._sum.amount || 0;
      switch (stat.type) {
        case TransactionType.RECHARGE:
          statistics.totalRecharge = amount;
          break;
        case TransactionType.BONUS:
          statistics.totalBonus = amount;
          break;
        case TransactionType.DEDUCT:
          statistics.totalDeduct = Math.abs(amount); // 转为正数显示
          break;
        case TransactionType.REFUND:
          statistics.totalRefund = Math.abs(amount); // 转为正数显示
          break;
      }
    });

    return statistics;
  }
}

export default new CreditService();
