/**
 * new-api 集成服务
 * 负责与 new-api 中转站服务进行交互
 */
import axios, { AxiosInstance } from 'axios';

interface NewApiTokenResponse {
  success: boolean;
  message?: string;
  data?: {
    id: number;
    key: string;
    name: string;
    created_time: number;
    accessed_time: number;
    expired_time: number;
    remain_quota: number;
    unlimited_quota: boolean;
    status: number;
  };
}

interface NewApiUsageLog {
  id: number;
  created_at: number;
  token_name: string;
  model_name: string;
  prompt_tokens: number;
  completion_tokens: number;
  quota: number;
  type: number;
  username: string;
  token_id: number;
}

class NewApiService {
  private client: AxiosInstance;
  private baseURL: string;
  private adminToken: string;

  constructor() {
    this.baseURL = process.env.NEW_API_BASE_URL || 'http://localhost:3000';
    this.adminToken = process.env.NEW_API_ADMIN_TOKEN || '';

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.adminToken}`,
        'New-Api-User': '2',
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // 响应拦截器：处理错误
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[NewAPI Service] Request failed:', error.message);
        if (error.response) {
          console.error('[NewAPI Service] Response error:', error.response.data);
        }
        throw error;
      }
    );
  }

  /**
   * 创建 Token（生成 API Key）
   * @param userId 用户 ID
   * @param label Key 名称/标签
   * @returns Token 信息（包含完整的 Key）
   */
  async createToken(userId: string, label: string): Promise<{ key: string; id: number }> {
    try {
      const response = await this.client.post<NewApiTokenResponse>('/api/token/', {
        name: label,
        remain_quota: -1, // 无限额度（在 LetAiCode 系统中控制积分）
        unlimited_quota: true,
        user_id: parseInt(userId, 10) || 0, // new-api 的用户 ID（可能不同）
        source: 'letaicode', // Mark as LetAiCode source
        group: 'letaicode', // Group for LetAiCode keys
      });

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to create token in new-api');
      }

      return {
        key: response.data.data.key,
        id: response.data.data.id,
      };
    } catch (error: any) {
      console.error('[NewAPI Service] Failed to create token:', error.message);
      throw new Error(`Failed to create API key in new-api: ${error.message}`);
    }
  }

  /**
   * 删除 Token
   * @param remoteKeyId new-api 中的 Token ID
   */
  async deleteToken(remoteKeyId: number): Promise<void> {
    try {
      await this.client.delete(`/api/token/${remoteKeyId}`);
    } catch (error: any) {
      console.error('[NewAPI Service] Failed to delete token:', error.message);
      throw new Error(`Failed to delete API key in new-api: ${error.message}`);
    }
  }

  /**
   * 获取 Token 详情
   * @param remoteKeyId new-api 中的 Token ID
   */
  async getToken(remoteKeyId: number): Promise<any> {
    try {
      const response = await this.client.get(`/api/token/${remoteKeyId}`);
      return response.data;
    } catch (error: any) {
      console.error('[NewAPI Service] Failed to get token:', error.message);
      throw new Error(`Failed to get API key from new-api: ${error.message}`);
    }
  }

  /**
   * 获取 Token 使用记录
   * @param remoteKeyId new-api 中的 Token ID
   * @param startTime 开始时间（可选）
   * @param endTime 结束时间（可选）
   */
  async getTokenUsage(
    remoteKeyId: number,
    startTime?: Date,
    endTime?: Date
  ): Promise<NewApiUsageLog[]> {
    try {
      const params: any = { token_id: remoteKeyId };

      if (startTime) {
        params.start_timestamp = Math.floor(startTime.getTime() / 1000);
      }

      if (endTime) {
        params.end_timestamp = Math.floor(endTime.getTime() / 1000);
      }

      const response = await this.client.get('/api/log/', { params });

      // new-api 返回的是分页格式: { success: true, data: { page, page_size, total, items: [...] } }
      if (response.data.success && response.data.data) {
        // 如果是分页格式，取 items 数组
        if (response.data.data.items && Array.isArray(response.data.data.items)) {
          return response.data.data.items;
        }
        // 兼容直接返回数组的情况
        if (Array.isArray(response.data.data)) {
          return response.data.data;
        }
      }

      return [];
    } catch (error: any) {
      console.error('[NewAPI Service] Failed to get token usage:', error.message);
      // 不抛出错误，返回空数组（使用记录同步不应中断服务）
      return [];
    }
  }

  /**
   * 更新 Token 状态
   * @param remoteKeyId new-api 中的 Token ID
   * @param status 状态（1=启用, 2=禁用）
   */
  async updateTokenStatus(remoteKeyId: number, status: 1 | 2): Promise<void> {
    try {
      await this.client.put(`/api/token/`, {
        id: remoteKeyId,
        status,
      });
    } catch (error: any) {
      console.error('[NewAPI Service] Failed to update token status:', error.message);
      throw new Error(`Failed to update API key status in new-api: ${error.message}`);
    }
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/status');
      return response.status === 200;
    } catch (error) {
      console.error('[NewAPI Service] Connection test failed:', error);
      return false;
    }
  }
}

export default new NewApiService();
