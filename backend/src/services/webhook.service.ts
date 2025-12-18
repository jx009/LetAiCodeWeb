/**
 * Webhook 处理服务
 * 负责处理来自 new-api 的 webhook 事件
 */
import prisma from '@/utils/prisma';
import creditService from './credit.service';
import { TransactionType } from '@prisma/client';
import crypto from 'crypto';

interface WebhookPayload {
  eventId: string;
  eventType: string;
  timestamp: number;
  data: {
    remoteKeyId: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    creditCost: number;
  };
}

class WebhookService {
  /**
   * 验证 webhook 签名
   * @param payload 原始 payload 字符串
   * @param signature 签名
   * @param secret 密钥
   * @returns 签名是否有效
   */
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const hash = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    return hash === signature;
  }

  /**
   * 处理 webhook 事件
   * @param payload webhook 负载
   * @returns 处理结果
   */
  async handleWebhookEvent(payload: WebhookPayload): Promise<{
    success: boolean;
    message: string;
  }> {
    const { eventId, eventType, data } = payload;

    // 1. 检查幂等性 - 检查 eventId 是否已处理
    const existingLog = await prisma.webhookLog.findUnique({
      where: { eventId },
    });

    if (existingLog) {
      // 如果已处理过，直接返回成功（幂等性处理）
      if (existingLog.status === 'processed') {
        return {
          success: true,
          message: 'Event already processed (idempotent)',
        };
      }
      // 如果之前处理失败，重试
    }

    try {
      // 2. 根据事件类型处理
      switch (eventType) {
        case 'usage':
          await this.handleUsageEvent(data);
          break;
        default:
          throw new Error(`Unknown event type: ${eventType}`);
      }

      // 3. 记录成功的 webhook
      await prisma.webhookLog.upsert({
        where: { eventId },
        update: {
          status: 'processed',
          errorMsg: null,
          processedAt: new Date(),
        },
        create: {
          eventId,
          payload: JSON.stringify(payload),
          status: 'processed',
          processedAt: new Date(),
        },
      });

      return {
        success: true,
        message: 'Event processed successfully',
      };
    } catch (error: any) {
      console.error('[WebhookService] Error processing webhook:', error);

      // 4. 记录失败的 webhook
      await prisma.webhookLog.upsert({
        where: { eventId },
        update: {
          status: 'failed',
          errorMsg: error.message,
          processedAt: new Date(),
        },
        create: {
          eventId,
          payload: JSON.stringify(payload),
          status: 'failed',
          errorMsg: error.message,
          processedAt: new Date(),
        },
      });

      throw error;
    }
  }

  /**
   * 处理使用事件
   * @param data 事件数据
   */
  private async handleUsageEvent(data: {
    remoteKeyId: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    creditCost: number;
  }): Promise<void> {
    const { remoteKeyId, model, totalTokens, creditCost } = data;

    // 1. 根据 remoteKeyId 找到对应的 API Key
    const apiKey = await prisma.apiKey.findFirst({
      where: { remoteKeyId },
    });

    if (!apiKey) {
      throw new Error(`API Key not found for remoteKeyId: ${remoteKeyId}`);
    }

    // 2. 创建使用记录和积分交易（事务）
    await prisma.$transaction(async (tx: any) => {
      // 2.1 创建使用记录
      const usageRecord = await tx.usageRecord.create({
        data: {
          apiKeyId: apiKey.id,
          model,
          promptTokens: data.promptTokens,
          completionTokens: data.completionTokens,
          totalTokens,
          creditCost,
          timestamp: new Date(),
        },
      });

      // 2.2 获取当前用户余额
      const lastTransaction = await tx.creditTransaction.findFirst({
        where: { userId: apiKey.userId },
        orderBy: { createdAt: 'desc' },
      });

      const currentBalance = lastTransaction?.balance || 0;

      // 2.3 检查余额是否足够
      if (currentBalance < creditCost) {
        throw new Error('用户积分余额不足');
      }

      // 2.4 计算新余额
      const newBalance = currentBalance - creditCost;

      // 2.5 创建积分扣费记录
      await tx.creditTransaction.create({
        data: {
          userId: apiKey.userId,
          type: TransactionType.DEDUCT,
          amount: -creditCost,
          balance: newBalance,
          ref: usageRecord.id,
          desc: `API 调用扣费（${model}，${totalTokens} tokens）`,
        },
      });

      // 2.6 更新 API Key 的最后使用时间
      await tx.apiKey.update({
        where: { id: apiKey.id },
        data: {
          lastUsedAt: new Date(),
        },
      });
    });
  }

  /**
   * 清理过期的 webhook 日志（7天以前）
   */
  async cleanupOldWebhookLogs(daysOld: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.webhookLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        status: 'processed', // 只删除已处理的日志
      },
    });

    return result.count;
  }
}

export default new WebhookService();