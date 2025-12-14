/**
 * 认证服务
 * 负责验证码生成、验证、用户登录、登出等核心逻辑
 */
import prisma from '@/utils/prisma';
import redis, { setWithExpiry, get, del } from '@/utils/redis.util';
import { generateVerificationCode } from '@/utils/crypto.util';
import { generateToken } from '@/utils/jwt.util';
import emailService from './email.service';
import { logger } from '@/utils/logger.util';
import { User } from '@prisma/client';

class AuthService {
  // 验证码有效期（秒）
  private readonly CODE_EXPIRY = 300; // 5分钟

  // Session 有效期（秒）
  private readonly SESSION_EXPIRY = 14 * 24 * 60 * 60; // 14天

  /**
   * 发送邮箱验证码
   */
  async sendVerificationCode(email: string): Promise<void> {
    try {
      // 检查是否频繁发送（60秒内只能发送一次）
      const rateLimitKey = `rate_limit:email:${email}`;
      const lastSent = await get(rateLimitKey);
      if (lastSent) {
        throw new Error('验证码发送过于频繁，请 60 秒后再试');
      }

      // 生成 6 位验证码
      const code = generateVerificationCode();
      logger.info(`Generated verification code for ${email}: ${code}`);

      // 存储到 Redis（5分钟有效）
      const codeKey = `verify_code:${email}`;
      await setWithExpiry(codeKey, code, this.CODE_EXPIRY);

      // 设置发送频率限制（60秒）
      await setWithExpiry(rateLimitKey, '1', 60);

      // 发送邮件
      await emailService.sendVerificationCode(email, code);

      logger.info(`Verification code sent to ${email}`);
    } catch (error: any) {
      logger.error('Failed to send verification code:', error);
      throw error;
    }
  }

  /**
   * 验证邮箱验证码
   */
  async verifyCode(email: string, code: string): Promise<boolean> {
    try {
      const codeKey = `verify_code:${email}`;
      const storedCode = await get(codeKey);

      if (!storedCode) {
        throw new Error('验证码已过期或不存在');
      }

      if (storedCode !== code) {
        throw new Error('验证码错误');
      }

      // 验证成功后删除验证码（防止重复使用）
      await del(codeKey);

      return true;
    } catch (error: any) {
      logger.error('Failed to verify code:', error);
      throw error;
    }
  }

  /**
   * 邮箱登录（自动注册）
   */
  async login(email: string, code: string): Promise<{ user: User; token: string }> {
    try {
      // 1. 验证验证码
      await this.verifyCode(email, code);

      // 2. 查找或创建用户
      let user = await prisma.user.findUnique({
        where: { email },
      });

      const isNewUser = !user;

      if (!user) {
        // 自动注册新用户
        user = await prisma.user.create({
          data: {
            email,
            name: email.split('@')[0], // 默认用户名为邮箱前缀
          },
        });

        // 赠送新用户免费积分
        const freeQuota = parseInt(process.env.CREDIT_FREE_QUOTA || '10000');
        await prisma.creditTransaction.create({
          data: {
            userId: user.id,
            type: 'BONUS',
            amount: freeQuota,
            balance: freeQuota,
            desc: '新用户注册赠送',
          },
        });

        logger.info(`New user registered: ${email}, gifted ${freeQuota} credits`);

        // 发送欢迎邮件
        emailService.sendWelcomeEmail(email, user.name || undefined).catch((err) => {
          logger.error('Failed to send welcome email:', err);
        });
      }

      // 3. 生成 JWT Token
      const token = generateToken({ userId: user.id });

      // 4. 创建 Session
      await this.createSession(user.id, token);

      logger.info(`User logged in: ${email}, isNewUser: ${isNewUser}`);

      return { user, token };
    } catch (error: any) {
      logger.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * 创建 Session
   */
  private async createSession(userId: string, refreshToken: string): Promise<void> {
    const expiresAt = new Date(Date.now() + this.SESSION_EXPIRY * 1000);

    // 创建 Session 记录
    await prisma.session.create({
      data: {
        userId,
        refreshToken,
        expiresAt,
      },
    });

    // 同时存储到 Redis（快速查询）
    const sessionKey = `session:${refreshToken}`;
    await setWithExpiry(sessionKey, userId, this.SESSION_EXPIRY);
  }

  /**
   * 验证 Session
   */
  async validateSession(token: string): Promise<User | null> {
    try {
      // 先从 Redis 查询
      const sessionKey = `session:${token}`;
      const userId = await get(sessionKey);

      if (userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });
        return user;
      }

      // Redis 中没有，从数据库查询
      const session = await prisma.session.findUnique({
        where: { refreshToken: token },
        include: { user: true },
      });

      if (!session) {
        return null;
      }

      // 检查是否过期
      if (session.expiresAt < new Date()) {
        // 删除过期 Session
        await prisma.session.delete({
          where: { id: session.id },
        });
        return null;
      }

      // 重新缓存到 Redis
      await setWithExpiry(sessionKey, session.userId, this.SESSION_EXPIRY);

      return session.user;
    } catch (error) {
      logger.error('Failed to validate session:', error);
      return null;
    }
  }

  /**
   * 登出
   */
  async logout(token: string): Promise<void> {
    try {
      // 从 Redis 删除
      const sessionKey = `session:${token}`;
      await del(sessionKey);

      // 从数据库删除
      await prisma.session.deleteMany({
        where: { refreshToken: token },
      });

      logger.info('User logged out');
    } catch (error) {
      logger.error('Failed to logout:', error);
      throw new Error('登出失败');
    }
  }

  /**
   * 获取用户余额
   */
  async getUserBalance(userId: string): Promise<number> {
    const lastTransaction = await prisma.creditTransaction.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return lastTransaction?.balance || 0;
  }

  /**
   * 清理过期的验证码和 Session
   */
  async cleanupExpiredData(): Promise<void> {
    try {
      // 清理过期 Session
      await prisma.session.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      // 清理过期的邮箱验证码
      await prisma.emailCode.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      logger.info('Expired data cleaned up');
    } catch (error) {
      logger.error('Failed to cleanup expired data:', error);
    }
  }
}

export default new AuthService();
