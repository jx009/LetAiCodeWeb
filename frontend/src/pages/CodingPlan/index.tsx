/**
 * Coding Plan 订阅页（首页）
 * 支持按周期选择套餐，显示订阅状态
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  message,
  Spin,
  Segmented,
  Tag,
  Progress,
  Space,
  Typography,
  Modal,
  Alert,
} from 'antd';
import {
  CheckOutlined,
  CrownOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { getPackagesByCycle, type SubscriptionPackage, type PackageCycle } from '@/api/packages';
import { getSubscription, getBalance, type SubscriptionDetail, type CreditBalanceInfo } from '@/api/subscription';
import { createOrder } from '@/api/recharge';
import './styles.less';

const { Text, Title } = Typography;

// 周期选项配置
const CYCLE_OPTIONS = [
  { label: '按周', value: 'WEEK' as PackageCycle },
  { label: '按月', value: 'MONTH' as PackageCycle },
  { label: '按季', value: 'QUARTER' as PackageCycle },
  { label: '按年', value: 'YEAR' as PackageCycle },
];

const CYCLE_LABELS: Record<PackageCycle, string> = {
  WEEK: '周',
  MONTH: '月',
  QUARTER: '季',
  YEAR: '年',
};

const CodingPlan: React.FC = () => {
  const [packages, setPackages] = useState<Record<PackageCycle, SubscriptionPackage[]>>({
    WEEK: [],
    MONTH: [],
    QUARTER: [],
    YEAR: [],
  });
  const [selectedCycle, setSelectedCycle] = useState<PackageCycle>('MONTH');
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionDetail | null>(null);
  const [creditBalance, setCreditBalance] = useState<CreditBalanceInfo | null>(null);

  /**
   * 加载数据
   */
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPackages(),
        fetchSubscription(),
        fetchBalance(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const response = await getPackagesByCycle();
      if (response.success && response.data) {
        setPackages(response.data);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取套餐列表失败');
    }
  };

  const fetchSubscription = async () => {
    try {
      const response = await getSubscription();
      if (response.success) {
        setSubscription(response.data || null);
      }
    } catch (error: any) {
      console.error('获取订阅信息失败:', error);
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await getBalance();
      if (response.success && response.data) {
        setCreditBalance(response.data);
      }
    } catch (error: any) {
      console.error('获取积分余额失败:', error);
    }
  };

  /**
   * 购买套餐
   */
  const handlePurchase = async (packageId: string) => {
    // 如果已有订阅，提示确认
    if (subscription && subscription.status === 'ACTIVE') {
      Modal.confirm({
        title: '确认购买',
        content: '您当前有有效订阅，购买新套餐将延长订阅时间。确定要继续吗？',
        okText: '继续购买',
        cancelText: '取消',
        onOk: () => processPurchase(packageId),
      });
    } else {
      await processPurchase(packageId);
    }
  };

  const processPurchase = async (packageId: string) => {
    try {
      setPurchasing(packageId);

      const orderResponse = await createOrder(packageId);
      if (!orderResponse.success || !orderResponse.data) {
        throw new Error(orderResponse.message || '创建订单失败');
      }

      const order = orderResponse.data;

      // 如果有支付链接，跳转到支付页面
      if (order.payUrl) {
        message.loading('正在跳转到支付页面...', 1);
        window.location.href = order.payUrl;
      } else {
        message.success(`订单创建成功！订单号：${order.orderNo}`);
      }
    } catch (error: any) {
      message.error(error.message || '购买失败');
    } finally {
      setPurchasing(null);
    }
  };

  /**
   * 获取当前周期的套餐列表
   */
  const currentPackages = packages[selectedCycle] || [];

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
          Coding Plan 是专为 AI 赋能编程设计的订阅包。选择适合您的套餐，享受持续的 AI 编程助力。
        </p>
      </div>

      {/* 当前订阅状态 */}
      {(subscription || creditBalance) && (
        <SubscriptionStatusCard
          subscription={subscription}
          creditBalance={creditBalance}
          onRefresh={fetchData}
        />
      )}

      {/* 周期选择器 */}
      <div className="cycle-selector">
        <Segmented
          options={CYCLE_OPTIONS}
          value={selectedCycle}
          onChange={(value) => setSelectedCycle(value as PackageCycle)}
          size="large"
        />
        {selectedCycle !== 'MONTH' && (
          <div className="cycle-hint">
            <ThunderboltOutlined /> 选择更长周期可享受更多优惠
          </div>
        )}
      </div>

      {/* 套餐卡片 */}
      <div className="packages-grid">
        {currentPackages.length === 0 ? (
          <div className="no-packages">
            <Text type="secondary">当前周期暂无可用套餐</Text>
          </div>
        ) : (
          currentPackages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              package={pkg}
              cycle={selectedCycle}
              purchasing={purchasing === pkg.id}
              isCurrentPlan={subscription?.packageId === pkg.id}
              onPurchase={() => handlePurchase(pkg.id)}
            />
          ))
        )}
      </div>

      {/* 底部说明 */}
      <div className="page-footer">
        <div className="footer-content">
          <h3>关于积分机制</h3>
          <ul>
            <li>
              <strong>基础积分（天花板）</strong>：您的积分上限，每日凌晨会重置到此值
            </li>
            <li>
              <strong>每小时补充</strong>：积分不足天花板时，每小时自动补充指定数量
            </li>
            <li>
              <strong>展示积分</strong>：月度参考值 = 基础积分 × 30 + 补充积分 × 24 × 30
            </li>
            <li>订阅期内享受持续的积分补充，让您无忧编程</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

