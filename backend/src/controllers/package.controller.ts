/**
 * 套餐管理控制器
 */
import { Request, Response } from 'express';
import { packageService } from '@/services/package.service';
import { logger } from '@/utils/logger.util';
import { PackageCycle } from '@prisma/client';

/**
 * 获取所有套餐（按周期分组）
 * GET /api/packages/grouped
 */
export const getPackagesByCycle = async (req: Request, res: Response) => {
  try {
    const packages = await packageService.getPackagesByCycle(true);

    return res.json({
      success: true,
      data: packages,
    });
  } catch (error: any) {
    logger.error('Get packages by cycle error:', error);
    return res.status(500).json({
      success: false,
      message: '获取套餐列表失败',
      error: error.message,
    });
  }
};

/**
 * 获取所有套餐列表
 * GET /api/packages
 */
export const getAllPackages = async (req: Request, res: Response) => {
  try {
    const activeOnly = req.query.activeOnly !== 'false';
    const packages = await packageService.getAllPackages(activeOnly);

    return res.json({
      success: true,
      data: packages,
    });
  } catch (error: any) {
    logger.error('Get all packages error:', error);
    return res.status(500).json({
      success: false,
      message: '获取套餐列表失败',
      error: error.message,
    });
  }
};

/**
 * 获取单个套餐详情
 * GET /api/packages/:id
 */
export const getPackageById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pkg = await packageService.getPackageById(id);

    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: '套餐不存在',
      });
    }

    return res.json({
      success: true,
      data: pkg,
    });
  } catch (error: any) {
    logger.error('Get package by id error:', error);
    return res.status(500).json({
      success: false,
      message: '获取套餐详情失败',
      error: error.message,
    });
  }
};

/**
 * 创建套餐（管理员）
 * POST /api/admin/packages
 */
export const createPackage = async (req: Request, res: Response) => {
  try {
    const { name, cycle, price, baseCredits, replenishCredits, desc, sortOrder, active, recommended } =
      req.body;

    // 验证必填字段
    if (!name || !cycle || price === undefined || baseCredits === undefined || replenishCredits === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段',
      });
    }

    // 验证周期类型
    if (!Object.values(PackageCycle).includes(cycle)) {
      return res.status(400).json({
        success: false,
        message: '无效的周期类型',
      });
    }

    const pkg = await packageService.createPackage({
      name,
      cycle,
      price: Number(price),
      baseCredits: Number(baseCredits),
      replenishCredits: Number(replenishCredits),
      desc,
      sortOrder: sortOrder ? Number(sortOrder) : 0,
      active: active !== false,
      recommended: recommended === true,
    });

    return res.status(201).json({
      success: true,
      message: '套餐创建成功',
      data: pkg,
    });
  } catch (error: any) {
    logger.error('Create package error:', error);
    return res.status(500).json({
      success: false,
      message: '创建套餐失败',
      error: error.message,
    });
  }
};

/**
 * 更新套餐（管理员）
 * PUT /api/admin/packages/:id
 */
export const updatePackage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, cycle, price, baseCredits, replenishCredits, desc, sortOrder, active, recommended } =
      req.body;

    // 验证周期类型（如果提供）
    if (cycle && !Object.values(PackageCycle).includes(cycle)) {
      return res.status(400).json({
        success: false,
        message: '无效的周期类型',
      });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (cycle !== undefined) updateData.cycle = cycle;
    if (price !== undefined) updateData.price = Number(price);
    if (baseCredits !== undefined) updateData.baseCredits = Number(baseCredits);
    if (replenishCredits !== undefined) updateData.replenishCredits = Number(replenishCredits);
    if (desc !== undefined) updateData.desc = desc;
    if (sortOrder !== undefined) updateData.sortOrder = Number(sortOrder);
    if (active !== undefined) updateData.active = active;
    if (recommended !== undefined) updateData.recommended = recommended;

    const pkg = await packageService.updatePackage(id, updateData);

    return res.json({
      success: true,
      message: '套餐更新成功',
      data: pkg,
    });
  } catch (error: any) {
    logger.error('Update package error:', error);
    return res.status(500).json({
      success: false,
      message: '更新套餐失败',
      error: error.message,
    });
  }
};

/**
 * 删除套餐（管理员）
 * DELETE /api/admin/packages/:id
 */
export const deletePackage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await packageService.deletePackage(id);

    return res.json({
      success: true,
      message: '套餐删除成功',
    });
  } catch (error: any) {
    logger.error('Delete package error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || '删除套餐失败',
    });
  }
};

/**
 * 切换套餐激活状态（管理员）
 * PATCH /api/admin/packages/:id/toggle
 */
export const togglePackageActive = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const pkg = await packageService.togglePackageActive(id);

    return res.json({
      success: true,
      message: pkg.active ? '套餐已启用' : '套餐已禁用',
      data: pkg,
    });
  } catch (error: any) {
    logger.error('Toggle package active error:', error);
    return res.status(500).json({
      success: false,
      message: '操作失败',
      error: error.message,
    });
  }
};

/**
 * 获取套餐统计（管理员）
 * GET /api/admin/packages/stats
 */
export const getPackageStats = async (req: Request, res: Response) => {
  try {
    const stats = await packageService.getPackageStats();

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    logger.error('Get package stats error:', error);
    return res.status(500).json({
      success: false,
      message: '获取统计信息失败',
      error: error.message,
    });
  }
};
