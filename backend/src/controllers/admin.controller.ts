/**
 * 管理员控制器 - 用户管理
 * 需要管理员或超级管理员权限
 */
import { Request, Response } from 'express';
import adminService from '@/services/admin.service';
import { UserRole } from '@prisma/client';
import { logger } from '@/utils/logger.util';

/**
 * 获取用户列表
 * GET /api/admin/users
 */
export const getUsers = async (req: Request, res: Response) => {
  try {
    const { page, pageSize, keyword, role, status } = req.query;

    const result = await adminService.getUsers({
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      keyword: keyword as string,
      role: role as UserRole,
      status: status ? parseInt(status as string) : undefined,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Get users error:', error);
    return res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      error: error.message,
    });
  }
};

/**
 * 获取单个用户详情
 * GET /api/admin/users/:id
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await adminService.getUserById(id);

    return res.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    logger.error('Get user error:', error);

    if (error.message === '用户不存在') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message,
    });
  }
};

/**
 * 更新用户信息
 * PUT /api/admin/users/:id
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, status } = req.body;
    const adminId = req.userId!;
    const adminRole = req.user!.role;

    const updatedUser = await adminService.updateUser(adminId, adminRole, id, {
      name,
      email,
      role,
      status,
    });

    return res.json({
      success: true,
      message: '用户信息已更新',
      data: updatedUser,
    });
  } catch (error: any) {
    logger.error('Update user error:', error);

    if (error.message.includes('无权') || error.message.includes('不能')) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === '用户不存在') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: '更新用户信息失败',
      error: error.message,
    });
  }
};

/**
 * 启用/禁用用户
 * PATCH /api/admin/users/:id/status
 */
export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = req.userId!;
    const adminRole = req.user!.role;

    if (status !== 0 && status !== 1) {
      return res.status(400).json({
        success: false,
        message: '状态值无效（0=禁用, 1=启用）',
      });
    }

    const updatedUser = await adminService.toggleUserStatus(adminId, adminRole, id, status);

    return res.json({
      success: true,
      message: status === 1 ? '用户已启用' : '用户已禁用',
      data: updatedUser,
    });
  } catch (error: any) {
    logger.error('Toggle user status error:', error);

    if (error.message.includes('无权') || error.message.includes('不能')) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: '修改用户状态失败',
      error: error.message,
    });
  }
};

/**
 * 提升用户为管理员
 * POST /api/admin/users/:id/promote
 */
export const promoteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.userId!;
    const adminRole = req.user!.role;

    // 只有超级管理员可以提升用户
    if (adminRole !== UserRole.ROOT) {
      return res.status(403).json({
        success: false,
        message: '只有超级管理员可以提升用户',
      });
    }

    const updatedUser = await adminService.promoteUser(adminId, id);

    return res.json({
      success: true,
      message: '用户已提升为管理员',
      data: updatedUser,
    });
  } catch (error: any) {
    logger.error('Promote user error:', error);

    if (error.message === '用户不存在' || error.message === '用户已经是管理员') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: '提升用户失败',
      error: error.message,
    });
  }
};

/**
 * 降级管理员为普通用户
 * POST /api/admin/users/:id/demote
 */
export const demoteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.userId!;
    const adminRole = req.user!.role;

    // 只有超级管理员可以降级用户
    if (adminRole !== UserRole.ROOT) {
      return res.status(403).json({
        success: false,
        message: '只有超级管理员可以降级用户',
      });
    }

    const updatedUser = await adminService.demoteUser(adminId, id);

    return res.json({
      success: true,
      message: '用户已降级为普通用户',
      data: updatedUser,
    });
  } catch (error: any) {
    logger.error('Demote user error:', error);

    if (error.message.includes('不能') || error.message === '用户已经是普通用户') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: '降级用户失败',
      error: error.message,
    });
  }
};

/**
 * 删除用户
 * DELETE /api/admin/users/:id
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.userId!;
    const adminRole = req.user!.role;

    await adminService.deleteUser(adminId, adminRole, id);

    return res.json({
      success: true,
      message: '用户已删除',
    });
  } catch (error: any) {
    logger.error('Delete user error:', error);

    if (error.message.includes('无权') || error.message.includes('不能')) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === '用户不存在') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: '删除用户失败',
      error: error.message,
    });
  }
};

/**
 * 获取用户统计信息
 * GET /api/admin/users/stats
 */
export const getUserStats = async (req: Request, res: Response) => {
  try {
    const stats = await adminService.getUserStats();

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    logger.error('Get user stats error:', error);
    return res.status(500).json({
      success: false,
      message: '获取统计信息失败',
      error: error.message,
    });
  }
};

/**
 * 获取所有订单列表（管理员）
 * GET /api/admin/orders
 */
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const { page, pageSize, keyword, status } = req.query;

    const result = await adminService.getAllOrders({
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      keyword: keyword as string,
      status: status as string,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Get all orders error:', error);
    return res.status(500).json({
      success: false,
      message: '获取订单列表失败',
      error: error.message,
    });
  }
};

/**
 * 获取订单统计信息
 * GET /api/admin/orders/stats
 */
export const getOrderStats = async (req: Request, res: Response) => {
  try {
    const stats = await adminService.getOrderStats();

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    logger.error('Get order stats error:', error);
    return res.status(500).json({
      success: false,
      message: '获取订单统计失败',
      error: error.message,
    });
  }
};
