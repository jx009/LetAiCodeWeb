/**
 * 管理员服务 - 用户管理
 * 参考 new-api 的用户管理逻辑
 */
import prisma from '@/utils/prisma';
import { UserRole } from '@prisma/client';
import { logger } from '@/utils/logger.util';

class AdminService {
  /**
   * 获取用户列表（分页）
   */
  async getUsers(params: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    role?: UserRole;
    status?: number;
  }) {
    const { page = 1, pageSize = 20, keyword, role, status } = params;

    const where: any = {};

    // 关键词搜索（邮箱或姓名）
    if (keyword) {
      where.OR = [
        { email: { contains: keyword } },
        { name: { contains: keyword } },
      ];
    }

    // 角色筛选
    if (role) {
      where.role = role;
    }

    // 状态筛选
    if (status !== undefined) {
      where.status = status;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              apiKeys: true,
              creditTransactions: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 获取单个用户详情
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            apiKeys: true,
            creditTransactions: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 获取用户余额
    const lastTransaction = await prisma.creditTransaction.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      ...user,
      balance: lastTransaction?.balance || 0,
    };
  }

  /**
   * 更新用户信息
   */
  async updateUser(
    adminId: string,
    adminRole: UserRole,
    userId: string,
    data: {
      name?: string;
      email?: string;
      role?: UserRole;
      status?: number;
    }
  ) {
    // 获取目标用户
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      throw new Error('用户不存在');
    }

    // 权限检查：不能操作同级或更高级别的用户（除非是超级管理员）
    if (adminRole !== UserRole.ROOT) {
      if (targetUser.role === UserRole.ROOT) {
        throw new Error('无权修改超级管理员');
      }
      if (targetUser.role === UserRole.ADMIN && adminRole === UserRole.ADMIN) {
        throw new Error('无权修改管理员');
      }
    }

    // 特殊保护：不能禁用超级管理员
    if (targetUser.role === UserRole.ROOT && data.status === 0) {
      throw new Error('不能禁用超级管理员');
    }

    // 特殊保护：只有超级管理员可以提升/降级用户角色
    if (data.role && data.role !== targetUser.role && adminRole !== UserRole.ROOT) {
      throw new Error('只有超级管理员可以修改用户角色');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
    });

    logger.info(`User ${userId} updated by admin ${adminId}`);

    return updatedUser;
  }

  /**
   * 启用/禁用用户
   */
  async toggleUserStatus(
    adminId: string,
    adminRole: UserRole,
    userId: string,
    status: number
  ) {
    return this.updateUser(adminId, adminRole, userId, { status });
  }

  /**
   * 提升用户为管理员
   */
  async promoteUser(adminId: string, userId: string) {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      throw new Error('用户不存在');
    }

    if (targetUser.role === UserRole.ADMIN || targetUser.role === UserRole.ROOT) {
      throw new Error('用户已经是管理员');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: UserRole.ADMIN },
    });

    logger.info(`User ${userId} promoted to ADMIN by ${adminId}`);

    return updatedUser;
  }

  /**
   * 降级管理员为普通用户
   */
  async demoteUser(adminId: string, userId: string) {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      throw new Error('用户不存在');
    }

    if (targetUser.role === UserRole.ROOT) {
      throw new Error('不能降级超级管理员');
    }

    if (targetUser.role === UserRole.USER) {
      throw new Error('用户已经是普通用户');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: UserRole.USER },
    });

    logger.info(`User ${userId} demoted to USER by ${adminId}`);

    return updatedUser;
  }

  /**
   * 删除用户
   */
  async deleteUser(adminId: string, adminRole: UserRole, userId: string) {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      throw new Error('用户不存在');
    }

    // 权限检查
    if (adminRole !== UserRole.ROOT && targetUser.role !== UserRole.USER) {
      throw new Error('只有超级管理员可以删除管理员账户');
    }

    // 不能删除超级管理员
    if (targetUser.role === UserRole.ROOT) {
      throw new Error('不能删除超级管理员');
    }

    // 不能删除自己
    if (userId === adminId) {
      throw new Error('不能删除自己的账户');
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    logger.info(`User ${userId} deleted by admin ${adminId}`);
  }

  /**
   * 获取用户统计信息
   */
  async getUserStats() {
    const [total, activeUsers, admins, rootUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 1 } }),
      prisma.user.count({ where: { role: UserRole.ADMIN } }),
      prisma.user.count({ where: { role: UserRole.ROOT } }),
    ]);

    // 获取最近7天新增用户
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    return {
      total,
      activeUsers,
      admins,
      rootUsers,
      recentUsers,
    };
  }

  /**
   * 获取所有订单列表（管理员）
   */
  async getAllOrders(params: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    status?: string;
  }) {
    const { page = 1, pageSize = 20, keyword, status } = params;
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: any = {};

    if (keyword) {
      where.OR = [
        { orderNo: { contains: keyword } },
        { user: { email: { contains: keyword } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.paymentOrder.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          package: true,
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      }),
      prisma.paymentOrder.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 获取订单统计信息
   */
  async getOrderStats() {
    const [total, pending, paid, cancelled] = await Promise.all([
      prisma.paymentOrder.count(),
      prisma.paymentOrder.count({ where: { status: 'PENDING' } }),
      prisma.paymentOrder.count({ where: { status: 'PAID' } }),
      prisma.paymentOrder.count({ where: { status: 'CANCELLED' } }),
    ]);

    // 计算总交易金额（已支付订单）- amount 是 String，需要手动计算
    const paidOrdersList = await prisma.paymentOrder.findMany({
      where: { status: 'PAID' },
      select: { amount: true },
    });

    const totalAmount = paidOrdersList
      .reduce((sum, order) => sum + parseFloat(order.amount || '0'), 0)
      .toFixed(2);

    return {
      total,
      pending,
      paid,
      cancelled,
      totalAmount: totalAmount.toString(),
    };
  }
}

export default new AdminService();
