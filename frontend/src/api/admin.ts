/**
 * 管理员 API
 * 用户管理、配置管理、订单管理
 */
import { http } from '@/utils/request';
import type { ApiResponse, User, PaymentOrder } from '@/types';

// ========== 用户管理 ==========

export interface UserQueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  role?: string;
  status?: number;
}

export interface UserListResponse {
  users: Array<
    User & {
      _count: {
        apiKeys: number;
        creditTransactions: number;
      };
    }
  >;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface UserStatsResponse {
  total: number;
  activeUsers: number;
  admins: number;
  rootUsers: number;
  recentUsers: number;
}

// 获取用户列表
export const getUsers = (params: UserQueryParams) => {
  return http.get<ApiResponse<UserListResponse>>('/admin/users', { params });
};

// 获取用户统计
export const getUserStats = () => {
  return http.get<ApiResponse<UserStatsResponse>>('/admin/users/stats');
};

// 获取用户详情
export const getUserById = (userId: string) => {
  return http.get<ApiResponse<User>>(`/admin/users/${userId}`);
};

// 更新用户信息
export const updateUser = (userId: string, data: { name?: string; email?: string }) => {
  return http.put<ApiResponse<User>>(`/admin/users/${userId}`, data);
};

// 启用/禁用用户
export const toggleUserStatus = (userId: string, status: number) => {
  return http.patch<ApiResponse<User>>(`/admin/users/${userId}/status`, { status });
};

// 提升为管理员
export const promoteUser = (userId: string) => {
  return http.post<ApiResponse<User>>(`/admin/users/${userId}/promote`);
};

// 降级为普通用户
export const demoteUser = (userId: string) => {
  return http.post<ApiResponse<User>>(`/admin/users/${userId}/demote`);
};

// 删除用户
export const deleteUser = (userId: string) => {
  return http.delete<ApiResponse<any>>(`/admin/users/${userId}`);
};

// ========== 配置管理 ==========

export interface SystemOptions {
  [key: string]: string;
}

export interface PaymentConfig {
  payAddress: string;
  epayId: string;
  epayKey: string;
  minTopUp: number;
  payMethods: Array<{
    name: string;
    type: string;
    color: string;
  }>;
}

// 获取所有配置
export const getOptions = () => {
  return http.get<ApiResponse<SystemOptions>>('/options');
};

// 获取单个配置
export const getOption = (key: string) => {
  return http.get<ApiResponse<string>>(`/options/${key}`);
};

// 更新单个配置
export const updateOption = (key: string, value: string, desc?: string) => {
  return http.put<ApiResponse<any>>(`/options/${key}`, { value, desc });
};

// 批量更新配置
export const updateOptions = (options: Array<{ key: string; value: string; desc?: string }>) => {
  return http.put<ApiResponse<any>>('/options', { options });
};

// 删除配置
export const deleteOption = (key: string) => {
  return http.delete<ApiResponse<any>>(`/options/${key}`);
};

// 获取支付配置
export const getPaymentConfig = () => {
  return http.get<ApiResponse<PaymentConfig>>('/options/payment/config');
};

// 更新支付配置
export const updatePaymentConfig = (config: PaymentConfig) => {
  return http.put<ApiResponse<any>>('/options/payment/config', config);
};

// 验证支付配置
export const validatePaymentConfig = () => {
  return http.get<ApiResponse<{ valid: boolean; message?: string }>>('/options/payment/validate');
};

// ========== 订单管理 ==========

export interface OrderQueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
}

export interface OrderListResponse {
  orders: Array<
    PaymentOrder & {
      user?: {
        email: string;
        name: string | null;
      };
    }
  >;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// 获取所有订单（管理员）
export const getAllOrders = (params: OrderQueryParams) => {
  return http.get<ApiResponse<OrderListResponse>>('/admin/orders', { params });
};

// 获取订单统计
export const getOrderStats = () => {
  return http.get<
    ApiResponse<{
      total: number;
      pending: number;
      paid: number;
      cancelled: number;
      totalAmount: string;
    }>
  >('/admin/orders/stats');
};
