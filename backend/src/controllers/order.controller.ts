/**
 * 订单控制器
 * 处理订单相关的 HTTP 请求
 */
import { Request, Response } from 'express';
import { orderService } from '@/services/order.service';
import { logger } from '@/utils/logger.util';

class OrderController {
  /**
   * 获取支付配置信息
   */
  async getPaymentInfo(req: Request, res: Response) {
    try {
      const info = await orderService.getPaymentInfo();

      res.json({
        success: true,
        data: info,
      });
    } catch (error: any) {
      logger.error('Error in getPaymentInfo:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取支付配置失败',
      });
    }
  }

  /**
   * 创建订单
   */
  async createOrder(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { packageId } = req.body;

      if (!packageId) {
        return res.status(400).json({
          success: false,
          message: '缺少套餐ID',
        });
      }

      const order = await orderService.createOrder(userId, packageId);

      res.status(201).json({
        success: true,
        message: '订单创建成功',
        data: order,
      });
    } catch (error: any) {
      logger.error('Error in createOrder:', error);
      res.status(500).json({
        success: false,
        message: error.message || '创建订单失败',
      });
    }
  }

  /**
   * 获取用户订单列表
   */
  async getUserOrders(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await orderService.getUserOrders(userId, page, limit);

      res.json({
        success: true,
        data: result.orders,
        pagination: result.pagination,
      });
    } catch (error: any) {
      logger.error('Error in getUserOrders:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取订单列表失败',
      });
    }
  }

  /**
   * 获取订单详情
   */
  async getOrderById(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const order = await orderService.getOrderById(id, userId);

      res.json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      logger.error('Error in getOrderById:', error);
      res.status(404).json({
        success: false,
        message: error.message || '获取订单详情失败',
      });
    }
  }

  /**
   * 取消订单
   */
  async cancelOrder(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const result = await orderService.cancelOrder(id, userId);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      logger.error('Error in cancelOrder:', error);
      res.status(500).json({
        success: false,
        message: error.message || '取消订单失败',
      });
    }
  }

  /**
   * 发起支付请求
   */
  async requestPayment(req: Request, res: Response) {
    try {
      const { orderNo, paymentMethod } = req.body;

      if (!orderNo || !paymentMethod) {
        return res.status(400).json({
          success: false,
          message: '缺少订单号或支付方式',
        });
      }

      // 构建回调URL
      const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
      const callbackUrl = `${baseUrl}/api/payment/epay/callback`;
      const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders`;

      const result = await orderService.requestEpayPayment(
        orderNo,
        paymentMethod,
        callbackUrl,
        returnUrl
      );

      res.json({
        success: true,
        message: '支付请求创建成功',
        data: result,
      });
    } catch (error: any) {
      logger.error('Error in requestPayment:', error);
      res.status(500).json({
        success: false,
        message: error.message || '创建支付请求失败',
      });
    }
  }

  /**
   * 根据订单号查询订单
   */
  async getOrderByOrderNo(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { orderNo } = req.params;

      const order = await orderService.getOrderByOrderNo(orderNo);

      // 验证订单归属
      if (order.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: '无权访问此订单',
        });
      }

      res.json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      logger.error('Error in getOrderByOrderNo:', error);
      res.status(404).json({
        success: false,
        message: error.message || '获取订单详情失败',
      });
    }
  }
}

export const orderController = new OrderController();
