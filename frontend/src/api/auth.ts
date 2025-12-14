/**
 * 认证相关 API
 */
import { http } from '@/utils/request';
import type { ApiResponse, User } from '@/types';

// 发送邮箱验证码
export const sendEmailCode = (email: string) => {
  return http.post<ApiResponse>('/auth/send-code', { email });
};

// 邮箱登录
export const login = (email: string, code: string) => {
  return http.post<ApiResponse<{ user: User; token: string }>>('/auth/login', { email, code });
};

// 登出
export const logout = () => {
  return http.post<ApiResponse>('/auth/logout');
};

// 刷新 token
export const refreshToken = () => {
  return http.post<ApiResponse<{ token: string }>>('/auth/refresh');
};

// 默认导出所有方法
export default {
  sendEmailCode,
  login,
  logout,
  refreshToken,
};
