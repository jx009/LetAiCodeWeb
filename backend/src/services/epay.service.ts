/**
 * 易支付客户端封装
 * 参考：https://github.com/Calcium-Ion/go-epay
 */
import crypto from 'crypto';
import optionService from './option.service';

export interface EpayConfig {
  payAddress: string; // 易支付网关地址
  epayId: string; // 商户ID
  epayKey: string; // 商户密钥
}

export interface PurchaseParams {
  type: string; // 支付方式：alipay, wxpay, qqpay, etc.
  serviceTradeNo: string; // 商户订单号
  name: string; // 商品名称
  money: string; // 支付金额（格式：0.01）
  notifyUrl: string; // 异步通知地址
  returnUrl: string; // 同步跳转地址
  device?: 'pc' | 'mobile'; // 设备类型
}

export interface PurchaseResult {
  url: string; // 支付URL
  params: Record<string, string>; // 支付参数（用于表单提交）
}

export interface CallbackParams {
  [key: string]: string;
}

export interface VerifyResult {
  verifyStatus: boolean; // 签名验证结果
  tradeStatus: 'TRADE_SUCCESS' | 'TRADE_CLOSED' | string; // 交易状态
  serviceTradeNo: string; // 商户订单号
  tradeNo: string; // 易支付订单号
  type: string; // 支付方式
  name: string; // 商品名称
  money: string; // 支付金额
  sign: string; // 签名
}

class EpayService {
  private config: EpayConfig | null = null;

  /**
   * 初始化配置（从数据库加载）
   */
  async initConfig(): Promise<void> {
    const paymentConfig = await optionService.getPaymentConfig();

    if (!paymentConfig.payAddress || !paymentConfig.epayId || !paymentConfig.epayKey) {
      this.config = null;
      return;
    }

    this.config = {
      payAddress: paymentConfig.payAddress,
      epayId: paymentConfig.epayId,
      epayKey: paymentConfig.epayKey,
    };
  }

  /**
   * 获取配置（自动初始化）
   */
  private async getConfig(): Promise<EpayConfig | null> {
    if (!this.config) {
      await this.initConfig();
    }
    return this.config;
  }

  /**
   * 生成签名
   * 算法：MD5(参数1=值1&参数2=值2&...&key=商户密钥)
   */
  private generateSign(params: Record<string, string>, key: string): string {
    // 1. 过滤空值和 sign 字段
    const filteredParams = Object.keys(params)
      .filter((k) => params[k] !== '' && params[k] !== undefined && k !== 'sign' && k !== 'sign_type')
      .sort()
      .reduce((acc, k) => {
        acc[k] = params[k];
        return acc;
      }, {} as Record<string, string>);

    // 2. 按 key 排序并拼接
    const sortedKeys = Object.keys(filteredParams).sort();
    // 易支付签名格式: md5(a=b&c=d&e=f + 密钥)，直接拼接密钥，不加 &key=
    const signStr = sortedKeys.map((k) => `${k}=${filteredParams[k]}`).join('&') + key;

    // 3. MD5 加密（小写）
    return crypto.createHash('md5').update(signStr, 'utf8').digest('hex');
  }

  /**
   * 验证签名
   */
  private verifySign(params: Record<string, string>, key: string): boolean {
    const sign = params.sign;
    if (!sign) return false;

    const calculatedSign = this.generateSign(params, key);
    return calculatedSign === sign;
  }

  /**
   * 创建支付请求
   */
  async createPurchase(params: PurchaseParams): Promise<PurchaseResult | null> {
    const config = await this.getConfig();
    if (!config) {
      throw new Error('支付配置未完成，请联系管理员');
    }

    // 构建请求参数
    const requestParams: Record<string, string> = {
      pid: config.epayId,
      type: params.type,
      out_trade_no: params.serviceTradeNo,
      notify_url: params.notifyUrl,
      return_url: params.returnUrl,
      name: params.name,
      money: params.money,
      sitename: 'LetAiCode', // 网站名称（可选）
    };

    // 如果指定了设备类型
    if (params.device) {
      requestParams.device = params.device;
    }

    // 生成签名
    requestParams.sign = this.generateSign(requestParams, config.epayKey);
    requestParams.sign_type = 'MD5';

    // 构建支付 URL
    const payUrl = `${config.payAddress}/submit.php`;

    return {
      url: payUrl,
      params: requestParams,
    };
  }

  /**
   * 验证回调通知
   */
  async verifyCallback(params: CallbackParams): Promise<VerifyResult> {
    const config = await this.getConfig();
    if (!config) {
      return {
        verifyStatus: false,
        tradeStatus: 'TRADE_CLOSED',
        serviceTradeNo: '',
        tradeNo: '',
        type: '',
        name: '',
        money: '',
        sign: '',
      };
    }

    // 验证签名
    const verifyStatus = this.verifySign(params, config.epayKey);

    return {
      verifyStatus,
      tradeStatus: params.trade_status || 'TRADE_CLOSED',
      serviceTradeNo: params.out_trade_no || '',
      tradeNo: params.trade_no || '',
      type: params.type || '',
      name: params.name || '',
      money: params.money || '',
      sign: params.sign || '',
    };
  }

  /**
   * 检查支付配置是否完成
   */
  async isConfigured(): Promise<boolean> {
    const config = await this.getConfig();
    return config !== null;
  }
}

// 导出单例
export const epayService = new EpayService();
