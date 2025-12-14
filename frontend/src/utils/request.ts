/**
 * Axios 请求封装
 */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { message } from 'antd';
import { API_BASE_URL, STORAGE_KEYS } from './constants';

// 创建 Axios 实例
const request: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 添加 token（从 zustand persist 存储中读取）
    const authData = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (authData) {
      try {
        const { token } = JSON.parse(authData);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (e) {
        console.error('Failed to parse auth data:', e);
      }
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('[Request Error]', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data } = response;

    // 如果返回的是 Blob，直接返回
    if (response.config.responseType === 'blob') {
      return response;
    }

    // 成功响应
    if (data.success) {
      return data;
    }

    // 业务错误
    message.error(data.message || '请求失败');
    return Promise.reject(new Error(data.message || '请求失败'));
  },
  (error: AxiosError<any>) => {
    console.error('[Response Error]', error);

    // 网络错误
    if (!error.response) {
      message.error('网络连接失败，请检查网络');
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    // 根据状态码处理
    switch (status) {
      case 401:
        // 未授权，清除 token 并跳转到登录页
        message.error('登录已过期，请重新登录');
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        window.location.href = '/login';
        break;
      case 403:
        message.error('没有权限访问该资源');
        break;
      case 404:
        message.error('请求的资源不存在');
        break;
      case 500:
        message.error('服务器错误，请稍后重试');
        break;
      default:
        message.error(data?.message || `请求失败 (${status})`);
    }

    return Promise.reject(error);
  }
);

// 导出请求方法
export default request;

// 封装常用请求方法
export const http = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) => {
    return request.get<any, T>(url, config);
  },

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => {
    return request.post<any, T>(url, data, config);
  },

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => {
    return request.put<any, T>(url, data, config);
  },

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => {
    return request.patch<any, T>(url, data, config);
  },

  delete: <T = any>(url: string, config?: AxiosRequestConfig) => {
    return request.delete<any, T>(url, config);
  },
};
