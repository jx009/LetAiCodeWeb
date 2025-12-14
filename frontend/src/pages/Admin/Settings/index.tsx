import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  message,
  Typography,
  Tabs,
  Switch,
  Select,
  Tag,
  Alert,
  Divider,
} from 'antd';
import {
  SettingOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import {
  getPaymentConfig,
  updatePaymentConfig,
  validatePaymentConfig,
  getOptions,
  updateOption,
} from '@/api/admin';
import type { PaymentConfig } from '@/api/admin';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

/**
 * 系统配置页面（超级管理员）
 */
const AdminSettings = () => {
  const [loading, setLoading] = useState(false);
  const [paymentForm] = Form.useForm();
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [paymentValid, setPaymentValid] = useState<boolean | null>(null);
  const [payMethods, setPayMethods] = useState<
    Array<{ name: string; type: string; color: string }>
  >([]);

  useEffect(() => {
    loadPaymentConfig();
  }, []);

  const loadPaymentConfig = async () => {
    try {
      setLoading(true);
      const res = await getPaymentConfig();
      if (res.data.success && res.data.data) {
        const config = res.data.data;
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
      if (res.data.success && res.data.data) {
        setPaymentValid(res.data.data.valid);
        if (res.data.data.valid) {
          message.success('支付配置验证通过');
        } else {
          message.error(res.data.data.message || '支付配置验证失败');
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
