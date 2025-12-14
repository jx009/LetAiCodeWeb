/**
 * 全局类型定义
 */

// ========== 用户相关 ==========
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  ROOT = 'ROOT',
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  status: number; // 1=启用 0=禁用
  createdAt: string;
  balance?: number;
}

// ========== API Key 相关 ==========
export enum KeyStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
  DELETED = 'DELETED',
}

export interface ApiKey {
  id: string;
  userId: string;
  label: string;
  remoteKeyId: string | null;
  maskedValue: string;
  fullValue?: string; // 只在创建时返回一次
  status: KeyStatus;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
  usage?: {
    totalTokens: number;
    creditCost: number;
  };
}

// ========== 使用记录相关 ==========
export interface UsageRecord {
  id: string;
  apiKeyId: string;
  apiKey?: {
    id: string;
    label: string;
  };
  timestamp: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  creditCost: number;
  rawMeta?: any;
}

export interface UsageSummary {
  totalTokens: number;
  totalCreditCost: number;
}

// ========== 积分交易相关 ==========
export enum TransactionType {
  RECHARGE = 'RECHARGE',
  BONUS = 'BONUS',
  DEDUCT = 'DEDUCT',
  REFUND = 'REFUND',
  ADMIN_ADJUST = 'ADMIN_ADJUST',
}

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

// ========== 套餐相关 ==========
export interface PackagePlan {
  id: string;
  name: string;
  price: string;
  creditAmount: number;
  bonusCredit: number;
  desc: string | null;
  sortOrder: number;
  active: boolean;
}

// ========== 支付订单相关 ==========
export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  REFUNDED = 'REFUNDED',
}

export interface PaymentOrder {
  id: string;
  orderNo: string;
  userId: string;
  packageId: string;
  amount: string;
  creditAmount: number;
  bonusCredit: number;
  status: PaymentStatus;
  paymentMethod: string | null;
  transactionId: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  package?: PackagePlan;
}

// ========== API 响应相关 ==========
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationResponse<T = any> {
  records: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// ========== 路由相关 ==========
export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  path: string;
  children?: MenuItem[];
}