/**
 * 订阅状态卡片
 */
interface SubscriptionStatusProps {
  subscription: SubscriptionDetail | null;
  creditBalance: CreditBalanceInfo | null;
  onRefresh: () => void;
}

const SubscriptionStatusCard: React.FC<SubscriptionStatusProps> = ({
  subscription,
  creditBalance,
  onRefresh,
}) => {
  const isActive = subscription?.status === 'ACTIVE';
  const creditPercent = creditBalance
    ? Math.min(100, (creditBalance.currentCredits / creditBalance.baseCredits) * 100)
    : 0;

  return (
    <Card className="subscription-status-card">
      <div className="status-header">
        <div className="status-left">
          <Space>
            <CrownOutlined className={`crown-icon ${isActive ? 'active' : ''}`} />
            <div>
              <Title level={4} style={{ margin: 0 }}>
                {isActive ? subscription.package.name : '暂无订阅'}
              </Title>
              {isActive && (
                <Text type="secondary">
                  剩余 {subscription.daysRemaining} 天 ·
                  到期时间：{new Date(subscription.endDate).toLocaleDateString()}
                </Text>
              )}
            </div>
          </Space>
        </div>
        <Button icon={<ReloadOutlined />} onClick={onRefresh}>
          刷新
        </Button>
      </div>

      {creditBalance && (
        <div className="credit-info">
          <div className="credit-main">
            <div className="credit-current">
              <Text className="credit-label">当前积分</Text>
              <div className="credit-value">
                {creditBalance.currentCredits.toLocaleString()}
                <Text type="secondary" className="credit-max">
                  / {creditBalance.baseCredits.toLocaleString()}
                </Text>
              </div>
            </div>
            <Progress
              percent={creditPercent}
              showInfo={false}
              strokeColor={{
                '0%': '#24be58',
                '100%': '#21AF51',
              }}
              trailColor="#f0f0f0"
              strokeWidth={8}
            />
          </div>

          <div className="credit-details">
            <div className="detail-item">
              <ThunderboltOutlined />
              <Text>每小时补充：{creditBalance.replenishCredits.toLocaleString()}</Text>
            </div>
            {creditBalance.nextReplenishAt && (
              <div className="detail-item">
                <ClockCircleOutlined />
                <Text>
                  下次补充：{new Date(creditBalance.nextReplenishAt).toLocaleTimeString()}
                </Text>
              </div>
            )}
          </div>

          {!creditBalance.hasSubscription && (
            <Alert
              message="您当前没有有效订阅，积分不会自动补充"
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </div>
      )}
    </Card>
  );
};

/**
 * 套餐卡片组件
 */
interface PackageCardProps {
  package: SubscriptionPackage;
  cycle: PackageCycle;
  purchasing: boolean;
  isCurrentPlan: boolean;
  onPurchase: () => void;
}

const PackageCard: React.FC<PackageCardProps> = ({
  package: pkg,
  cycle,
  purchasing,
  isCurrentPlan,
  onPurchase,
}) => {
  const features = [
    `基础积分（天花板）：${pkg.baseCredits.toLocaleString()}`,
    `每小时补充：${pkg.replenishCredits.toLocaleString()}`,
    `有效期：${pkg.cycleDays} 天`,
  ];

  return (
    <Card className={`package-card ${pkg.recommended ? 'recommended' : ''} ${isCurrentPlan ? 'current' : ''}`} bordered={false}>
      {/* 推荐标签 */}
      {pkg.recommended && (
        <div className="recommended-badge">
          <CrownOutlined /> 推荐
        </div>
      )}

      {/* 当前套餐标签 */}
      {isCurrentPlan && (
        <div className="current-badge">
          当前套餐
        </div>
      )}

      {/* 套餐名称 */}
      <div className="package-header">
        <h2 className="package-name">{pkg.name}</h2>
        {pkg.desc && <p className="package-description">{pkg.desc}</p>}
      </div>

      {/* 价格 */}
      <div className="package-price">
        <span className="price-currency">¥</span>
        <span className="price-amount">{pkg.price}</span>
        <span className="price-unit">/{CYCLE_LABELS[cycle]}</span>
      </div>

      {/* 省钱标签 */}
      {pkg.savingsPercentage > 0 && (
        <div className="savings-tag">
          <Tag color="green">
            相比月付省 {pkg.savingsPercentage}%
          </Tag>
          <Text type="secondary" className="monthly-price">
            月均 ¥{pkg.monthlyPrice?.toFixed(2)}
          </Text>
        </div>
      )}

      {/* 展示积分 */}
      <div className="package-credits">
        <span className="credits-amount">{pkg.displayCredits?.toLocaleString()}</span>
        <span className="credits-unit"> 积分/月</span>
        <Text type="secondary" className="credits-note">
          （月度参考值）
        </Text>
      </div>

      {/* 特性列表 */}
      <ul className="package-features">
        {features.map((feature, index) => (
          <li key={index} className="feature-item">
            <CheckOutlined className="feature-icon" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* 购买按钮 */}
      <Button
        type="primary"
        size="large"
        block
        className="purchase-button"
        loading={purchasing}
        onClick={onPurchase}
      >
        {isCurrentPlan ? '续订' : '立即订阅'}
      </Button>
    </Card>
  );
};

export default CodingPlan;
