/**
 * Redis 工具函数
 */
import Redis from 'ioredis';
import { logger } from './logger.util';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

/**
 * 设置值（带过期时间）
 */
export const setWithExpiry = async (key: string, value: string, expirySeconds: number): Promise<void> => {
  await redis.setex(key, expirySeconds, value);
};

/**
 * 获取值
 */
export const get = async (key: string): Promise<string | null> => {
  return redis.get(key);
};

/**
 * 删除值
 */
export const del = async (key: string): Promise<void> => {
  await redis.del(key);
};

/**
 * 检查键是否存在
 */
export const exists = async (key: string): Promise<boolean> => {
  const result = await redis.exists(key);
  return result === 1;
};

export default redis;
