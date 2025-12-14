/**
 * 充值相关 API
 */
import { http } from '@/utils/request';
import type {
  ApiResponse,
  PackagePlan,
  PaymentOrder,
  CreditTransaction,
  PaginationResponse,
  TransactionType,
} from '@/types';

// 获取套餐列表
export const getPackagePlans = (type?: string) => {
  return http.get<ApiResponse<PackagePlan[]>>('/packages', {
    params: type ? { type } : undefined,
  });
};

// 创建充值订单
export const createOrder = (packageId: string) => {
  return http.post<ApiResponse<PaymentOrder>>('/orders', { packageId });
};

// 获取支付配置信息
export interface PaymentInfo {
  enableOnlineTopup: boolean;
  payMethods: Array<{
    name: string;
    type: string;
    color: string;
    min_topup?: string;
  }>;
  minTopUp: number;
}

export const getPaymentInfo = () => {
  return http.get<ApiResponse<PaymentInfo>>('/orders/payment-info');
};

// 获取订单详情
export const getOrderById = (orderId: string) => {
  return http.get<ApiResponse<PaymentOrder>>(`/orders/${orderId}`);
};

// 根据订单号查询订单
export const getOrderByOrderNo = (orderNo: string) => {
  return http.get<ApiResponse<PaymentOrder>>(`/orders/no/${orderNo}`);
};

// 获取用户订单列表
export const getUserOrders = (page: number = 1, limit: number = 10) => {
  return http.get<ApiResponse<PaymentOrder[]>>('/orders', {
    params: { page, limit },
  });
};

// 发起支付请求
export interface PaymentRequest {
  orderNo: string;
  paymentMethod: string; // alipay, wxpay, etc.
}

export interface PaymentResult {
  url: string;
  params: Record<string, string>;
}

export const requestPayment = (data: PaymentRequest) => {
  return http.post<ApiResponse<PaymentResult>>('/orders/request-payment', data);
};

// 取消订单
export const cancelOrder = (orderId: string) => {
  return http.post<ApiResponse<any>>(`/orders/${orderId}/cancel`);
};

// 获取交易记录
interface TransactionQueryParams {
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export const getTransactions = (params: TransactionQueryParams) => {
  return http.get<
    ApiResponse<PaginationResponse<CreditTransaction> & { summary: { currentBalance: number } }>
  >('/transactions', { params });
};
