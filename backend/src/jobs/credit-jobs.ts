/**
 * 积分相关定时任务
 */
import cron from 'node-cron';
import { replenishService } from '@/services/replenish.service';
import { logger } from '@/utils/logger.util';

let hourlyTask: cron.ScheduledTask | null = null;

/**
 * 启动积分定时任务
 */
export function startCreditJobs() {
  // 每小时整点执行积分补充
  // 格式：分钟 小时 日 月 星期
  hourlyTask = cron.schedule('0 * * * *', async () => {
    try {
      logger.info('[CronJob] Starting hourly credit replenish...');
      const result = await replenishService.runHourlyReplenish();
      logger.info(
        `[CronJob] Hourly replenish completed: ${result.processed} users, ${result.replenished} credits`
      );
    } catch (error) {
      logger.error('[CronJob] Hourly replenish failed:', error);
    }
  });

  // 每日重置功能已改为用户手动触发，不再自动执行

  logger.info('[CronJob] Credit jobs started');
  logger.info('[CronJob] - Hourly replenish: every hour at minute 0');
}

/**
 * 停止积分定时任务
 */
export function stopCreditJobs() {
  if (hourlyTask) {
    hourlyTask.stop();
    hourlyTask = null;
  }

  logger.info('[CronJob] Credit jobs stopped');
}

/**
 * 获取定时任务状态
 */
export function getCreditJobsStatus() {
  return {
    hourlyRunning: hourlyTask !== null,
    replenishStatus: replenishService.getStatus(),
  };
}
