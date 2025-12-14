/**
 * 套餐服务
 * 负责套餐计划的查询和管理
 */
import prisma from '@/utils/prisma';
import { logger } from '@/utils/logger.util';

class PackageService {
  /**
   * 获取所有套餐列表
   */
  async getAllPackages() {
    try {
      const packages = await prisma.packagePlan.findMany({
        where: {
          active: true,
        },
        orderBy: {
          sortOrder: 'asc',
        },
      });

      logger.info(`Found ${packages.length} active packages`);
      return packages;
    } catch (error) {
      logger.error('Error fetching packages:', error);
      throw new Error('获取套餐列表失败');
    }
  }

  /**
   * 根据 ID 获取套餐详情
   */
  async getPackageById(packageId: string) {
    try {
      const packagePlan = await prisma.packagePlan.findUnique({
        where: { id: packageId },
      });

      if (!packagePlan) {
        throw new Error('套餐不存在');
      }

      if (!packagePlan.active) {
        throw new Error('该套餐已下架');
      }

      return packagePlan;
    } catch (error) {
      logger.error(`Error fetching package ${packageId}:`, error);
      throw error;
    }
  }

  /**
   * 根据名称搜索套餐
   */
  async getPackagesByType(type: string) {
    try {
      const packages = await prisma.packagePlan.findMany({
        where: {
          active: true,
          name: {
            contains: type,
          },
        },
        orderBy: {
          sortOrder: 'asc',
        },
      });

      return packages;
    } catch (error) {
      logger.error(`Error fetching packages by type ${type}:`, error);
      throw new Error('获取套餐失败');
    }
  }

  /**
   * 创建套餐（管理员功能）
   */
  async createPackage(data: {
    name: string;
    price: string;
    creditAmount: number;
    bonusCredit?: number;
    desc?: string;
    sortOrder?: number;
  }) {
    try {
      const newPackage = await prisma.packagePlan.create({
        data: {
          name: data.name,
          price: data.price,
          creditAmount: data.creditAmount,
          bonusCredit: data.bonusCredit || 0,
          desc: data.desc,
          sortOrder: data.sortOrder || 0,
          active: true,
        },
      });

      logger.info(`Created new package: ${newPackage.name}`);
      return newPackage;
    } catch (error) {
      logger.error('Error creating package:', error);
      throw new Error('创建套餐失败');
    }
  }

  /**
   * 更新套餐（管理员功能）
   */
  async updatePackage(
    packageId: string,
    data: {
      name?: string;
      price?: string;
      creditAmount?: number;
      bonusCredit?: number;
      desc?: string;
      sortOrder?: number;
      active?: boolean;
    }
  ) {
    try {
      const updatedPackage = await prisma.packagePlan.update({
        where: { id: packageId },
        data,
      });

      logger.info(`Updated package: ${packageId}`);
      return updatedPackage;
    } catch (error) {
      logger.error(`Error updating package ${packageId}:`, error);
      throw new Error('更新套餐失败');
    }
  }

  /**
   * 删除套餐（软删除，设置为不活跃）
   */
  async deletePackage(packageId: string) {
    try {
      await prisma.packagePlan.update({
        where: { id: packageId },
        data: { active: false },
      });

      logger.info(`Deleted (soft) package: ${packageId}`);
      return { success: true, message: '套餐已删除' };
    } catch (error) {
      logger.error(`Error deleting package ${packageId}:`, error);
      throw new Error('删除套餐失败');
    }
  }
}

export default new PackageService();
