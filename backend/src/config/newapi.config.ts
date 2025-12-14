/**
 * new-api 配置
 */
export const newApiConfig = {
  baseURL: process.env.NEW_API_BASE_URL || 'http://localhost:3000',
  adminToken: process.env.NEW_API_ADMIN_TOKEN || '',
};
