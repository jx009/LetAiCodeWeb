/**
 * API Keys 管理服务
 */
import prisma from '@/utils/prisma';
import newApiService from './newapi.service';
import { encrypt, decrypt } from '@/utils/crypto.util';
import { KeyStatus } from '@prisma/client';

interface CreateKeyParams {
  userId: string;
  label: string;
}

interface UpdateKeyStatusParams {
  status: KeyStatus;
}

class KeysService {
  /**
   * 创建新的 API Key
   * @param params 创建参数
   * @returns 创建的 Key 信息（包含完整的 Key，只返回一次）
   */
  async createKey(params: CreateKeyParams) {
    const { userId, label } = params;

    // 1. 调用 new-api 创建 Token
    const { key: fullKey, id: remoteKeyId } = await newApiService.createToken(userId, label);

    // 2. 加密完整 Key
    const encryptedKey = encrypt(fullKey);

    // 3. 生成脱敏值（sk-****...后4位）
    const maskedValue = `${fullKey.substring(0, 3)}****...${fullKey.slice(-4)}`;

    // 4. 存储到数据库
    const apiKey = await prisma.apiKey.create({
      data: {
        userId,
        label,
        remoteKeyId: remoteKeyId.toString(),
        fullValue: encryptedKey,
        maskedValue,
        status: KeyStatus.ACTIVE,
      },
    });

    return {
      ...apiKey,
      fullValue: fullKey, // 只在创建时返回完整 Key
    };
  }

  /**
   * 获取用户的所有 Key
   * @param userId 用户 ID
   * @returns Key 列表（不包含完整 Key）
   */
  async getUserKeys(userId: string) {
    const keys = await prisma.apiKey.findMany({
      where: {
        userId,
        status: {
          not: KeyStatus.DELETED, // 不包含已删除的 Key
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        userId: true,
        label: true,
        remoteKeyId: true,
        maskedValue: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastUsedAt: true,
      },
    });

    // 获取每个 Key 的使用统计
    const keysWithUsage = await Promise.all(
      keys.map(async (key: any) => {
        const usage = await this.getKeyUsage(key.id);
        return {
          ...key,
          usage,
        };
      })
    );

    return keysWithUsage;
  }

  /**
   * 获取 Key 详情
   * @param keyId Key ID
   * @param userId 用户 ID（用于权限验证）
   * @returns Key 详情（不包含完整 Key）
   */
  async getKeyById(keyId: string, userId: string) {
    const key = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        userId, // 确保只能访问自己的 Key
      },
      select: {
        id: true,
        userId: true,
        label: true,
        remoteKeyId: true,
        maskedValue: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastUsedAt: true,
      },
    });

    if (!key) {
      throw new Error('API Key not found or access denied');
    }

    // 获取使用统计
    const usage = await this.getKeyUsage(keyId);

    return {
      ...key,
      usage,
    };
  }

  /**
   * 更新 Key 状态（启用/禁用）
   * @param keyId Key ID
   * @param userId 用户 ID（用于权限验证）
   * @param params 更新参数
   */
  async updateKeyStatus(keyId: string, userId: string, params: UpdateKeyStatusParams) {
    const { status } = params;

    // 查找 Key
    const key = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        userId,
      },
    });

    if (!key) {
      throw new Error('API Key not found or access denied');
    }

    // 更新数据库状态
    const updatedKey = await prisma.apiKey.update({
      where: { id: keyId },
      data: { status },
      select: {
        id: true,
        userId: true,
        label: true,
        remoteKeyId: true,
        maskedValue: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastUsedAt: true,
      },
    });

    // 同步到 new-api（启用=1, 禁用=2）
    if (key.remoteKeyId) {
      try {
        await newApiService.updateTokenStatus(
          parseInt(key.remoteKeyId, 10),
          status === KeyStatus.ACTIVE ? 1 : 2
        );
      } catch (error) {
        console.error('[KeysService] Failed to sync status to new-api:', error);
        // 不抛出错误，继续执行（本地状态已更新）
      }
    }

    return updatedKey;
  }

  /**
   * 删除 Key（软删除）
   * @param keyId Key ID
   * @param userId 用户 ID（用于权限验证）
   */
  async deleteKey(keyId: string, userId: string) {
    // 查找 Key
    const key = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        userId,
      },
    });

    if (!key) {
      throw new Error('API Key not found or access denied');
    }

    // 软删除：更新状态为 DELETED
    await prisma.apiKey.update({
      where: { id: keyId },
      data: {
        status: KeyStatus.DELETED,
      },
    });

    // 从 new-api 删除
    if (key.remoteKeyId) {
      try {
        await newApiService.deleteToken(parseInt(key.remoteKeyId, 10));
      } catch (error) {
        console.error('[KeysService] Failed to delete key from new-api:', error);
        // 不抛出错误（本地已软删除）
      }
    }

    return { message: 'API Key deleted successfully' };
  }

  /**
   * 获取 Key 的使用统计
   * @param keyId Key ID
   * @returns 使用统计
   */
  async getKeyUsage(keyId: string) {
    const result = await prisma.usageRecord.aggregate({
      where: { apiKeyId: keyId },
      _sum: {
        totalTokens: true,
        creditCost: true,
      },
    });

    return {
      totalTokens: result._sum.totalTokens || 0,
      creditCost: result._sum.creditCost || 0,
    };
  }

  /**
   * 解密 Key（管理员功能，谨慎使用）
   * @param keyId Key ID
   * @param userId 用户 ID（用于权限验证）
   * @returns 完整的 Key
   */
  async decryptKey(keyId: string, userId: string): Promise<string> {
    const key = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        userId,
      },
      select: {
        fullValue: true,
      },
    });

    if (!key) {
      throw new Error('API Key not found or access denied');
    }

    return decrypt(key.fullValue);
  }

  /**
   * 更新 Key 的最后使用时间
   * @param keyId Key ID
   */
  async updateLastUsedAt(keyId: string) {
    await prisma.apiKey.update({
      where: { id: keyId },
      data: {
        lastUsedAt: new Date(),
      },
    });
  }
}

export default new KeysService();
