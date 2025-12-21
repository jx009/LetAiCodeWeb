/**
 * 订阅套餐管理服务
 * 负责套餐的增删改查、折扣计算等
 */
import prisma from '@/utils/prisma';
import { PackageCycle, Prisma } from '@prisma/client';
import { logger } from '@/utils/logger.util';

// 周期对应的天数
const CYCLE_DAYS: Record<PackageCycle, number> = {
  WEEK: 7,
  MONTH: 30,
  QUARTER: 90,
  YEAR: 365,
};

// 创建套餐参数
interface CreatePackageParams {
  name: string;
  cycle: PackageCycle;
  price: number;
  baseCredits: number;
  replenishCredits: number;
  desc?: string;
  sortOrder?: number;
  active?: boolean;
  recommended?: boolean;
}

// 更新套餐参数
interface UpdatePackageParams {
  name?: string;
  cycle?: PackageCycle;
  price?: number;
  baseCredits?: number;
  replenishCredits?: number;
  desc?: string;
  sortOrder?: number;
  active?: boolean;
  recommended?: boolean;
}

// 套餐详情（含折扣信息）
export interface PackageWithDiscount {
  id: string;
  name: string;
  cycle: PackageCycle;
  cycleDays: number;
  price: number;
  baseCredits: number;
  replenishCredits: number;
  desc: string | null;
  sortOrder: number;
  active: boolean;
  recommended: boolean;
  displayCredits: number; // 展示积分 = base*30 + replenish*24*30
  monthlyPrice: number; // 月均价格
  monthlySavings: number; // 相比月付省多少钱
  savingsPercentage: number; // 省钱百分比
}

class PackageService {
  /**
   * 获取所有套餐（按周期分组）
   */
  async getPackagesByCycle(activeOnly: boolean = true) {
    const where: Prisma.SubscriptionPackageWhereInput = activeOnly ? { active: true } : {};

    const packages = await prisma.subscriptionPackage.findMany({
      where,
      orderBy: [{ cycle: 'asc' }, { sortOrder: 'asc' }, { price: 'asc' }],
    });

    // 找到月付套餐用于计算折扣
    const monthPackages = packages.filter((p) => p.cycle === PackageCycle.MONTH);

    // 按周期分组
    const grouped: Record<PackageCycle, PackageWithDiscount[]> = {
      WEEK: [],
      MONTH: [],
      QUARTER: [],
      YEAR: [],
    };

    for (const pkg of packages) {
      const withDiscount = this.calculatePackageDiscount(pkg, monthPackages);
      grouped[pkg.cycle].push(withDiscount);
    }

    return grouped;
  }

  /**
   * 获取所有套餐列表（不分组）
   */
  async getAllPackages(activeOnly: boolean = true) {
    const where: Prisma.SubscriptionPackageWhereInput = activeOnly ? { active: true } : {};

    const packages = await prisma.subscriptionPackage.findMany({
      where,
      orderBy: [{ cycle: 'asc' }, { sortOrder: 'asc' }, { price: 'asc' }],
    });

    // 找到月付套餐用于计算折扣
    const monthPackages = packages.filter((p) => p.cycle === PackageCycle.MONTH);

    return packages.map((pkg) => this.calculatePackageDiscount(pkg, monthPackages));
  }

  /**
   * 获取单个套餐详情
   */
  async getPackageById(id: string): Promise<PackageWithDiscount | null> {
    const pkg = await prisma.subscriptionPackage.findUnique({
      where: { id },
    });

    if (!pkg) {
      return null;
    }

    // 获取月付套餐用于计算折扣
    const monthPackages = await prisma.subscriptionPackage.findMany({
      where: { cycle: PackageCycle.MONTH, active: true },
    });

    return this.calculatePackageDiscount(pkg, monthPackages);
  }

  /**
   * 创建套餐
   */
  async createPackage(params: CreatePackageParams) {
    const { name, cycle, price, baseCredits, replenishCredits, desc, sortOrder, active, recommended } =
      params;

    const cycleDays = CYCLE_DAYS[cycle];

    const pkg = await prisma.subscriptionPackage.create({
      data: {
        name,
        cycle,
        cycleDays,
        price: new Prisma.Decimal(price),
        baseCredits,
        replenishCredits,
        desc,
        sortOrder: sortOrder ?? 0,
        active: active ?? true,
        recommended: recommended ?? false,
      },
    });

    logger.info(`Created subscription package: ${pkg.id} - ${pkg.name}`);
    return pkg;
  }

