/**
 * 订阅相关 API
 */
import { http } from '@/utils/request';
import type { ApiResponse } from '@/types';
import type { PackageCycle } from './packages';

// 订阅状态
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

// 订阅详情
export interface SubscriptionDetail {
  id: string;
  userId: string;
  packageId: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  daysRemaining: number;
  package: {
    id: string;
    name: string;
    cycle: PackageCycle;
    cycleDays: number;
    price: number;
    baseCredits: number;
    replenishCredits: number;
  };
}

// 积分余额信息
export interface CreditBalanceInfo {
  baseCredits: number; // 基础积分（天花板）
  replenishCredits: number; // 每小时补充量
  currentCredits: number; // 当前可用积分
  nextReplenishAt: string | null; // 下次补充时间
  nextDailyResetAt: string | null; // 下次每日重置时间
  hasSubscription: boolean; // 是否有有效订阅
}

// 积分交易类型
export type TransactionType =
  | 'SUBSCRIPTION'
  | 'REPLENISH'
  | 'DAILY_RESET'
  | 'DEDUCT'
  | 'ADMIN_ADJUST'
  | 'RECHARGE'
  | 'BONUS'
  | 'REFUND';

// 积分交易记录
export interface CreditTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balance: number;
  ref: string | null;
  desc: string | null;
  createdAt: string;
}

// 交易记录分页响应
export interface TransactionListResponse {
  records: CreditTransaction[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// 订阅统计
export interface SubscriptionStats {
  total: number;
  active: number;
  expired: number;
  cancelled: number;
  expiringSoon: number;
}

// ========== 用户 API ==========

// 获取当前订阅
export const getSubscription = () => {
  return http.get<ApiResponse<SubscriptionDetail | null>>('/subscription');
};

// 获取积分余额
export const getBalance = () => {
  return http.get<ApiResponse<CreditBalanceInfo>>('/subscription/balance');
};

// 取消订阅
export const cancelSubscription = () => {
  return http.post<ApiResponse<void>>('/subscription/cancel');
};

// 设置自动续费
export const setAutoRenew = (autoRenew: boolean) => {
  return http.post<ApiResponse<void>>('/subscription/auto-renew', { autoRenew });
};

// 获取订阅历史
export const getSubscriptionHistory = () => {
  return http.get<ApiResponse<any>>('/subscription/history');
};

// 获取积分交易记录
export const getTransactions = (page: number = 1, pageSize: number = 20, type?: TransactionType) => {
  return http.get<ApiResponse<TransactionListResponse>>('/subscription/transactions', {
    params: { page, pageSize, type },
  });
};

// ========== 管理员 API ==========

// 获取订阅统计
export const getSubscriptionStats = () => {
  return http.get<ApiResponse<SubscriptionStats>>('/subscription/admin/stats');
};

// 调整用户积分
export const adjustUserCredits = (userId: string, amount: number, reason: string) => {
  return http.post<ApiResponse<void>>(`/subscription/admin/users/${userId}/credits/adjust`, {
    amount,
    reason,
  });
};

// ========== 管理员使用记录 API ==========

// 使用记录
export interface UsageRecord {
  id: string;
  timestamp: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  creditCost: number;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  apiKeyLabel: string;
}

// 使用记录分页响应
export interface UsageRecordListResponse {
  records: UsageRecord[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// 使用统计
export interface UsageStats {
  totalRecords: number;
  totalTokens: number;
  totalCredits: number;
  totalCostUsd: number;
  modelStats: {
    model: string;
    count: number;
    totalTokens: number;
    creditCost: number;
    costUsd: number;
  }[];
}

// 获取所有用户使用记录（管理员）
export const getAdminUsageRecords = (params: {
  page?: number;
  pageSize?: number;
  email?: string;
  model?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return http.get<ApiResponse<UsageRecordListResponse>>('/subscription/admin/usage/records', {
    params,
  });
};

// 获取使用统计（管理员）
export const getAdminUsageStats = (params?: { startDate?: string; endDate?: string }) => {
  return http.get<ApiResponse<UsageStats>>('/subscription/admin/usage/stats', {
    params,
  });
};

// 获取模型列表（管理员）
export const getUsedModels = () => {
  return http.get<ApiResponse<string[]>>('/subscription/admin/usage/models');
};
