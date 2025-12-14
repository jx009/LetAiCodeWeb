/**
 * 使用记录同步服务
 * 负责从 new-api 同步使用记录并扣除积分
 */
import cron from 'node-cron';
import prisma from '@/utils/prisma';
import newApiService from './newapi.service';
import creditService from './credit.service';
import { KeyStatus } from '@prisma/client';

interface UsageQueryParams {
  keyId?: string;
  startDate?: Date;
  endDate?: Date;
  model?: string;
  page?: number;
  pageSize?: number;
}

class UsageService {
  private syncScheduler: cron.ScheduledTask | null = null;

  /**
   * 初始化定时同步任务（每5分钟执行一次）
   */
  initSyncScheduler() {
    if (this.syncScheduler) {
      console.log('[Usage Sync] Scheduler already running');
      return;
    }

    this.syncScheduler = cron.schedule('*/5 * * * *', async () => {
      console.log('[Usage Sync] Starting sync...');
      try {
        await this.syncAllKeys();
        console.log('[Usage Sync] Sync completed');
      } catch (error) {
        console.error('[Usage Sync] Sync failed:', error);
      }
    });

    console.log('[Usage Sync] Scheduler initialized (runs every 5 minutes)');
  }

  /**
   * 停止定时同步任务
   */
  stopSyncScheduler() {
    if (this.syncScheduler) {
      this.syncScheduler.stop();
      this.syncScheduler = null;
      console.log('[Usage Sync] Scheduler stopped');
    }
  }

  /**
   * 同步所有激活的 Key
   */
  async syncAllKeys() {
    const activeKeys = await prisma.apiKey.findMany({
      where: { status: KeyStatus.ACTIVE },
      include: { user: true },
    });

    console.log(`[Usage Sync] Found ${activeKeys.length} active keys`);

    for (const key of activeKeys) {
      if (!key.remoteKeyId) {
        console.log(`[Usage Sync] Key ${key.id} has no remoteKeyId, skipping`);
        continue;
      }

      try {
        await this.syncKeyUsage(key.id, parseInt(key.remoteKeyId, 10));
      } catch (error: any) {
        console.error(`[Usage Sync] Key ${key.id} sync failed:`, error.message);
      }
    }
  }

  /**
   * 同步单个 Key 的使用记录
   * @param keyId Key ID
   * @param remoteKeyId new-api 中的 Token ID
   */
  async syncKeyUsage(keyId: string, remoteKeyId: number) {
    // 1. 获取最后同步的记录时间
    const lastRecord = await prisma.usageRecord.findFirst({
      where: { apiKeyId: keyId },
      orderBy: { timestamp: 'desc' },
    });

    const startTime = lastRecord ? lastRecord.timestamp : new Date(0);

    console.log(
      `[Usage Sync] Syncing key ${keyId} from ${startTime.toISOString()}`
    );

    // 2. 从 new-api 拉取新记录
    const logs = await newApiService.getTokenUsage(remoteKeyId, startTime);

    if (logs.length === 0) {
      console.log(`[Usage Sync] No new records for key ${keyId}`);
      return;
    }

    console.log(`[Usage Sync] Found ${logs.length} new records for key ${keyId}`);

    // 3. 处理并存储每条记录
    for (const log of logs) {
      try {
        await this.processUsageLog(keyId, log);
      } catch (error: any) {
        console.error(
          `[Usage Sync] Failed to process log for key ${keyId}:`,
          error.message
        );
      }
    }

    // 4. 更新 Key 的最后使用时间
    await prisma.apiKey.update({
      where: { id: keyId },
      data: { lastUsedAt: new Date() },
    });
  }

