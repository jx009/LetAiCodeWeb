/**
 * Express 类型扩展
 */
import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: User;
    }
  }
}

export {};
