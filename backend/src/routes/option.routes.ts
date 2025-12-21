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
  getCreditConfig,
  updateCreditConfig,
} from '@/controllers/option.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { rootAuth } from '@/middlewares/role.middleware';

const router = Router();

// 所有配置路由都需要超级管理员权限
router.use(authMiddleware, rootAuth);

// 支付配置（放在通配路由前面）
router.get('/payment/config', getPaymentConfig);
router.put('/payment/config', updatePaymentConfig);
router.get('/payment/validate', validatePaymentConfig);

// 积分配置
router.get('/credit/config', getCreditConfig);
router.put('/credit/config', updateCreditConfig);

// 配置管理（通配路由放在最后）
router.get('/', getOptions);
router.put('/', updateOptions);
router.get('/:key', getOption);
router.put('/:key', updateOption);
router.delete('/:key', deleteOption);

export default router;
