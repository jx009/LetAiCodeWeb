/**
 * 套餐控制器
 * 处理套餐相关的 HTTP 请求
 */
import { Request, Response } from 'express';
import packageService from '@/services/package.service';
import { logger } from '@/utils/logger.util';

class PackageController {
  /**
   * 获取所有套餐列表
   */
  async getAllPackages(req: Request, res: Response) {
    try {
      const { type } = req.query;

      let packages;
      if (type && typeof type === 'string') {
        packages = await packageService.getPackagesByType(type);
      } else {
        packages = await packageService.getAllPackages();
      }

      res.json({
        success: true,
        data: packages,
      });
    } catch (error: any) {
      logger.error('Error in getAllPackages:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取套餐列表失败',
      });
    }
  }

  /**
   * 获取套餐详情
   */
  async getPackageById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const packagePlan = await packageService.getPackageById(id);

      res.json({
        success: true,
        data: packagePlan,
      });
    } catch (error: any) {
      logger.error('Error in getPackageById:', error);
      res.status(404).json({
        success: false,
        message: error.message || '获取套餐详情失败',
      });
    }
  }

  /**
   * 创建套餐（管理员）
   */
  async createPackage(req: Request, res: Response) {
    try {
      const { name, price, creditAmount, bonusCredit, desc, sortOrder } = req.body;

      // 验证必填字段
      if (!name || !price || !creditAmount) {
        return res.status(400).json({
          success: false,
          message: '缺少必填字段：name, price, creditAmount',
        });
      }

      const newPackage = await packageService.createPackage({
        name,
        price,
        creditAmount,
        bonusCredit,
        desc,
        sortOrder,
      });

      res.status(201).json({
        success: true,
        message: '套餐创建成功',
        data: newPackage,
      });
    } catch (error: any) {
      logger.error('Error in createPackage:', error);
      res.status(500).json({
        success: false,
        message: error.message || '创建套餐失败',
      });
    }
  }

  /**
   * 更新套餐（管理员）
   */
  async updatePackage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const updatedPackage = await packageService.updatePackage(id, updates);

      res.json({
        success: true,
        message: '套餐更新成功',
        data: updatedPackage,
      });
    } catch (error: any) {
      logger.error('Error in updatePackage:', error);
      res.status(500).json({
        success: false,
        message: error.message || '更新套餐失败',
      });
    }
  }

  /**
   * 删除套餐（管理员）
   */
  async deletePackage(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await packageService.deletePackage(id);

      res.json({
        success: true,
        message: '套餐已删除',
      });
    } catch (error: any) {
      logger.error('Error in deletePackage:', error);
      res.status(500).json({
        success: false,
        message: error.message || '删除套餐失败',
      });
    }
  }
}

export default new PackageController();
