/**
 * 套餐路由
 */
import { Router } from 'express';
import {
  getAllPackages,
  getPackagesByCycle,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
  togglePackageActive,
  getPackageStats,
} from '@/controllers/package.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { adminAuth, rootAuth } from '@/middlewares/role.middleware';

const router = Router();

/**
 * 公开路由（不需要登录）
 */

// 获取所有套餐列表
router.get('/', getAllPackages);

// 获取套餐（按周期分组）
router.get('/grouped', getPackagesByCycle);

// 获取套餐详情
router.get('/:id', getPackageById);

/**
 * 管理员路由
 */

// 获取套餐统计
router.get('/admin/stats', authMiddleware, rootAuth, getPackageStats);

// 创建套餐
router.post('/', authMiddleware, rootAuth, createPackage);

// 更新套餐
router.put('/:id', authMiddleware, rootAuth, updatePackage);

// 切换套餐激活状态
router.patch('/:id/toggle', authMiddleware, rootAuth, togglePackageActive);

// 删除套餐
router.delete('/:id', authMiddleware, rootAuth, deletePackage);

export default router;
