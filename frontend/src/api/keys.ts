/**
 * API Keys 相关 API
 */
import { http } from '@/utils/request';
import type { ApiResponse, ApiKey, KeyStatus } from '@/types';

/**
 * 获取用户的所有 API Keys
 */
export const getApiKeys = () => {
  return http.get<ApiResponse<ApiKey[]>>('/keys');
};

/**
 * 获取单个 API Key 详情
 */
export const getApiKeyById = (keyId: string) => {
  return http.get<ApiResponse<ApiKey>>(`/keys/${keyId}`);
};

/**
 * 创建新的 API Key
 */
export const createApiKey = (label: string) => {
  return http.post<ApiResponse<ApiKey>>('/keys', { label });
};

/**
 * 更新 API Key 状态（启用/禁用）
 */
export const updateApiKeyStatus = (keyId: string, status: KeyStatus) => {
  return http.patch<ApiResponse<ApiKey>>(`/keys/${keyId}/status`, { status });
};

/**
 * 删除 API Key
 */
export const deleteApiKey = (keyId: string) => {
  return http.delete<ApiResponse<any>>(`/keys/${keyId}`);
};

/**
 * 解密 API Key（获取完整的 Key）
 */
export const decryptApiKey = (keyId: string) => {
  return http.post<ApiResponse<{ fullValue: string }>>(`/keys/${keyId}/decrypt`);
};
