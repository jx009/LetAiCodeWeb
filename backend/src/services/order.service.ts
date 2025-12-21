/**
 * 订单服务
 * 负责订单创建、查询和支付处理
 */
import prisma from '@/utils/prisma';
import { logger } from '@/utils/logger.util';
import { PaymentStatus, Prisma } from '@prisma/client';
import { epayService } from './epay.service';
import optionService from './option.service';
import { subscriptionService } from './subscription.service';

// 订单锁（防止并发处理同一订单）
const orderLocks = new Map<string, Promise<void>>();

class OrderService {
  /**
   * 生成订单号
   * 格式：USR{userId前8位}NO{随机6位}{时间戳}
   */
  private generateOrderNo(userId: string): string {
    const userPrefix = userId.substring(0, 8);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const timestamp = Date.now();
    return `USR${userPrefix}NO${random}${timestamp}`;
  }

  /**
   * 生成订单过期时间（30分钟）
   */
  private generateExpiryTime(): Date {
    return new Date(Date.now() + 30 * 60 * 1000);
  }

  /**
   * 创建订单
   */
  async createOrder(userId: string, packageId: string) {
    try {
      // 1. 获取套餐信息
      const subscriptionPackage = await prisma.subscriptionPackage.findUnique({
        where: { id: packageId },
      });

      if (!subscriptionPackage) {
        throw new Error('套餐不存在');
      }

      if (!subscriptionPackage.active) {
        throw new Error('该套餐已下架');
      }

      // 2. 生成订单号
      const orderNo = this.generateOrderNo(userId);

      // 3. 创建订单
      const order = await prisma.paymentOrder.create({
        data: {
          orderNo,
          userId,
          packageId,
          amount: subscriptionPackage.price,
          status: PaymentStatus.PENDING,
          expiresAt: this.generateExpiryTime(),
        },
        include: {
          package: true,
        },
      });

      logger.info(`Created order ${order.orderNo} for user ${userId}`);
      return order;
    } catch (error) {
      logger.error('Error creating order:', error);
      throw error;
    }
  }

