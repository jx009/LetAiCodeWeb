import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Radio,
  message,
  Spin,
  Typography,
  Space,
} from 'antd';
import { WalletOutlined, AlipayCircleOutlined, WechatOutlined } from '@ant-design/icons';
import { getPackagePlans, createOrder, requestPayment, getPaymentInfo } from '@/api/recharge';
import type { PackagePlan } from '@/types';
import type { PaymentInfo } from '@/api/recharge';

const { Title, Text, Paragraph } = Typography;

/**
 * 充值页面
 * 支持套餐选择 + 在线支付
 */
const Recharge = () => {
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<PackagePlan[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [selectedPayMethod, setSelectedPayMethod] = useState<string>('');
  // const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  // const [paymentFormHtml, setPaymentFormHtml] = useState<string>('');

  // 加载套餐列表
  useEffect(() => {
    loadPackages();
    loadPaymentInfo();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const res = await getPackagePlans();
      if (res.success && res.data) {
        // 按 sortOrder 排序
        const sortedPackages = [...res.data].sort((a, b) => a.sortOrder - b.sortOrder);
        setPackages(sortedPackages.filter((p) => p.active));
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载套餐失败');
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentInfo = async () => {
    try {
      const res = await getPaymentInfo();
      if (res.success && res.data) {
        setPaymentInfo(res.data);
        // 默认选择第一个支付方式
        if (res.data.payMethods.length > 0) {
          setSelectedPayMethod(res.data.payMethods[0].type);
        }
      }
    } catch (error: any) {
      console.error('加载支付配置失败:', error);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage) {
      message.warning('请选择充值套餐');
      return;
    }

    if (!paymentInfo?.enableOnlineTopup) {
      message.error('支付功能未配置，请联系管理员');
      return;
    }

    if (!selectedPayMethod) {
      message.warning('请选择支付方式');
      return;
    }

    try {
      setLoading(true);

      // 1. 创建订单
      const orderRes = await createOrder(selectedPackage);
      if (!orderRes.success || !orderRes.data) {
        throw new Error(orderRes.message || '创建订单失败');
      }

      const order = orderRes.data;

      // 2. 发起支付请求
      const payRes = await requestPayment({
        orderNo: order.orderNo,
        paymentMethod: selectedPayMethod,
      });

      if (!payRes.success || !payRes.data) {
        throw new Error(payRes.message || '创建支付请求失败');
      }

      const paymentData = payRes.data;

      // 3. 构建支付表单并自动提交
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = paymentData.url;
      form.target = '_blank'; // 在新窗口打开

      Object.keys(paymentData.params).forEach((key) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = paymentData.params[key];
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);

      message.success('已跳转到支付页面，请完成支付');
    } catch (error: any) {
      message.error(error.message || error.response?.data?.message || '发起支付失败');
    } finally {
      setLoading(false);
    }
  };

  const getPayMethodIcon = (type: string) => {
    switch (type) {
      case 'alipay':
        return <AlipayCircleOutlined style={{ fontSize: 24 }} />;
      case 'wxpay':
        return <WechatOutlined style={{ fontSize: 24 }} />;
      default:
        return <WalletOutlined style={{ fontSize: 24 }} />;
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={2}>
              <WalletOutlined /> 充值中心
            </Title>
            <Paragraph type="secondary">选择充值套餐，快速为您的账户充值积分</Paragraph>
          </div>

          {/* 套餐选择 */}
          <div>
            <Title level={4}>选择充值套餐</Title>
            <Spin spinning={loading}>
              <Row gutter={[16, 16]}>
                {packages.map((pkg) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={pkg.id}>
                    <Card
                      hoverable
                      style={{
                        borderColor: selectedPackage === pkg.id ? '#1890ff' : undefined,
                        borderWidth: selectedPackage === pkg.id ? 2 : 1,
                      }}
                      onClick={() => setSelectedPackage(pkg.id)}
                    >
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Title level={4} style={{ margin: 0 }}>
                          {pkg.name}
                        </Title>
                        <div>
                          <Text type="danger" strong style={{ fontSize: 24 }}>
                            ¥{pkg.price}
                          </Text>
                        </div>
                        <div>
                          <Text type="secondary">月积分量：</Text>
                          <Text strong>{(pkg.displayCredits ?? (pkg.baseCredits * 30 + pkg.replenishCredits * 24 * 30))?.toLocaleString()}</Text>
                        </div>
                        <div>
                          <Text type="secondary">基础积分：</Text>
                          <Text>{pkg.baseCredits?.toLocaleString()}</Text>
                          <Text type="secondary" style={{ marginLeft: 8 }}>补充/h：</Text>
                          <Text>{pkg.replenishCredits?.toLocaleString()}</Text>
                        </div>
                        {pkg.desc && (
                          <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ margin: 0 }}>
                            {pkg.desc}
                          </Paragraph>
                        )}
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Spin>
          </div>

          {/* 支付方式选择 */}
          {paymentInfo?.enableOnlineTopup && (
            <div>
              <Title level={4}>选择支付方式</Title>
              <Radio.Group
                value={selectedPayMethod}
                onChange={(e) => setSelectedPayMethod(e.target.value)}
                style={{ width: '100%' }}
              >
                <Row gutter={[16, 16]}>
                  {paymentInfo.payMethods.map((method) => (
                    <Col xs={24} sm={12} md={8} key={method.type}>
                      <Radio.Button
                        value={method.type}
                        style={{
                          width: '100%',
                          height: 60,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Space>
                          {getPayMethodIcon(method.type)}
                          <Text strong>{method.name}</Text>
                        </Space>
                      </Radio.Button>
                    </Col>
                  ))}
                </Row>
              </Radio.Group>
            </div>
          )}

          {/* 购买按钮 */}
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button
              type="primary"
              size="large"
              onClick={handlePurchase}
              loading={loading}
              disabled={!selectedPackage || (paymentInfo?.enableOnlineTopup && !selectedPayMethod)}
              style={{ minWidth: 200 }}
            >
              立即支付
            </Button>
          </div>

          {/* 温馨提示 */}
          <Card size="small" style={{ backgroundColor: '#f0f2f5' }}>
            <Title level={5}>温馨提示</Title>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>充值成功后，积分将自动到账</li>
              <li>如有疑问，请联系客服</li>
              <li>充值遇到问题？请刷新页面重试或联系客服</li>
            </ul>
          </Card>
        </Space>
      </Card>
    </div>
  );
};

export default Recharge;
