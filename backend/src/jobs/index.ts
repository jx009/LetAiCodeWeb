/**
 * 定时任务入口
 */
import { startCreditJobs, stopCreditJobs, getCreditJobsStatus } from './credit-jobs';
import { logger } from '@/utils/logger.util';

/**
 * 启动所有定时任务
 */
export function startAllJobs() {
  logger.info('[Jobs] Starting all scheduled jobs...');

  // 启动积分相关任务
  startCreditJobs();

  logger.info('[Jobs] All scheduled jobs started');
}

/**
 * 停止所有定时任务
 */
export function stopAllJobs() {
  logger.info('[Jobs] Stopping all scheduled jobs...');

  // 停止积分相关任务
  stopCreditJobs();

  logger.info('[Jobs] All scheduled jobs stopped');
}

/**
 * 获取所有定时任务状态
 */
export function getAllJobsStatus() {
  return {
    creditJobs: getCreditJobsStatus(),
  };
}

export { startCreditJobs, stopCreditJobs, getCreditJobsStatus };
