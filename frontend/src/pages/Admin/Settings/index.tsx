import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  Space,
  message,
  Typography,
  Tabs,
  Select,
  Alert,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  SettingOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  DollarOutlined,
  GiftOutlined,
} from '@ant-design/icons';
import {
  getPaymentConfig,
  updatePaymentConfig,
  validatePaymentConfig,
  getCreditConfig,
  updateCreditConfig,
} from '@/api/admin';
import type { PaymentConfig, CreditConfig } from '@/api/admin';

const { Title, Text, Paragraph } = Typography;

/**
 * 系统配置页面（超级管理员）
 */
const AdminSettings = () => {
  const [loading, setLoading] = useState(false);
  const [paymentForm] = Form.useForm();
  const [creditForm] = Form.useForm();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [creditConfig, setCreditConfig] = useState<CreditConfig | null>(null);
  const [paymentValid, setPaymentValid] = useState<boolean | null>(null);
  const [payMethods, setPayMethods] = useState<
    Array<{ name: string; type: string; color: string }>
  >([]);

  useEffect(() => {
    loadPaymentConfig();
    loadCreditConfig();
  }, []);

  const loadPaymentConfig = async () => {
    try {
      setLoading(true);
      const res = await getPaymentConfig();
      if (res.success && res.data) {
        const config = res.data;
        setPaymentConfig(config);
        setPayMethods(config.payMethods || []);
        paymentForm.setFieldsValue({
          payAddress: config.payAddress,
          epayId: config.epayId,
          epayKey: config.epayKey,
          minTopUp: config.minTopUp,
        });
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleValidatePayment = async () => {
    try {
      const res = await validatePaymentConfig();
      if (res.success && res.data) {
        setPaymentValid(res.data.valid);
        if (res.data.valid) {
          message.success('支付配置验证通过');
        } else {
          message.error(res.data.message || '支付配置验证失败');
        }
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '验证失败');
      setPaymentValid(false);
    }
  };

  const handleSavePayment = async () => {
    try {
      const values = await paymentForm.validateFields();
      setLoading(true);

      const config: PaymentConfig = {
        payAddress: values.payAddress,
        epayId: values.epayId,
        epayKey: values.epayKey,
        minTopUp: values.minTopUp,
        payMethods: payMethods,
      };

      await updatePaymentConfig(config);
      message.success('保存成功');
      setPaymentValid(null); // 重置验证状态
      loadPaymentConfig();
    } catch (error: any) {
      message.error(error.response?.data?.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const addPayMethod = () => {
    setPayMethods([
      ...payMethods,
      { name: '新支付方式', type: 'alipay', color: 'rgba(var(--semi-blue-5), 1)' },
    ]);
  };

  const removePayMethod = (index: number) => {
    setPayMethods(payMethods.filter((_, i) => i !== index));
  };

  const updatePayMethod = (index: number, field: string, value: string) => {
    const newMethods = [...payMethods];
    newMethods[index] = { ...newMethods[index], [field]: value };
    setPayMethods(newMethods);
  };

  // 加载积分配置
  const loadCreditConfig = async () => {
    try {
      const res = await getCreditConfig();
      if (res.success && res.data) {
        setCreditConfig(res.data);
        creditForm.setFieldsValue({
          usdToCreditsRate: res.data.usdToCreditsRate,
          freeQuota: res.data.freeQuota,
        });
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载积分配置失败');
    }
  };

  // 保存积分配置
  const handleSaveCredit = async () => {
    try {
      const values = await creditForm.validateFields();
      setLoading(true);

      await updateCreditConfig({
        usdToCreditsRate: values.usdToCreditsRate,
        freeQuota: values.freeQuota,
      });
      message.success('积分配置保存成功');
      loadCreditConfig();
    } catch (error: any) {
      message.error(error.response?.data?.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const paymentMethodTypes = [
    { label: '支付宝', value: 'alipay' },
    { label: '微信支付', value: 'wxpay' },
    { label: 'QQ钱包', value: 'qqpay' },
  ];

  const tabItems = [
    {
      key: 'payment',
      label: '支付配置',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 配置状态 */}
          {paymentValid !== null && (
            <Alert
              message={paymentValid ? '配置验证通过' : '配置验证失败'}
              description={
                paymentValid ? '易支付配置已正确配置，可以正常使用' : '请检查配置信息是否正确'
              }
              type={paymentValid ? 'success' : 'error'}
              showIcon
              icon={paymentValid ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
              closable
            />
          )}

          {/* 易支付配置 */}
          <Card title="易支付配置" size="small">
            <Form form={paymentForm} layout="vertical">
              <Form.Item
                label="易支付网关地址"
                name="payAddress"
                rules={[{ required: true, message: '请输入易支付网关地址' }]}
                extra="例如：https://pay.example.com"
              >
                <Input placeholder="https://pay.example.com" />
              </Form.Item>

              <Form.Item
                label="商户ID"
                name="epayId"
                rules={[{ required: true, message: '请输入商户ID' }]}
                extra="易支付商户后台获取"
              >
                <Input placeholder="merchant_id" />
              </Form.Item>

              <Form.Item
                label="商户密钥"
                name="epayKey"
                rules={[{ required: true, message: '请输入商户密钥' }]}
                extra="易支付商户后台获取，请妥善保管"
              >
                <Input.Password placeholder="merchant_key" />
              </Form.Item>

              <Form.Item
                label="最小充值金额"
                name="minTopUp"
                rules={[{ required: true, message: '请输入最小充值金额' }]}
                extra="用户充值的最小金额限制（元）"
              >
                <Input type="number" placeholder="1" addonAfter="元" />
              </Form.Item>
            </Form>
          </Card>

          {/* 支付方式配置 */}
          <Card
            title="支付方式"
            size="small"
            extra={
              <Button type="dashed" icon={<PlusOutlined />} onClick={addPayMethod}>
                添加支付方式
              </Button>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {payMethods.map((method, index) => (
                <Card key={index} size="small" type="inner">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                      <Text strong>支付方式 {index + 1}</Text>
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => removePayMethod(index)}
                      >
                        删除
                      </Button>
                    </Space>

                    <Space wrap>
                      <div>
                        <Text type="secondary">名称：</Text>
                        <Input
                          style={{ width: 150 }}
                          value={method.name}
                          onChange={(e) => updatePayMethod(index, 'name', e.target.value)}
                          placeholder="支付宝"
                        />
                      </div>
                      <div>
                        <Text type="secondary">类型：</Text>
                        <Select
                          style={{ width: 150 }}
                          value={method.type}
                          onChange={(value) => updatePayMethod(index, 'type', value)}
                        >
                          {paymentMethodTypes.map((type) => (
                            <Select.Option key={type.value} value={type.value}>
                              {type.label}
                            </Select.Option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <Text type="secondary">颜色：</Text>
                        <Input
                          style={{ width: 200 }}
                          value={method.color}
                          onChange={(e) => updatePayMethod(index, 'color', e.target.value)}
                          placeholder="rgba(var(--semi-blue-5), 1)"
                        />
                      </div>
                    </Space>
                  </Space>
                </Card>
              ))}

              {payMethods.length === 0 && (
                <Alert
                  message="暂无支付方式"
                  description="请至少添加一种支付方式"
                  type="warning"
                  showIcon
                />
              )}
            </Space>
          </Card>

          {/* 操作按钮 */}
          <Space>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSavePayment} loading={loading}>
              保存配置
            </Button>
            <Button icon={<CheckCircleOutlined />} onClick={handleValidatePayment}>
              验证配置
            </Button>
            <Button onClick={loadPaymentConfig}>重置</Button>
          </Space>

          {/* 配置说明 */}
          <Card title="配置说明" size="small" type="inner">
            <Paragraph>
              <ul>
                <li>
                  <Text strong>易支付网关地址</Text>：您的易支付平台网址，通常为 https://pay.xxx.com
                </li>
                <li>
                  <Text strong>商户ID</Text>：易支付商户后台提供的商户标识
                </li>
                <li>
                  <Text strong>商户密钥</Text>
                  ：用于签名验证，请妥善保管，不要泄露给他人
                </li>
                <li>
                  <Text strong>支付方式</Text>
                  ：支持的支付方式，需要在易支付商户后台开通对应的支付渠道
                </li>
              </ul>
            </Paragraph>

            <Alert
              message="安全提示"
              description="商户密钥非常重要，泄露后可能导致资金损失。建议定期更换密钥。"
              type="warning"
              showIcon
            />
          </Card>
        </Space>
      ),
    },
    {
      key: 'credit',
      label: '积分配置',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 当前配置概览 */}
          {creditConfig && (
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Card>
                  <Statistic
                    title="美元兑积分汇率"
                    value={creditConfig.usdToCreditsRate}
                    prefix={<DollarOutlined />}
                    suffix="积分/美元"
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12}>
                <Card>
                  <Statistic
                    title="新用户赠送积分"
                    value={creditConfig.freeQuota}
                    prefix={<GiftOutlined />}
                    suffix="积分"
                  />
                </Card>
              </Col>
            </Row>
          )}

          {/* 积分配置表单 */}
          <Card title="积分换算配置" size="small">
            <Form form={creditForm} layout="vertical">
              <Form.Item
                label="美元兑积分汇率"
                name="usdToCreditsRate"
                rules={[{ required: true, message: '请输入汇率' }]}
                extra="1美元等于多少积分。例如：1000 表示 1美元 = 1000积分"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  max={1000000}
                  placeholder="1000"
                  addonAfter="积分/美元"
                />
              </Form.Item>

              <Form.Item
                label="新用户赠送积分"
                name="freeQuota"
                rules={[{ required: true, message: '请输入赠送积分数量' }]}
                extra="新用户注册时自动赠送的积分数量"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={10000000}
                  placeholder="10000"
                  addonAfter="积分"
                />
              </Form.Item>
            </Form>
          </Card>

          {/* 操作按钮 */}
          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSaveCredit}
              loading={loading}
            >
              保存配置
            </Button>
            <Button onClick={loadCreditConfig}>重置</Button>
          </Space>

          {/* 配置说明 */}
          <Card title="配置说明" size="small" type="inner">
            <Paragraph>
              <ul>
                <li>
                  <Text strong>美元兑积分汇率</Text>：每次 API 调用时，系统会根据 new-api 返回的美元消耗金额，
                  按照此汇率换算成积分进行扣除。例如：汇率为 1000，API 调用消耗 $0.001，则扣除 1 积分。
                </li>
                <li>
                  <Text strong>新用户赠送积分</Text>：用户首次注册登录时，系统自动赠送的积分数量。
                </li>
              </ul>
            </Paragraph>

            <Alert
              message="换算公式"
              description="积分消耗 = 美元消耗 × 汇率（四舍五入取整）"
              type="info"
              showIcon
            />
          </Card>
        </Space>
      ),
    },
    {
      key: 'system',
      label: '系统配置',
      children: (
        <Alert
          message="系统配置"
          description="系统全局配置功能正在开发中..."
          type="info"
          showIcon
        />
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2}>
            <SettingOutlined /> 系统配置
          </Title>
          <Paragraph type="secondary">管理系统全局配置，包括支付、通知等功能</Paragraph>
        </div>

        <Card>
          <Tabs items={tabItems} />
        </Card>
      </Space>
    </div>
  );
};

export default AdminSettings;
