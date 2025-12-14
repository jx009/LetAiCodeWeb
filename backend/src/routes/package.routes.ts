/**
 * 套餐路由
 */
import { Router } from 'express';
import packageController from '@/controllers/package.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';

const router = Router();

/**
 * 公开路由（不需要登录）
 */

// 获取所有套餐列表
router.get('/', packageController.getAllPackages);

// 获取套餐详情
router.get('/:id', packageController.getPackageById);

/**
 * 需要管理员权限的路由（暂时未实现管理员中间件，后续添加）
 */

// 创建套餐
router.post('/', authMiddleware, packageController.createPackage);

// 更新套餐
router.put('/:id', authMiddleware, packageController.updatePackage);

// 删除套餐
router.delete('/:id', authMiddleware, packageController.deletePackage);

export default router;
