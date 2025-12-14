/**
 * 密码加密工具
 */
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * 加密密码
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * 验证密码
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
