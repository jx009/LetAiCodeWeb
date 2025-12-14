/**
 * API Keys 管理页
 * 完全复刻 MiniMAXI 接口密钥页面
 */
import React, { useState, useEffect } from 'react';
import {
  Button,
  Table,
  Tag,
  Space,
  Popconfirm,
  message,
  Typography,
  Card,
  Tooltip,
  Empty,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  CopyOutlined,
  DeleteOutlined,
  EyeOutlined,
  PoweroffOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { getApiKeys, deleteApiKey, updateApiKeyStatus } from '@/api/keys';
import { KeyStatus, type ApiKey } from '@/types';
import CreateKeyModal from '@/components/Modals/CreateKeyModal';
import './styles.less';

const { Title, Text } = Typography;

const ApiKeys: React.FC = () => {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  /**
   * 加载 API Keys
   */
  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const response = await getApiKeys();
      if (response.data.success) {
        setKeys(response.data.data || []);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取 API Keys 失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 复制 Key
   */
  const handleCopy = async (key: ApiKey) => {
    try {
      await navigator.clipboard.writeText(key.maskedValue);
      setCopiedKeyId(key.id);
      message.success('已复制到剪贴板');

      setTimeout(() => {
        setCopiedKeyId(null);
      }, 2000);
    } catch (error) {
      message.error('复制失败，请手动复制');
    }
  };

  /**
   * 删除 Key
   */
  const handleDelete = async (keyId: string) => {
    try {
      const response = await deleteApiKey(keyId);
      if (response.data.success) {
        message.success('API Key 已删除');
        fetchKeys();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  /**
   * 启用/禁用 Key
   */
  const handleToggleStatus = async (key: ApiKey) => {
    const newStatus = key.status === KeyStatus.ACTIVE ? KeyStatus.DISABLED : KeyStatus.ACTIVE;

    try {
      const response = await updateApiKeyStatus(key.id, newStatus);
      if (response.data.success) {
        message.success(newStatus === KeyStatus.ACTIVE ? 'Key 已启用' : 'Key 已禁用');
        fetchKeys();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  /**
   * 表格列定义
   */
  const columns: ColumnsType<ApiKey> = [
    {
      title: '名称',
      dataIndex: 'label',
      key: 'label',
      width: 200,
      render: (label: string) => <Text strong>{label}</Text>,
    },
    {
      title: 'API Key',
      dataIndex: 'maskedValue',
      key: 'maskedValue',
      width: 300,
      render: (maskedValue: string, record: ApiKey) => (
        <div className="key-value-cell">
          <Text code className="key-value">
            {maskedValue}
          </Text>
          <Tooltip title={copiedKeyId === record.id ? '已复制' : '复制'}>
            <Button
              type="text"
              size="small"
              icon={copiedKeyId === record.id ? <CheckOutlined /> : <CopyOutlined />}
              onClick={() => handleCopy(record)}
              className="copy-button"
            />
          </Tooltip>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: KeyStatus) => {
        if (status === KeyStatus.ACTIVE) {
          return <Tag color="green">启用</Tag>;
        } else if (status === KeyStatus.DISABLED) {
          return <Tag color="default">禁用</Tag>;
        }
        return <Tag color="red">已删除</Tag>;
      },
    },
    {
      title: '使用情况',
      key: 'usage',
      width: 180,
      render: (_, record: ApiKey) => (
        <div className="usage-cell">
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              总 Tokens:
            </Text>{' '}
            <Text strong>{record.usage?.totalTokens.toLocaleString() || 0}</Text>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              积分消耗:
            </Text>{' '}
            <Text strong>{record.usage?.creditCost.toLocaleString() || 0}</Text>
          </div>
        </div>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (createdAt: string) => (
        <Text type="secondary">{dayjs(createdAt).format('YYYY-MM-DD HH:mm:ss')}</Text>
      ),
    },
    {
      title: '最后使用',
      dataIndex: 'lastUsedAt',
      key: 'lastUsedAt',
      width: 180,
      render: (lastUsedAt: string | null) => (
        <Text type="secondary">
          {lastUsedAt ? dayjs(lastUsedAt).format('YYYY-MM-DD HH:mm:ss') : '从未使用'}
        </Text>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record: ApiKey) => (
        <Space size="small">
          <Tooltip title={record.status === KeyStatus.ACTIVE ? '禁用' : '启用'}>
            <Button
              type="text"
              size="small"
              icon={<PoweroffOutlined />}
              onClick={() => handleToggleStatus(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确认删除"
            description="删除后无法恢复，是否确认删除此 API Key？"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="api-keys-page">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="header-left">
          <Title level={2} style={{ margin: 0 }}>
            接口密钥
          </Title>
          <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
            创建和管理您的 API 密钥，用于调用 AI 服务
          </Text>
        </div>
        <div className="header-right">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setCreateModalOpen(true)}
          >
            创建新密钥
          </Button>
        </div>
      </div>

      {/* API Keys 列表 */}
      <Card className="keys-card" bordered={false}>
        <Table
          columns={columns}
          dataSource={keys}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 1200 }}
          locale={{
            emptyText: (
              <Empty
                description={
                  <span>
                    还没有 API Key，
                    <a onClick={() => setCreateModalOpen(true)}>创建一个</a>
                  </span>
                }
              />
            ),
          }}
        />
      </Card>

      {/* 底部提示 */}
      <div className="page-footer">
        <Card className="info-card" bordered={false}>
          <Title level={4}>使用提示</Title>
          <ul>
            <li>每个 API Key 仅在创建时显示一次完整值，请妥善保管</li>
            <li>禁用的 Key 将无法调用 API，但不会被删除</li>
            <li>删除的 Key 无法恢复，请谨慎操作</li>
            <li>API Key 的使用会消耗您的积分，请定期查看使用情况</li>
          </ul>
        </Card>
      </div>

      {/* 创建 Key 弹窗 */}
      <CreateKeyModal
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onSuccess={fetchKeys}
      />
    </div>
  );
};

export default ApiKeys;
