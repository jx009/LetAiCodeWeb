/**
 * Webhook 处理服务
 * 负责处理来自 new-api 的 webhook 事件
 */
import prisma from '@/utils/prisma';
import { creditBalanceService } from './credit-balance.service';
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
    cost: number;  // 美元金额（从 new-api 获取）
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
    cost: number;  // 美元金额
  }): Promise<void> {
    const { remoteKeyId, model, totalTokens, cost } = data;

    // 1. 根据 remoteKeyId 找到对应的 API Key
    const apiKey = await prisma.apiKey.findFirst({
      where: { remoteKeyId },
    });

    if (!apiKey) {
      throw new Error(`API Key not found for remoteKeyId: ${remoteKeyId}`);
    }

    // 2. 创建使用记录
    const usageRecord = await prisma.usageRecord.create({
      data: {
        apiKeyId: apiKey.id,
        model,
        promptTokens: data.promptTokens,
        completionTokens: data.completionTokens,
        totalTokens,
        creditCost: 0, // 先设为0，后面更新
        costUsd: cost,
        timestamp: new Date(),
      },
    });

    // 3. 使用新的积分系统扣除积分
    const deductResult = await creditBalanceService.deductCreditsFromUsd(
      apiKey.userId,
      cost,
      `API 调用扣费（${model}，$${cost.toFixed(6)}）`,
      usageRecord.id
    );

    // 4. 更新使用记录的积分消耗
    await prisma.usageRecord.update({
      where: { id: usageRecord.id },
      data: { creditCost: deductResult.creditCost },
    });

    // 5. 如果扣除失败，记录但不抛出错误（已经调用了API，需要记录）
    if (!deductResult.success) {
      console.warn(
        `[WebhookService] Failed to deduct credits for user ${apiKey.userId}: ${deductResult.message}`
      );
      // 注意：这里不抛出错误，因为 API 调用已经发生
      // 积分不足的情况会在下次调用前检查
    }

    // 6. 更新 API Key 的最后使用时间
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
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