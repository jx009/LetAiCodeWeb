/**
 * 系统配置路由
 * 只有超级管理员可以访问
 */
import { Router } from 'express';
import {
  getOptions,
  getOption,
  updateOption,
  updateOptions,
  deleteOption,
  getPaymentConfig,
  updatePaymentConfig,
  validatePaymentConfig,
} from '@/controllers/option.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { rootAuth } from '@/middlewares/role.middleware';

const router = Router();

// 所有配置路由都需要超级管理员权限
router.use(authMiddleware, rootAuth);

// 配置管理
router.get('/', getOptions);
router.get('/:key', getOption);
router.put('/:key', updateOption);
router.put('/', updateOptions);
router.delete('/:key', deleteOption);

// 支付配置
router.get('/payment/config', getPaymentConfig);
router.put('/payment/config', updatePaymentConfig);
router.get('/payment/validate', validatePaymentConfig);

export default router;
