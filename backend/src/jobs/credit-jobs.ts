/**
 * 积分相关定时任务
 */
import cron from 'node-cron';
import { replenishService } from '@/services/replenish.service';
import { logger } from '@/utils/logger.util';

let hourlyTask: cron.ScheduledTask | null = null;
let dailyTask: cron.ScheduledTask | null = null;

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

  // 每天凌晨 0 点执行每日重置
  // 注意：这里使用服务器时间，每日重置时会检查每个用户的时区
  dailyTask = cron.schedule('0 0 * * *', async () => {
    try {
      logger.info('[CronJob] Starting daily credit reset...');
      const result = await replenishService.runDailyReset();
      logger.info(`[CronJob] Daily reset completed: ${result.processed} users, ${result.reset} reset`);
    } catch (error) {
      logger.error('[CronJob] Daily reset failed:', error);
    }
  });

  logger.info('[CronJob] Credit jobs started');
  logger.info('[CronJob] - Hourly replenish: every hour at minute 0');
  logger.info('[CronJob] - Daily reset: every day at 00:00');
}

/**
 * 停止积分定时任务
 */
export function stopCreditJobs() {
  if (hourlyTask) {
    hourlyTask.stop();
    hourlyTask = null;
  }

  if (dailyTask) {
    dailyTask.stop();
    dailyTask = null;
  }

  logger.info('[CronJob] Credit jobs stopped');
}

/**
 * 获取定时任务状态
 */
export function getCreditJobsStatus() {
  return {
    hourlyRunning: hourlyTask !== null,
    dailyRunning: dailyTask !== null,
    replenishStatus: replenishService.getStatus(),
  };
}
