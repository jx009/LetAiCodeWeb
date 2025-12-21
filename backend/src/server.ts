/**
 * 服务器入口文件
 */
import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { logger } from './utils/logger.util';
import prisma from './utils/prisma';
import redis from './utils/redis.util';
// 已禁用：使用 webhook 实时推送代替定时同步，避免重复扣除积分
// import usageService from './services/usage.service';
import { startAllJobs, stopAllJobs } from './jobs';

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';

// 启动服务器
app.listen(PORT, () => {
  logger.info(`🚀 Server is running on http://${HOST}:${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`💾 Database: ${process.env.DATABASE_URL?.includes('postgresql') ? 'PostgreSQL' : 'SQLite'}`);

  // 已禁用定时同步：使用 webhook 实时推送代替，避免重复扣除积分
  // usageService.initSyncScheduler();
  // logger.info(`⏰ Usage sync scheduler initialized`);

  // 启动积分补充定时任务
  startAllJobs();
  logger.info(`⏰ Credit replenish jobs started`);
});

// 优雅关闭
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  // usageService.stopSyncScheduler();
  stopAllJobs();
  await prisma.$disconnect();
  await redis.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  // usageService.stopSyncScheduler();
  stopAllJobs();
  await prisma.$disconnect();
  await redis.disconnect();
  process.exit(0);
});