  /**
   * 处理单条使用记录
   * @param keyId Key ID
   * @param log new-api 日志记录
   */
  async processUsageLog(keyId: string, log: any) {
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: keyId },
      include: { user: true },
    });

    if (!apiKey) {
      throw new Error(`API Key ${keyId} not found`);
    }

    // 计算 tokens 和积分消耗
    const promptTokens = log.prompt_tokens || 0;
    const completionTokens = log.completion_tokens || 0;
    const totalTokens = promptTokens + completionTokens;
    const creditCost = Math.ceil(totalTokens / 1000); // 每1000 tokens = 1积分

    await prisma.$transaction(async (tx: any) => {
      // 1. 检查是否已存在（防止重复）
      const existing = await tx.usageRecord.findFirst({
        where: {
          apiKeyId: keyId,
          timestamp: new Date(log.created_at * 1000),
          model: log.model_name || 'unknown',
          totalTokens,
        },
      });

      if (existing) {
        console.log(`[Usage Sync] Record already exists, skipping`);
        return;
      }

      // 2. 创建使用记录
      const usageRecord = await tx.usageRecord.create({
        data: {
          apiKeyId: keyId,
          timestamp: new Date(log.created_at * 1000),
          model: log.model_name || 'unknown',
          promptTokens,
          completionTokens,
          totalTokens,
          creditCost,
          rawMeta: JSON.stringify(log),
        },
      });

      // 3. 扣除积分
      await creditService.deductCredit({
        userId: apiKey.userId,
        apiKeyId: keyId,
        tokens: totalTokens,
        model: log.model_name || 'unknown',
        usageRecordId: usageRecord.id,
      });
    });

    console.log(
      `[Usage Sync] Processed record: ${totalTokens} tokens, ${creditCost} credits`
    );
  }

  /**
   * 手动触发同步
   * @param userId 用户 ID（可选，只同步该用户的 Keys）
   */
  async manualSync(userId?: string) {
    const where: any = { status: KeyStatus.ACTIVE };
    if (userId) {
      where.userId = userId;
    }

    const keys = await prisma.apiKey.findMany({
      where,
      include: { user: true },
    });

    for (const key of keys) {
      if (!key.remoteKeyId) continue;

      try {
        await this.syncKeyUsage(key.id, parseInt(key.remoteKeyId, 10));
      } catch (error: any) {
        console.error(`[Manual Sync] Key ${key.id} failed:`, error.message);
      }
    }

    return {
      synced: keys.length,
      message: 'Manual sync completed',
    };
  }

  /**
   * 获取使用记录
   * @param userId 用户 ID
   * @param params 查询参数
   * @returns 使用记录列表
   */
  async getUsageRecords(userId: string, params: UsageQueryParams = {}) {
    const {
      keyId,
      startDate,
      endDate,
      model,
      page = 1,
      pageSize = 20,
    } = params;

    // 构建查询条件
    const where: any = {
      apiKey: {
        userId, // 确保只能查询自己的记录
      },
    };

    if (keyId) {
      where.apiKeyId = keyId;
    }

    if (model) {
      where.model = model;
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = startDate;
      }
      if (endDate) {
        where.timestamp.lte = endDate;
      }
    }

    // 获取总数
    const total = await prisma.usageRecord.count({ where });

    // 获取记录
    const records = await prisma.usageRecord.findMany({
      where,
      include: {
        apiKey: {
          select: {
            id: true,
            label: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 获取统计信息
    const summary = await prisma.usageRecord.aggregate({
      where,
      _sum: {
        totalTokens: true,
        creditCost: true,
      },
    });

    return {
      records,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      summary: {
        totalTokens: summary._sum.totalTokens || 0,
        totalCreditCost: summary._sum.creditCost || 0,
      },
    };
  }

  /**
   * 获取使用统计（按模型分组）
   * @param userId 用户 ID
   * @param startDate 开始日期（可选）
   * @param endDate 结束日期（可选）
   * @returns 统计数据
   */
  async getUsageStatistics(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const where: any = {
      apiKey: {
        userId,
      },
    };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = startDate;
      }
      if (endDate) {
        where.timestamp.lte = endDate;
      }
    }

    // 按模型分组统计
    const stats = await prisma.usageRecord.groupBy({
      by: ['model'],
      where,
      _sum: {
        totalTokens: true,
        creditCost: true,
      },
      _count: {
        id: true,
      },
    });

    // 转换为易读格式
    const statistics = stats.map((stat: any) => ({
      model: stat.model,
      totalTokens: stat._sum.totalTokens || 0,
      totalCreditCost: stat._sum.creditCost || 0,
      requestCount: stat._count.id,
    }));

    // 总计
    const total = await prisma.usageRecord.aggregate({
      where,
      _sum: {
        totalTokens: true,
        creditCost: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      byModel: statistics,
      total: {
        totalTokens: total._sum.totalTokens || 0,
        totalCreditCost: total._sum.creditCost || 0,
        requestCount: total._count.id,
      },
    };
  }
}

export default new UsageService();
