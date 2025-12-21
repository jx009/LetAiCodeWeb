/**
 * 系统配置管理控制器
 * 只有超级管理员可以访问
 */
import { Request, Response } from 'express';
import optionService from '@/services/option.service';
import { logger } from '@/utils/logger.util';

/**
 * 获取所有配置项
 * GET /api/options
 */
export const getOptions = async (req: Request, res: Response) => {
  try {
    const options = await optionService.getAllOptions(false); // 不包含敏感信息

    return res.json({
      success: true,
      data: options,
    });
  } catch (error: any) {
    logger.error('Get options error:', error);
    return res.status(500).json({
      success: false,
      message: '获取配置失败',
      error: error.message,
    });
  }
};

/**
 * 获取单个配置项
 * GET /api/options/:key
 */
export const getOption = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;

    const value = await optionService.getOption(key);

    if (value === null) {
      return res.status(404).json({
        success: false,
        message: '配置项不存在',
      });
    }

    // 检查是否为敏感配置
    const isSensitive = key.endsWith('Secret') || key.endsWith('Token') || key.endsWith('Key');

    return res.json({
      success: true,
      data: {
        key,
        value: isSensitive ? '***' : value,
        isSensitive,
      },
    });
  } catch (error: any) {
    logger.error('Get option error:', error);
    return res.status(500).json({
      success: false,
      message: '获取配置失败',
      error: error.message,
    });
  }
};

/**
 * 更新配置项
 * PUT /api/options/:key
 */
export const updateOption = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { value, desc } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少配置值',
      });
    }

    await optionService.updateOption(key, value, desc);

    return res.json({
      success: true,
      message: '配置已更新',
    });
  } catch (error: any) {
    logger.error('Update option error:', error);
    return res.status(500).json({
      success: false,
      message: '更新配置失败',
      error: error.message,
    });
  }
};

/**
 * 批量更新配置项
 * PUT /api/options
 */
export const updateOptions = async (req: Request, res: Response) => {
  try {
    const { options } = req.body;

    if (!Array.isArray(options)) {
      return res.status(400).json({
        success: false,
        message: '配置项格式错误',
      });
    }

    await optionService.updateOptions(options);

    return res.json({
      success: true,
      message: `已更新 ${options.length} 个配置项`,
    });
  } catch (error: any) {
    logger.error('Batch update options error:', error);
    return res.status(500).json({
      success: false,
      message: '批量更新配置失败',
      error: error.message,
    });
  }
};

/**
 * 删除配置项
 * DELETE /api/options/:key
 */
export const deleteOption = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;

    await optionService.deleteOption(key);

    return res.json({
      success: true,
      message: '配置已删除',
    });
  } catch (error: any) {
    logger.error('Delete option error:', error);
    return res.status(500).json({
      success: false,
      message: '删除配置失败',
      error: error.message,
    });
  }
};

/**
 * 获取支付配置
 * GET /api/options/payment/config
 */
export const getPaymentConfig = async (req: Request, res: Response) => {
  try {
    const config = await optionService.getPaymentConfig();

    return res.json({
      success: true,
      data: config,
    });
  } catch (error: any) {
    logger.error('Get payment config error:', error);
    return res.status(500).json({
      success: false,
      message: '获取支付配置失败',
      error: error.message,
    });
  }
};

/**
 * 更新支付配置
 * PUT /api/options/payment/config
 */
export const updatePaymentConfig = async (req: Request, res: Response) => {
  try {
    const config = req.body;

    await optionService.updatePaymentConfig(config);

    return res.json({
      success: true,
      message: '支付配置已更新',
    });
  } catch (error: any) {
    logger.error('Update payment config error:', error);
    return res.status(500).json({
      success: false,
      message: '更新支付配置失败',
      error: error.message,
    });
  }
};

/**
 * 验证支付配置
 * GET /api/options/payment/validate
 */
export const validatePaymentConfig = async (req: Request, res: Response) => {
  try {
    const result = await optionService.validatePaymentConfig();

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Validate payment config error:', error);
    return res.status(500).json({
      success: false,
      message: '验证支付配置失败',
      error: error.message,
    });
  }
};

/**
 * 获取积分配置
 * GET /api/options/credit/config
 */
export const getCreditConfig = async (req: Request, res: Response) => {
  try {
    const config = await optionService.getCreditConfig();

    return res.json({
      success: true,
      data: config,
    });
  } catch (error: any) {
    logger.error('Get credit config error:', error);
    return res.status(500).json({
      success: false,
      message: '获取积分配置失败',
      error: error.message,
    });
  }
};

/**
 * 更新积分配置
 * PUT /api/options/credit/config
 */
export const updateCreditConfig = async (req: Request, res: Response) => {
  try {
    const config = req.body;

    await optionService.updateCreditConfig(config);

    return res.json({
      success: true,
      message: '积分配置已更新',
    });
  } catch (error: any) {
    logger.error('Update credit config error:', error);
    return res.status(500).json({
      success: false,
      message: '更新积分配置失败',
      error: error.message,
    });
  }
};
