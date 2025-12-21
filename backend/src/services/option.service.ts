/**
 * 系统配置管理服务
 * 参考 new-api 的 Option 表设计
 */
import prisma from '@/utils/prisma';
import { logger } from '@/utils/logger.util';

class OptionService {
  // 内存缓存配置（提高性能）
  private optionCache: Map<string, string> = new Map();
  private cacheInitialized = false;

  /**
   * 初始化缓存（从数据库加载所有配置）
   */
  async initCache(): Promise<void> {
    try {
      const options = await prisma.option.findMany();
      this.optionCache.clear();

      for (const option of options) {
        this.optionCache.set(option.key, option.value);
      }

      this.cacheInitialized = true;
      logger.info(`Loaded ${options.length} options into cache`);
    } catch (error) {
      logger.error('Failed to initialize option cache:', error);
      throw error;
    }
  }

  /**
   * 获取单个配置项
   */
  async getOption(key: string): Promise<string | null> {
    // 确保缓存已初始化
    if (!this.cacheInitialized) {
      await this.initCache();
    }

    return this.optionCache.get(key) || null;
  }

  /**
   * 获取所有配置项（排除敏感信息）
   */
  async getAllOptions(includeSensitive = false): Promise<Record<string, string>> {
    if (!this.cacheInitialized) {
      await this.initCache();
    }

    const result: Record<string, string> = {};

    for (const [key, value] of this.optionCache.entries()) {
      // 排除敏感配置（以 Secret/Token/Key 结尾）
      if (!includeSensitive) {
        if (key.endsWith('Secret') || key.endsWith('Token') || key.endsWith('Key')) {
          result[key] = '***'; // 脱敏显示
          continue;
        }
      }

      result[key] = value;
    }

    return result;
  }

  /**
   * 更新配置项
   */
  async updateOption(key: string, value: string, desc?: string): Promise<void> {
    try {
      // 更新数据库
      await prisma.option.upsert({
        where: { key },
        update: { value, desc, updatedAt: new Date() },
        create: { key, value, desc },
      });

      // 更新缓存
      this.optionCache.set(key, value);

      logger.info(`Option updated: ${key}`);
    } catch (error) {
      logger.error(`Failed to update option ${key}:`, error);
      throw error;
    }
  }

  /**
   * 批量更新配置项
   */
  async updateOptions(options: Array<{ key: string; value: string; desc?: string }>): Promise<void> {
    try {
      for (const option of options) {
        await this.updateOption(option.key, option.value, option.desc);
      }

      logger.info(`Batch updated ${options.length} options`);
    } catch (error) {
      logger.error('Failed to batch update options:', error);
      throw error;
    }
  }

  /**
   * 删除配置项
   */
  async deleteOption(key: string): Promise<void> {
    try {
      await prisma.option.delete({
        where: { key },
      });

      this.optionCache.delete(key);

      logger.info(`Option deleted: ${key}`);
    } catch (error) {
      logger.error(`Failed to delete option ${key}:`, error);
      throw error;
    }
  }

  /**
   * 获取支付配置
   */
  async getPaymentConfig() {
    return {
      payAddress: await this.getOption('PayAddress') || '',
      epayId: await this.getOption('EpayId') || '',
      epayKey: await this.getOption('EpayKey') || '',
      minTopUp: parseInt(await this.getOption('MinTopUp') || '1'),
      payMethods: JSON.parse(await this.getOption('PayMethods') || '[]'),
    };
  }

  /**
   * 更新支付配置
   */
  async updatePaymentConfig(config: {
    payAddress?: string;
    epayId?: string;
    epayKey?: string;
    minTopUp?: number;
    payMethods?: any[];
  }): Promise<void> {
    const updates: Array<{ key: string; value: string; desc?: string }> = [];

    if (config.payAddress !== undefined) {
      updates.push({ key: 'PayAddress', value: config.payAddress, desc: '易支付网关地址' });
    }
    if (config.epayId !== undefined) {
      updates.push({ key: 'EpayId', value: config.epayId, desc: '易支付商户ID' });
    }
    if (config.epayKey !== undefined) {
      updates.push({ key: 'EpayKey', value: config.epayKey, desc: '易支付商户密钥' });
    }
    if (config.minTopUp !== undefined) {
      updates.push({ key: 'MinTopUp', value: config.minTopUp.toString(), desc: '最小充值金额' });
    }
    if (config.payMethods !== undefined) {
      updates.push({ key: 'PayMethods', value: JSON.stringify(config.payMethods), desc: '支付方式配置' });
    }

    await this.updateOptions(updates);
  }

  /**
   * 验证支付配置是否完整
   */
  async validatePaymentConfig(): Promise<{ valid: boolean; message?: string }> {
    const config = await this.getPaymentConfig();

    if (!config.payAddress) {
      return { valid: false, message: '请配置易支付网关地址' };
    }
    if (!config.epayId) {
      return { valid: false, message: '请配置易支付商户ID' };
    }
    if (!config.epayKey) {
      return { valid: false, message: '请配置易支付商户密钥' };
    }
    if (config.payMethods.length === 0) {
      return { valid: false, message: '请至少配置一种支付方式' };
    }

    return { valid: true };
  }

  /**
   * 获取积分配置
   */
  async getCreditConfig() {
    return {
      // 美元兑积分汇率（1美元 = X积分），默认 1000
      usdToCreditsRate: parseFloat(await this.getOption('UsdToCreditsRate') || '1000'),
      // 新用户赠送积分
      freeQuota: parseInt(await this.getOption('FreeQuota') || '10000'),
    };
  }

  /**
   * 更新积分配置
   */
  async updateCreditConfig(config: {
    usdToCreditsRate?: number;
    freeQuota?: number;
  }): Promise<void> {
    const updates: Array<{ key: string; value: string; desc?: string }> = [];

    if (config.usdToCreditsRate !== undefined) {
      updates.push({
        key: 'UsdToCreditsRate',
        value: config.usdToCreditsRate.toString(),
        desc: '美元兑积分汇率（1美元=X积分）'
      });
    }
    if (config.freeQuota !== undefined) {
      updates.push({
        key: 'FreeQuota',
        value: config.freeQuota.toString(),
        desc: '新用户赠送积分'
      });
    }

    await this.updateOptions(updates);
  }

  /**
   * 根据美元金额计算积分消耗
   * @param usdAmount 美元金额
   * @returns 积分数量
   */
  async calculateCreditsFromUsd(usdAmount: number): Promise<number> {
    const config = await this.getCreditConfig();
    // 四舍五入到整数
    return Math.round(usdAmount * config.usdToCreditsRate);
  }
}

export default new OptionService();
