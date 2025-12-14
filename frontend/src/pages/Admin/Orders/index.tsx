import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Input,
  Select,
  message,
  Space,
  Statistic,
  Row,
  Col,
  Typography,
} from 'antd';
import {
  ShoppingOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { getAllOrders, getOrderStats } from '@/api/admin';
import type { OrderQueryParams } from '@/api/admin';
import type { PaymentStatus } from '@/types';

const { Title } = Typography;
const { Search } = Input;

/**
 * 订单管理页面（管理员）
 */
const AdminOrders = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState<OrderQueryParams>({});

  useEffect(() => {
    loadOrders();
    loadStats();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await getAllOrders({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
      });

      if (res.success && res.data) {
        setOrders(res.data.orders);
        setPagination((prev) => ({
          ...prev,
          total: res.data!.pagination.total,
        }));
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await getOrderStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (error: any) {
      console.error('加载统计失败:', error);
    }
  };

  const handleSearch = (keyword: string) => {
    setFilters({ ...filters, keyword });
    setPagination({ ...pagination, current: 1 });
  };

  const handleStatusFilter = (status: string) => {
    setFilters({ ...filters, status: status === 'all' ? undefined : status });
    setPagination({ ...pagination, current: 1 });
  };

  const getStatusTag = (status: PaymentStatus) => {
    const statusConfig = {
      PENDING: { color: 'processing', text: '待支付', icon: <ClockCircleOutlined /> },
      PAID: { color: 'success', text: '已支付', icon: <CheckCircleOutlined /> },
      CANCELLED: { color: 'default', text: '已取消', icon: <CloseCircleOutlined /> },
      EXPIRED: { color: 'error', text: '已过期', icon: <CloseCircleOutlined /> },
      REFUNDED: { color: 'warning', text: '已退款', icon: <CloseCircleOutlined /> },
    };
    const config = statusConfig[status];
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 200,
      render: (orderNo: string) => <span style={{ fontFamily: 'monospace' }}>{orderNo}</span>,
    },
    {
      title: '用户',
      key: 'user',
      width: 180,
      render: (record: any) => (
        <div>
          <div>{record.user?.email || '-'}</div>
          {record.user?.name && (
            <div style={{ fontSize: 12, color: '#999' }}>{record.user.name}</div>
          )}
        </div>
      ),
    },
    {
      title: '套餐',
      key: 'package',
      width: 150,
      render: (record: any) => record.package?.name || '-',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (amount: string) => <span>¥{amount}</span>,
    },
    {
      title: '积分',
      key: 'credits',
      width: 150,
      render: (record: any) => (
        <div>
          <div>{record.creditAmount.toLocaleString()}</div>
          {record.bonusCredit > 0 && (
            <Tag color="success" style={{ marginTop: 4 }}>
              +{record.bonusCredit.toLocaleString()}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: PaymentStatus) => getStatusTag(status),
    },
    {
      title: '支付方式',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 120,
      render: (method: string | null) => method || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '支付时间',
      dataIndex: 'paidAt',
      key: 'paidAt',
      width: 180,
      render: (date: string | null) => (date ? new Date(date).toLocaleString('zh-CN') : '-'),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 页面标题 */}
        <div>
          <Title level={2}>
            <ShoppingOutlined /> 订单管理
          </Title>
        </div>

        {/* 统计卡片 */}
        {stats && (
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic title="总订单数" value={stats.total} prefix={<ShoppingOutlined />} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="待支付"
                  value={stats.pending}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="已支付"
                  value={stats.paid}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="总交易额"
                  value={parseFloat(stats.totalAmount).toFixed(2)}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                  suffix="元"
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* 筛选工具栏 */}
        <Card>
          <Space wrap>
            <Search
              placeholder="搜索订单号或用户邮箱"
              allowClear
              enterButton={<SearchOutlined />}
              style={{ width: 300 }}
              onSearch={handleSearch}
            />
            <Select
              placeholder="状态筛选"
              style={{ width: 150 }}
              allowClear
              onChange={handleStatusFilter}
            >
              <Select.Option value="all">全部状态</Select.Option>
              <Select.Option value="PENDING">待支付</Select.Option>
              <Select.Option value="PAID">已支付</Select.Option>
              <Select.Option value="CANCELLED">已取消</Select.Option>
              <Select.Option value="EXPIRED">已过期</Select.Option>
              <Select.Option value="REFUNDED">已退款</Select.Option>
            </Select>
          </Space>
        </Card>

        {/* 订单列表 */}
        <Card>
          <Table
            columns={columns}
            dataSource={orders}
            rowKey="id"
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`,
              onChange: (page, pageSize) => {
                setPagination({ ...pagination, current: page, pageSize: pageSize || 20 });
              },
            }}
            scroll={{ x: 1400 }}
          />
        </Card>
      </Space>
    </div>
  );
};

export default AdminOrders;
