/**
 * 使用记录相关 API
 */
import { http } from '@/utils/request';
import type { ApiResponse, UsageRecord, PaginationResponse, UsageSummary, CreditTransaction, TransactionType } from '@/types';

// 查询参数接口
interface UsageQueryParams {
  keyId?: string;
  startDate?: string;
  endDate?: string;
  model?: string;
  page?: number;
  pageSize?: number;
}

interface TransactionQueryParams {
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

interface UsageStatistics {
  byModel: Array<{
    model: string;
    totalTokens: number;
    totalCreditCost: number;
    requestCount: number;
  }>;
  total: {
    totalTokens: number;
    totalCreditCost: number;
    requestCount: number;
  };
}

interface CreditStatistics {
  currentBalance: number;
  totalRecharge: number;
  totalBonus: number;
  totalDeduct: number;
  totalRefund: number;
}

/**
 * 获取使用记录列表
 */
export const getUsageRecords = (params: UsageQueryParams) => {
  return http.get<ApiResponse<PaginationResponse<UsageRecord> & { summary: UsageSummary }>>(
    '/usage',
    { params }
  );
};

/**
 * 获取使用统计（按模型分组）
 */
export const getUsageStatistics = (params?: { startDate?: string; endDate?: string }) => {
  return http.get<ApiResponse<UsageStatistics>>('/usage/statistics', { params });
};

/**
 * 手动触发同步
 */
export const syncUsageRecords = () => {
  return http.post<ApiResponse<{ synced: number; message: string }>>('/usage/sync');
};

/**
 * 获取交易记录列表
 */
export const getTransactions = (params: TransactionQueryParams) => {
  return http.get<ApiResponse<PaginationResponse<CreditTransaction> & { summary: { currentBalance: number } }>>(
    '/transactions',
    { params }
  );
};

/**
 * 获取当前积分余额
 */
export const getBalance = () => {
  return http.get<ApiResponse<{ balance: number }>>('/transactions/balance');
};

/**
 * 获取积分统计信息
 */
export const getCreditStatistics = (params?: { startDate?: string; endDate?: string }) => {
  return http.get<ApiResponse<CreditStatistics>>('/transactions/statistics', { params });
};
