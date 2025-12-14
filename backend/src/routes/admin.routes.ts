/**
 * 管理员路由 - 用户管理 + 订单管理
 * 需要管理员或超级管理员权限
 */
import { Router } from 'express';
import {
  getUsers,
  getUserById,
  updateUser,
  toggleUserStatus,
  promoteUser,
  demoteUser,
  deleteUser,
  getUserStats,
  getAllOrders,
  getOrderStats,
} from '@/controllers/admin.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { adminAuth } from '@/middlewares/role.middleware';

const router = Router();

// 所有管理员路由都需要管理员权限
router.use(authMiddleware, adminAuth);

// 用户统计（放在前面避免被 :id 匹配）
router.get('/users/stats', getUserStats);

// 用户管理
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.patch('/users/:id/status', toggleUserStatus);
router.post('/users/:id/promote', promoteUser);
router.post('/users/:id/demote', demoteUser);
router.delete('/users/:id', deleteUser);

// 订单统计（放在前面避免被 :id 匹配）
router.get('/orders/stats', getOrderStats);

// 订单管理
router.get('/orders', getAllOrders);

export default router;
