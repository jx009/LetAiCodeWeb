/**
 * 积分交易记录路由
 */
import { Router } from 'express';
import transactionController from '../controllers/transaction.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * GET /api/transactions
 * 获取交易记录列表
 * Query: type, startDate, endDate, page, pageSize
 */
router.get('/', transactionController.getTransactions);

/**
 * GET /api/transactions/balance
 * 获取当前积分余额
 */
router.get('/balance', transactionController.getBalance);

/**
 * GET /api/transactions/statistics
 * 获取统计信息
 * Query: startDate, endDate
 */
router.get('/statistics', transactionController.getStatistics);

export default router;