  /**
   * 更新套餐
   */
  async updatePackage(id: string, params: UpdatePackageParams) {
    const { cycle, price, ...rest } = params;

    const data: Prisma.SubscriptionPackageUpdateInput = { ...rest };

    // 如果更新了周期，同时更新天数
    if (cycle) {
      data.cycle = cycle;
      data.cycleDays = CYCLE_DAYS[cycle];
    }

    // 处理 price 类型转换
    if (price !== undefined) {
      data.price = new Prisma.Decimal(price);
    }

    const pkg = await prisma.subscriptionPackage.update({
      where: { id },
      data,
    });

    logger.info(`Updated subscription package: ${pkg.id} - ${pkg.name}`);
    return pkg;
  }

  /**
   * 删除套餐
   */
  async deletePackage(id: string) {
    // 检查是否有关联的订阅或订单
    const [subscriptionCount, orderCount] = await Promise.all([
      prisma.userSubscription.count({ where: { packageId: id } }),
      prisma.paymentOrder.count({ where: { packageId: id } }),
    ]);

    if (subscriptionCount > 0 || orderCount > 0) {
      throw new Error('该套餐已有用户订阅或订单，无法删除。建议将其设为不可用。');
    }

    await prisma.subscriptionPackage.delete({
      where: { id },
    });

    logger.info(`Deleted subscription package: ${id}`);
  }

  /**
   * 切换套餐激活状态
   */
  async togglePackageActive(id: string) {
    const pkg = await prisma.subscriptionPackage.findUnique({
      where: { id },
    });

    if (!pkg) {
      throw new Error('套餐不存在');
    }

    const updated = await prisma.subscriptionPackage.update({
      where: { id },
      data: { active: !pkg.active },
    });

    logger.info(`Toggled package ${id} active status to ${updated.active}`);
    return updated;
  }

  /**
   * 计算套餐折扣信息
   */
  private calculatePackageDiscount(
    pkg: {
      id: string;
      name: string;
      cycle: PackageCycle;
      cycleDays: number;
      price: Prisma.Decimal;
      baseCredits: number;
      replenishCredits: number;
      desc: string | null;
      sortOrder: number;
      active: boolean;
      recommended: boolean;
    },
    monthPackages: Array<{ price: Prisma.Decimal; baseCredits: number; replenishCredits: number }>
  ): PackageWithDiscount {
    const price = pkg.price.toNumber();

    // 计算展示积分：基础积分 × 30 + 补充积分 × 24 × 30
    const displayCredits = pkg.baseCredits * 30 + pkg.replenishCredits * 24 * 30;

    // 计算月均价格
    const monthlyPrice = (price / pkg.cycleDays) * 30;

    // 找到最匹配的月付套餐（积分相近的）
    let monthlySavings = 0;
    let savingsPercentage = 0;

    if (pkg.cycle !== PackageCycle.MONTH && monthPackages.length > 0) {
      // 找到积分量最接近的月付套餐
      const matchedMonthPkg = monthPackages.reduce((closest, mp) => {
        const mpDisplayCredits = mp.baseCredits * 30 + mp.replenishCredits * 24 * 30;
        const closestDisplayCredits = closest.baseCredits * 30 + closest.replenishCredits * 24 * 30;

        const diffCurrent = Math.abs(mpDisplayCredits - displayCredits);
        const diffClosest = Math.abs(closestDisplayCredits - displayCredits);

        return diffCurrent < diffClosest ? mp : closest;
      }, monthPackages[0]);

      const monthBasePrice = matchedMonthPkg.price.toNumber();

      // 计算相比月付省多少
      monthlySavings = Math.max(0, monthBasePrice - monthlyPrice);
      savingsPercentage = monthBasePrice > 0 ? Math.round((monthlySavings / monthBasePrice) * 100) : 0;
    }

    return {
      id: pkg.id,
      name: pkg.name,
      cycle: pkg.cycle,
      cycleDays: pkg.cycleDays,
      price,
      baseCredits: pkg.baseCredits,
      replenishCredits: pkg.replenishCredits,
      desc: pkg.desc,
      sortOrder: pkg.sortOrder,
      active: pkg.active,
      recommended: pkg.recommended,
      displayCredits,
      monthlyPrice: Math.round(monthlyPrice * 100) / 100,
      monthlySavings: Math.round(monthlySavings * 100) / 100,
      savingsPercentage,
    };
  }

  /**
   * 获取套餐统计信息
   */
  async getPackageStats() {
    const [total, activeCount, subscriptionCounts] = await Promise.all([
      prisma.subscriptionPackage.count(),
      prisma.subscriptionPackage.count({ where: { active: true } }),
      prisma.userSubscription.groupBy({
        by: ['packageId'],
        where: { status: 'ACTIVE' },
        _count: true,
      }),
    ]);

    return {
      total,
      active: activeCount,
      inactive: total - activeCount,
      subscriptionsByPackage: subscriptionCounts,
    };
  }
}

export const packageService = new PackageService();
export default packageService;
