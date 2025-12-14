/**
 * 创建 API Key 弹窗
 */
import React, { useState } from 'react';
import { Modal, Form, Input, Button, message, Typography } from 'antd';
import { CopyOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { createApiKey } from '@/api/keys';
import type { ApiKey } from '@/types';

const { Paragraph, Text } = Typography;

interface CreateKeyModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const CreateKeyModal: React.FC<CreateKeyModalProps> = ({ open, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [createdKey, setCreatedKey] = useState<ApiKey | null>(null);
  const [copied, setCopied] = useState(false);

  /**
   * 提交表单
   */
  const handleSubmit = async (values: { label: string }) => {
    try {
      setLoading(true);
      const response = await createApiKey(values.label);

      if (response.success && response.data) {
        setCreatedKey(response.data);
        message.success('API Key 创建成功！');
      } else {
        throw new Error(response.message || '创建失败');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || error.message || '创建 API Key 失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 复制 API Key
   */
  const handleCopy = async () => {
    if (!createdKey?.fullValue) return;

    try {
      await navigator.clipboard.writeText(createdKey.fullValue);
      setCopied(true);
      message.success('API Key 已复制到剪贴板');

      // 2秒后恢复复制按钮状态
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      message.error('复制失败，请手动复制');
    }
  };

  /**
   * 关闭弹窗
   */
  const handleClose = () => {
    form.resetFields();
    setCreatedKey(null);
    setCopied(false);
    onCancel();
    if (createdKey) {
      onSuccess(); // 如果创建了 Key，刷新列表
    }
  };

  /**
   * 渲染创建表单
   */
  const renderCreateForm = () => (
    <>
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item
          name="label"
          label="Key 名称"
          rules={[
            { required: true, message: '请输入 Key 名称' },
            { max: 100, message: 'Key 名称不能超过 100 个字符' },
          ]}
        >
          <Input
            placeholder="例如：开发环境、生产环境、测试服务器等"
            maxLength={100}
            showCount
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button onClick={onCancel}>取消</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              创建
            </Button>
          </div>
        </Form.Item>
      </Form>
    </>
  );

  /**
   * 渲染创建成功界面
   */
  const renderSuccessView = () => (
    <div style={{ textAlign: 'center' }}>
      {/* 成功图标 */}
      <CheckCircleOutlined
        style={{
          fontSize: 64,
          color: '#52c41a',
          marginBottom: 24,
        }}
      />

      {/* 提示文字 */}
      <div style={{ marginBottom: 24 }}>
        <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>
          API Key 创建成功！
        </Text>
        <Text type="secondary" style={{ fontSize: 14 }}>
          请妥善保管您的 API Key，它只会显示一次
        </Text>
      </div>

      {/* API Key 显示区域 */}
      <div
        style={{
          padding: '16px',
          background: '#f5f5f5',
          borderRadius: '8px',
          marginBottom: 24,
        }}
      >
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
          {createdKey?.label}
        </Text>
        <Paragraph
          copyable={false}
          style={{
            fontFamily: 'monospace',
            fontSize: 14,
            wordBreak: 'break-all',
            marginBottom: 12,
            color: '#262626',
          }}
        >
          {createdKey?.fullValue}
        </Paragraph>
        <Button
          type="primary"
          icon={copied ? <CheckCircleOutlined /> : <CopyOutlined />}
          onClick={handleCopy}
          block
        >
          {copied ? '已复制' : '复制到剪贴板'}
        </Button>
      </div>

      {/* 关闭按钮 */}
      <Button type="default" onClick={handleClose} block>
        我已保存，关闭
      </Button>
    </div>
  );

  return (
    <Modal
      title={createdKey ? 'API Key 创建成功' : '创建 API Key'}
      open={open}
      onCancel={handleClose}
      footer={null}
      width={520}
      maskClosable={false}
      destroyOnClose
    >
      {createdKey ? renderSuccessView() : renderCreateForm()}
    </Modal>
  );
};

export default CreateKeyModal;