  /**
   * 获取用户的订单列表
   */
  async getUserOrders(userId: string, page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;

      const [orders, total] = await Promise.all([
        prisma.paymentOrder.findMany({
          where: { userId },
          include: {
            package: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),
        prisma.paymentOrder.count({
          where: { userId },
        }),
      ]);

      return {
        orders,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`Error fetching orders for user ${userId}:`, error);
      throw new Error('获取订单列表失败');
    }
  }

  /**
   * 获取订单详情
   */
  async getOrderById(orderId: string, userId: string) {
    try {
      const order = await prisma.paymentOrder.findFirst({
        where: {
          id: orderId,
          userId,
        },
        include: {
          package: true,
        },
      });

      if (!order) {
        throw new Error('订单不存在');
      }

      return order;
    } catch (error) {
      logger.error(`Error fetching order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * 发起支付（易支付）
   */
  async requestEpayPayment(
    orderNo: string,
    paymentMethod: string,
    callbackUrl: string,
    returnUrl: string
  ) {
    try {
      // 1. 检查支付配置
      const isConfigured = await epayService.isConfigured();
      if (!isConfigured) {
        throw new Error('支付功能未配置，请联系管理员');
      }

      // 2. 获取订单信息
      const order = await prisma.paymentOrder.findUnique({
        where: { orderNo },
        include: { package: true },
      });

      if (!order) {
        throw new Error('订单不存在');
      }

      if (order.status !== PaymentStatus.PENDING) {
        throw new Error('订单状态不正确');
      }

      // 检查订单是否过期
      if (new Date() > order.expiresAt) {
        await prisma.paymentOrder.update({
          where: { orderNo },
          data: { status: PaymentStatus.EXPIRED },
        });
        throw new Error('订单已过期');
      }

      // 3. 检查支付方式是否可用
      const payMethods = JSON.parse((await optionService.getOption('PayMethods')) || '[]');
      const methodExists = payMethods.some((m: any) => m.type === paymentMethod);
      if (!methodExists) {
        throw new Error('不支持的支付方式');
      }

      // 4. 创建易支付请求
      const result = await epayService.createPurchase({
        type: paymentMethod,
        serviceTradeNo: orderNo,
        name: order.package.name,
        money: order.amount.toString(),
        notifyUrl: callbackUrl,
        returnUrl: returnUrl,
        device: 'pc',
      });

      if (!result) {
        throw new Error('创建支付请求失败');
      }

      // 5. 更新订单支付方式
      await prisma.paymentOrder.update({
        where: { orderNo },
        data: { paymentMethod },
      });

      logger.info(`Created epay payment for order ${orderNo}, method: ${paymentMethod}`);
      return result;
    } catch (error) {
      logger.error(`Error requesting epay payment for order ${orderNo}:`, error);
      throw error;
    }
  }

  /**
   * 处理支付回调（易支付）
   */
  async handleEpayCallback(params: Record<string, string>): Promise<boolean> {
    // 1. 验证签名
    const verifyResult = await epayService.verifyCallback(params);
    if (!verifyResult.verifyStatus) {
      logger.error('Epay callback signature verification failed', params);
      return false;
    }

    // 2. 检查交易状态
    if (verifyResult.tradeStatus !== 'TRADE_SUCCESS') {
      logger.warn(`Epay callback status not success: ${verifyResult.tradeStatus}`, verifyResult);
      return false;
    }

    const orderNo = verifyResult.serviceTradeNo;

    // 3. 使用订单锁防止并发
    const existingLock = orderLocks.get(orderNo);
    if (existingLock) {
      await existingLock;
      return true;
    }

    // 创建新锁
    const lockPromise = this.processPaymentSuccess(orderNo, verifyResult.tradeNo);
    orderLocks.set(orderNo, lockPromise);

    try {
      await lockPromise;
      return true;
    } finally {
      orderLocks.delete(orderNo);
    }
  }

  /**
   * 处理支付成功（内部方法）
   * 新逻辑：支付成功后创建/续费订阅
   */
  private async processPaymentSuccess(orderNo: string, transactionId: string): Promise<void> {
    try {
      // 1. 查询订单
      const order = await prisma.paymentOrder.findUnique({
        where: { orderNo },
        include: { package: true },
      });

      if (!order) {
        logger.error(`Order not found: ${orderNo}`);
        return;
      }

      // 2. 检查订单状态（防止重复处理）
      if (order.status !== PaymentStatus.PENDING) {
        logger.info(`Order ${orderNo} already processed, status: ${order.status}`);
        return;
      }

      // 3. 更新订单状态
      await prisma.paymentOrder.update({
        where: { orderNo },
        data: {
          status: PaymentStatus.PAID,
          paidAt: new Date(),
          transactionId,
        },
      });

      // 4. 创建/续费订阅
      await subscriptionService.createSubscription(order.userId, order.packageId, order.id);

      logger.info(
        `Order ${orderNo} paid successfully, subscription created/renewed for user ${order.userId}`
      );
    } catch (error) {
      logger.error(`Error processing payment success for order ${orderNo}:`, error);
      throw error;
    }
  }

  /**
   * 取消订单
   */
  async cancelOrder(orderId: string, userId: string) {
    try {
      const order = await prisma.paymentOrder.findFirst({
        where: {
          id: orderId,
          userId,
        },
      });

      if (!order) {
        throw new Error('订单不存在');
      }

      if (order.status !== PaymentStatus.PENDING) {
        throw new Error('只能取消待支付的订单');
      }

      await prisma.paymentOrder.update({
        where: { id: orderId },
        data: {
          status: PaymentStatus.CANCELLED,
        },
      });

      logger.info(`Order ${orderId} cancelled by user ${userId}`);
      return { success: true, message: '订单已取消' };
    } catch (error) {
      logger.error(`Error cancelling order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * 获取支付配置信息
   */
  async getPaymentInfo() {
    try {
      const isConfigured = await epayService.isConfigured();
      const paymentConfig = await optionService.getPaymentConfig();

      return {
        enableOnlineTopup: isConfigured,
        payMethods: paymentConfig.payMethods,
        minTopUp: paymentConfig.minTopUp,
      };
    } catch (error) {
      logger.error('Error getting payment info:', error);
      throw new Error('获取支付配置失败');
    }
  }

  /**
   * 根据订单号查询订单
   */
  async getOrderByOrderNo(orderNo: string) {
    try {
      const order = await prisma.paymentOrder.findUnique({
        where: { orderNo },
        include: { package: true },
      });

      if (!order) {
        throw new Error('订单不存在');
      }

      return order;
    } catch (error) {
      logger.error(`Error fetching order by orderNo ${orderNo}:`, error);
      throw error;
    }
  }
}

export const orderService = new OrderService();
