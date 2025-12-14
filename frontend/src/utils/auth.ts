/**
 * 认证工具函数
 */
import { STORAGE_KEYS } from './constants';
import type { User } from '@/types';

/**
 * 保存 token
 */
export const setToken = (token: string) => {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
};

/**
 * 获取 token
 */
export const getToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
};

/**
 * 移除 token
 */
export const removeToken = () => {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
};

/**
 * 保存用户信息
 */
export const setUser = (user: User) => {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

/**
 * 获取用户信息
 */
export const getUser = (): User | null => {
  const userStr = localStorage.getItem(STORAGE_KEYS.USER);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

/**
 * 移除用户信息
 */
export const removeUser = () => {
  localStorage.removeItem(STORAGE_KEYS.USER);
};

/**
 * 清除所有认证信息
 */
export const clearAuth = () => {
  removeToken();
  removeUser();
};

/**
 * 检查是否已登录
 */
export const isAuthenticated = (): boolean => {
  return !!getToken();
};
