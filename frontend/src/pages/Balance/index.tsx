/**
 * 积分余额/交易记录页
 * 支持新的订阅积分系统
 */
import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  DatePicker,
  Select,
  Button,
  Typography,
  Statistic,
  Row,
  Col,
  Space,
  message,
  Tag,
  Progress,
  Alert,
} from 'antd';
import {
  ReloadOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import { getBalance, getTransactions, getSubscription } from '@/api/subscription';
import type { CreditBalanceInfo, CreditTransaction, SubscriptionDetail, TransactionType } from '@/api/subscription';
import './styles.less';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const Balance: React.FC = () => {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [creditBalance, setCreditBalance] = useState<CreditBalanceInfo | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionDetail | null>(null);

  // 筛选条件
  const [filters, setFilters] = useState<{
    type?: TransactionType;
    dateRange?: [Dayjs, Dayjs];
  }>({});

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
        fetchBalance(),
        fetchSubscription(),
        fetchTransactions(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await getBalance();
      if (response.success && response.data) {
        setCreditBalance(response.data);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取余额失败');
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

  const fetchTransactions = async (page = 1, pageSize = 20) => {
    try {
      setLoading(true);

      const response = await getTransactions(page, pageSize, filters.type);

      if (response.success && response.data) {
        const { records, pagination: pag } = response.data;
        setTransactions(records);
        setPagination({
          current: pag.page,
          pageSize: pag.pageSize,
          total: pag.total,
        });
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取交易记录失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 刷新数据
   */
  const handleRefresh = () => {
    fetchData();
    message.success('刷新成功');
  };

  /**
   * 应用筛选
   */
  const handleFilter = () => {
    fetchTransactions(1, pagination.pageSize);
  };

  /**
   * 重置筛选
   */
  const handleReset = () => {
    setFilters({});
    setTimeout(() => {
      fetchTransactions(1, pagination.pageSize);
    }, 0);
  };

  /**
   * 交易类型标签映射
   */
  const getTypeTag = (type: TransactionType) => {
    const typeMap: Record<TransactionType, { color: string; label: string }> = {
      SUBSCRIPTION: { color: 'blue', label: '订阅' },
      REPLENISH: { color: 'green', label: '补充' },
      DAILY_RESET: { color: 'cyan', label: '每日重置' },
      DEDUCT: { color: 'red', label: '扣费' },
      ADMIN_ADJUST: { color: 'purple', label: '调整' },
      RECHARGE: { color: 'gold', label: '充值' },
      BONUS: { color: 'magenta', label: '赠送' },
      REFUND: { color: 'orange', label: '退款' },
    };

    const config = typeMap[type] || { color: 'default', label: type };
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  /**
   * 表格列定义
   */
  const columns: ColumnsType<CreditTransaction> = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (createdAt: string) => (
        <Text>{dayjs(createdAt).format('YYYY-MM-DD HH:mm:ss')}</Text>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: TransactionType) => getTypeTag(type),
    },
    {
      title: '变动积分',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      render: (amount: number) => (
        <Text
          strong
          style={{
            color: amount > 0 ? '#52c41a' : amount < 0 ? '#ff4d4f' : '#000',
          }}
        >
          {amount > 0 ? '+' : ''}
          {amount.toLocaleString()}
        </Text>
      ),
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      width: 120,
      align: 'right',
      render: (balance: number) => (
        <Text strong>{balance.toLocaleString()}</Text>
      ),
    },
    {
      title: '说明',
      dataIndex: 'desc',
      key: 'desc',
      ellipsis: true,
      render: (desc: string) => <Text>{desc || '-'}</Text>,
    },
  ];

  // 计算积分使用百分比
  const creditPercent = creditBalance
    ? Math.min(100, (creditBalance.currentCredits / creditBalance.baseCredits) * 100)
    : 0;

  const isActive = subscription?.status === 'ACTIVE';

  return (
    <div className="balance-page">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="header-left">
          <Title level={2} style={{ margin: 0 }}>
            积分管理
          </Title>
          <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
            查看积分余额和交易明细
          </Text>
        </div>
        <div className="header-right">
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            刷新
          </Button>
        </div>
      </div>

      {/* 订阅状态 */}
      <Card className="subscription-card">
        <Row gutter={24} align="middle">
          <Col xs={24} md={8}>
            <Space>
              <CrownOutlined
                style={{
                  fontSize: 32,
                  color: isActive ? '#faad14' : '#d9d9d9',
                }}
              />
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  {isActive ? subscription.package.name : '暂无订阅'}
                </Title>
                {isActive && (
                  <Text type="secondary">
                    剩余 {subscription.daysRemaining} 天
                  </Text>
                )}
              </div>
            </Space>
          </Col>
          <Col xs={24} md={16}>
            {creditBalance && (
              <div className="credit-progress">
                <div className="progress-header">
                  <Text>当前积分</Text>
                  <Text strong>
                    {creditBalance.currentCredits.toLocaleString()} /{' '}
                    {creditBalance.baseCredits.toLocaleString()}
                  </Text>
                </div>
                <Progress
                  percent={creditPercent}
                  showInfo={false}
                  strokeColor={{
                    '0%': '#24be58',
                    '100%': '#21AF51',
                  }}
                  trailColor="#f0f0f0"
                  strokeWidth={10}
                />
                <div className="progress-footer">
                  <Space split={<span style={{ color: '#d9d9d9' }}>|</span>}>
                    <span>
                      <ThunderboltOutlined style={{ color: '#24be58' }} /> 每小时补充：
                      {creditBalance.replenishCredits.toLocaleString()}
                    </span>
                    {creditBalance.nextReplenishAt && (
                      <span>
                        <ClockCircleOutlined style={{ color: '#1890ff' }} /> 下次补充：
                        {dayjs(creditBalance.nextReplenishAt).format('HH:mm')}
                      </span>
                    )}
                  </Space>
                </div>
              </div>
            )}
          </Col>
        </Row>
        {!creditBalance?.hasSubscription && (
          <Alert
            message="您当前没有有效订阅，积分不会自动补充。购买订阅后可享受持续的积分补充服务。"
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Card>

      {/* 统计卡片 */}
      <Row gutter={16} className="stats-row">
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="当前积分"
              value={creditBalance?.currentCredits || 0}
              formatter={(value) => value.toLocaleString()}
              valueStyle={{ color: '#1890ff', fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="积分天花板"
              value={creditBalance?.baseCredits || 0}
              formatter={(value) => value.toLocaleString()}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="每小时补充"
              value={creditBalance?.replenishCredits || 0}
              formatter={(value) => value.toLocaleString()}
              suffix="/小时"
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选器 */}
      <Card className="filter-card">
        <Space wrap>
          <Select
            placeholder="交易类型"
            style={{ width: 200 }}
            allowClear
            value={filters.type}
            onChange={(value) => setFilters({ ...filters, type: value })}
          >
            <Option value="SUBSCRIPTION">订阅</Option>
            <Option value="REPLENISH">补充</Option>
            <Option value="DAILY_RESET">每日重置</Option>
            <Option value="DEDUCT">扣费</Option>
            <Option value="ADMIN_ADJUST">调整</Option>
            <Option value="RECHARGE">充值</Option>
            <Option value="BONUS">赠送</Option>
            <Option value="REFUND">退款</Option>
          </Select>

          <RangePicker
            value={filters.dateRange}
            onChange={(dates) =>
              setFilters({ ...filters, dateRange: dates as [Dayjs, Dayjs] })
            }
            format="YYYY-MM-DD"
          />

          <Button type="primary" onClick={handleFilter}>
            查询
          </Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </Card>

      {/* 交易记录表格 */}
      <Card className="table-card">
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          onChange={(pag) => {
            fetchTransactions(pag.current, pag.pageSize);
          }}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
};

export default Balance;
