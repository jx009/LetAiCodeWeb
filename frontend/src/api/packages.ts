/**
 * 套餐相关 API
 */
import { http } from '@/utils/request';
import type { ApiResponse } from '@/types';

// 套餐周期类型
export type PackageCycle = 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';

// 订阅套餐
export interface SubscriptionPackage {
  id: string;
  name: string;
  cycle: PackageCycle;
  cycleDays: number;
  price: number;
  baseCredits: number;
  replenishCredits: number;
  desc: string | null;
  sortOrder: number;
  active: boolean;
  recommended: boolean;
  displayCredits: number; // 展示积分 = base*30 + replenish*24*30
  monthlyPrice: number; // 月均价格
  monthlySavings: number; // 相比月付省多少钱
  savingsPercentage: number; // 省钱百分比
}

// 按周期分组的套餐
export interface PackagesByCycle {
  WEEK: SubscriptionPackage[];
  MONTH: SubscriptionPackage[];
  QUARTER: SubscriptionPackage[];
  YEAR: SubscriptionPackage[];
}

// 套餐统计
export interface PackageStats {
  total: number;
  active: number;
  inactive: number;
}

// 创建套餐参数
export interface CreatePackageParams {
  name: string;
  cycle: PackageCycle;
  price: number;
  baseCredits: number;
  replenishCredits: number;
  desc?: string;
  sortOrder?: number;
  active?: boolean;
  recommended?: boolean;
}

// 更新套餐参数
export interface UpdatePackageParams {
  name?: string;
  cycle?: PackageCycle;
  price?: number;
  baseCredits?: number;
  replenishCredits?: number;
  desc?: string;
  sortOrder?: number;
  active?: boolean;
  recommended?: boolean;
}

// ========== 公开 API ==========

// 获取所有套餐列表
export const getPackages = (activeOnly: boolean = true) => {
  return http.get<ApiResponse<SubscriptionPackage[]>>('/packages', {
    params: { activeOnly: activeOnly ? 'true' : 'false' },
  });
};

// 获取套餐（按周期分组）
export const getPackagesByCycle = () => {
  return http.get<ApiResponse<PackagesByCycle>>('/packages/grouped');
};

// 获取套餐详情
export const getPackageById = (id: string) => {
  return http.get<ApiResponse<SubscriptionPackage>>(`/packages/${id}`);
};

// ========== 管理员 API ==========

// 获取套餐统计
export const getPackageStats = () => {
  return http.get<ApiResponse<PackageStats>>('/packages/admin/stats');
};

// 创建套餐
export const createPackage = (data: CreatePackageParams) => {
  return http.post<ApiResponse<SubscriptionPackage>>('/packages', data);
};

// 更新套餐
export const updatePackage = (id: string, data: UpdatePackageParams) => {
  return http.put<ApiResponse<SubscriptionPackage>>(`/packages/${id}`, data);
};

// 切换套餐激活状态
export const togglePackageActive = (id: string) => {
  return http.patch<ApiResponse<SubscriptionPackage>>(`/packages/${id}/toggle`);
};

// 删除套餐
export const deletePackage = (id: string) => {
  return http.delete<ApiResponse<void>>(`/packages/${id}`);
};
