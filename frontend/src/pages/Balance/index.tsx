/**
 * 积分余额/交易记录页
 * 完全复刻 MiniMAXI 积分管理页面
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
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import { getTransactions, getBalance, getCreditStatistics } from '@/api/usage';
import type { CreditTransaction, TransactionType } from '@/types';
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
  const [balance, setBalance] = useState(0);
  const [statistics, setStatistics] = useState({
    currentBalance: 0,
    totalRecharge: 0,
    totalBonus: 0,
    totalDeduct: 0,
    totalRefund: 0,
  });

  // 筛选条件
  const [filters, setFilters] = useState<{
    type?: TransactionType;
    dateRange?: [Dayjs, Dayjs];
  }>({});

  /**
   * 加载数据
   */
  useEffect(() => {
    fetchBalance();
    fetchStatistics();
    fetchTransactions();
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await getBalance();
      if (response.data.success && response.data.data) {
        setBalance(response.data.data.balance);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取余额失败');
    }
  };

  const fetchStatistics = async () => {
    try {
      const params: any = {};
      if (filters.dateRange) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      }

      const response = await getCreditStatistics(params);
      if (response.data.success && response.data.data) {
        setStatistics(response.data.data);
      }
    } catch (error) {
      // 静默失败
    }
  };

  const fetchTransactions = async (page = 1, pageSize = 20) => {
    try {
      setLoading(true);

      const params: any = {
        page,
        pageSize,
      };

      if (filters.type) params.type = filters.type;
      if (filters.dateRange) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      }

      const response = await getTransactions(params);

      if (response.data.success && response.data.data) {
        const { records, pagination: pag } = response.data.data;
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
    fetchBalance();
    fetchStatistics();
    fetchTransactions();
    message.success('刷新成功');
  };

  /**
   * 应用筛选
   */
  const handleFilter = () => {
    fetchStatistics();
    fetchTransactions(1, pagination.pageSize);
  };

  /**
   * 重置筛选
   */
  const handleReset = () => {
    setFilters({});
    setTimeout(() => {
      fetchStatistics();
      fetchTransactions(1, pagination.pageSize);
    }, 0);
  };

  /**
   * 交易类型标签映射
   */
  const getTypeTag = (type: TransactionType) => {
    const typeMap: Record<
      TransactionType,
      { color: string; label: string }
    > = {
      RECHARGE: { color: 'green', label: '充值' },
      BONUS: { color: 'cyan', label: '赠送' },
      DEDUCT: { color: 'red', label: '扣费' },
      REFUND: { color: 'orange', label: '退款' },
      ADMIN_ADJUST: { color: 'purple', label: '调整' },
    };

    const config = typeMap[type];
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

      {/* 统计卡片 */}
      <Row gutter={16} className="stats-row">
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="当前余额"
              value={balance}
              formatter={(value) => value.toLocaleString()}
              valueStyle={{ color: '#1890ff', fontSize: 32 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="总充值"
              value={statistics.totalRecharge}
              formatter={(value) => value.toLocaleString()}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="总消耗"
              value={Math.abs(statistics.totalDeduct)}
              formatter={(value) => value.toLocaleString()}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 次要统计 */}
      <Row gutter={16} className="stats-row secondary">
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="总赠送"
              value={statistics.totalBonus}
              formatter={(value) => value.toLocaleString()}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="总退款"
              value={statistics.totalRefund}
              formatter={(value) => value.toLocaleString()}
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
            <Option value="RECHARGE">充值</Option>
            <Option value="BONUS">赠送</Option>
            <Option value="DEDUCT">扣费</Option>
            <Option value="REFUND">退款</Option>
            <Option value="ADMIN_ADJUST">调整</Option>
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
