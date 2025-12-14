/**
 * Coding Plan 套餐页（首页）
 * 完全复刻 MiniMAXI Coding Plan 页面设计
 */
import React, { useState, useEffect } from 'react';
import { Card, Button, message, Spin } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { getPackagePlans, createOrder } from '@/api/recharge';
import type { PackagePlan } from '@/types';
import './styles.less';

const CodingPlan: React.FC = () => {
  const [packages, setPackages] = useState<PackagePlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  /**
   * 加载套餐列表
   */
  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await getPackagePlans();
      if (response.success) {
        setPackages(response.data || []);
      }
    } catch (error: any) {
      message.error(error.message || '获取套餐列表失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 购买套餐
   */
  const handlePurchase = async (packageId: string) => {
    try {
      setPurchasing(packageId);

      // 1. 创建订单
      const orderResponse = await createOrder(packageId);
      if (!orderResponse.success || !orderResponse.data) {
        throw new Error(orderResponse.message || '创建订单失败');
      }

      const order = orderResponse.data;

      // 2. 显示订单创建成功消息
      message.success(`订单创建成功！订单号：${order.orderNo}，请前往支付页面完成支付。`);
      // TODO: 实际项目中应跳转到支付页面
      // navigate(`/payment/${order.id}`);
    } catch (error: any) {
      message.error(error.message || '购买失败');
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="coding-plan-page">
      {/* 页面标题 */}
      <div className="page-header">
        <h1 className="page-title">Coding Plan</h1>
        <p className="page-subtitle">
          Coding Plan 是专为 AI 赋能编程设计的订阅包。所有 Coding Plan 均配备强大的 AI 模型。
        </p>
      </div>

      {/* 套餐卡片 */}
      <div className="packages-grid">
        {packages.map((pkg) => (
          <PackageCard
            key={pkg.id}
            package={pkg}
            purchasing={purchasing === pkg.id}
            onPurchase={() => handlePurchase(pkg.id)}
          />
        ))}
      </div>

      {/* 底部说明 */}
      <div className="page-footer">
        <div className="footer-content">
          <h3>关于积分</h3>
          <ul>
            <li>购买套餐后，积分将立即充值到您的账户</li>
            <li>积分可用于调用 API 服务，不同模型消耗积分不同</li>
            <li>积分永久有效，不会过期</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

/**
 * 套餐卡片组件（完全复刻 MiniMAXI 设计）
 */
interface PackageCardProps {
  package: PackagePlan;
  purchasing: boolean;
  onPurchase: () => void;
}

const PackageCard: React.FC<PackageCardProps> = ({ package: pkg, purchasing, onPurchase }) => {
  // Note: features field doesn't exist in database schema
  const features: string[] = [];

  return (
    <Card className="package-card" bordered={false}>
      {/* 套餐名称 */}
      <div className="package-header">
        <h2 className="package-name">{pkg.name}</h2>
        {pkg.desc && <p className="package-description">{pkg.desc}</p>}
      </div>

      {/* 价格 */}
      <div className="package-price">
        <span className="price-currency">¥</span>
        <span className="price-amount">{pkg.price}</span>
        <span className="price-unit">/次</span>
      </div>

      {/* 积分数量 */}
      <div className="package-credits">
        <span className="credits-amount">{pkg.creditAmount.toLocaleString()}</span>
        <span className="credits-unit"> 积分</span>
      </div>

      {/* 特性列表 */}
      {features.length > 0 && (
        <ul className="package-features">
          {features.map((feature, index) => (
            <li key={index} className="feature-item">
              <CheckOutlined className="feature-icon" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      )}

      {/* 购买按钮 */}
      <Button
        type="primary"
        size="large"
        block
        className="purchase-button"
        loading={purchasing}
        onClick={onPurchase}
      >
        立即购买
      </Button>
    </Card>
  );
};

export default CodingPlan;
