/**
 * 常量定义
 */

// ========== API 配置 ==========
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// ========== 应用配置 ==========
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'LetAiCode';
export const APP_LOGO_URL = import.meta.env.VITE_APP_LOGO_URL || '/logo.png';

// ========== 本地存储 Key ==========
export const STORAGE_KEYS = {
  TOKEN: 'letaicode_token',
  USER: 'letaicode_user',
  THEME: 'letaicode_theme',
  SIDEBAR_COLLAPSED: 'letaicode_sidebar_collapsed',
};

// ========== 路由路径 ==========
export const ROUTES = {
  LOGIN: '/login',
  CODING_PLAN: '/coding-plan',
  API_KEYS: '/keys',
  USAGE: '/usage',
  ACCOUNT: '/account',
  BALANCE: '/balance',
  RECHARGE: '/recharge',
  DOCS: '/docs',
  NOTIFICATIONS: '/notifications',
  SETTINGS: '/settings',
};

// ========== 日期格式 ==========
export const DATE_FORMATS = {
  DATE: 'YYYY-MM-DD',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  TIME: 'HH:mm:ss',
  MONTH: 'YYYY-MM',
  YEAR: 'YYYY',
};

// ========== 分页配置 ==========
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
};

// ========== Key 状态映射 ==========
export const KEY_STATUS_MAP = {
  ACTIVE: { text: '激活', color: 'success' },
  DISABLED: { text: '禁用', color: 'default' },
  DELETED: { text: '已删除', color: 'error' },
};

// ========== 交易类型映射 ==========
export const TRANSACTION_TYPE_MAP = {
  RECHARGE: { text: '充值', color: 'success' },
  BONUS: { text: '赠送', color: 'processing' },
  DEDUCT: { text: '扣除', color: 'error' },
  REFUND: { text: '退款', color: 'warning' },
  ADMIN_ADJUST: { text: '管理员调整', color: 'default' },
};

// ========== 支付状态映射 ==========
export const PAYMENT_STATUS_MAP = {
  PENDING: { text: '待支付', color: 'processing' },
  PAID: { text: '已支付', color: 'success' },
  CANCELLED: { text: '已取消', color: 'default' },
  EXPIRED: { text: '已过期', color: 'error' },
  REFUNDED: { text: '已退款', color: 'warning' },
};
