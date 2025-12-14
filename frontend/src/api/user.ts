/**
 * 用户相关 API
 */
import { http } from '@/utils/request';
import type { ApiResponse, User } from '@/types';

// 获取用户信息
export const getUserProfile = () => {
  return http.get<ApiResponse<User>>('/user/profile');
};

// 更新用户信息
export const updateUserProfile = (data: Partial<User>) => {
  return http.patch<ApiResponse>('/user/profile', data);
};
