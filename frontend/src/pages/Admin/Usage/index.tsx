import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  message,
  Statistic,
  Row,
  Col,
  Typography,
  Tag,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  BarChartOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import {
  getAdminUsageRecords,
  getAdminUsageStats,
  getUsedModels,
  type UsageRecord,
  type UsageStats,
} from '@/api/subscription';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

/**
 * 管理员使用记录页面
 */
const AdminUsage = () => {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // 筛选条件
  const [filters, setFilters] = useState<{
    email?: string;
    model?: string;
    dateRange?: [Dayjs, Dayjs];
  }>({});

  useEffect(() => {
    loadModels();
    loadStats();
    loadRecords();
  }, []);

  const loadModels = async () => {
    try {
      const res = await getUsedModels();
      if (res.success && res.data) {
        setModels(res.data);
      }
    } catch (error: any) {
      console.error('加载模型列表失败:', error);
    }
  };

  const loadStats = async () => {
    try {
      const params: any = {};
      if (filters.dateRange) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      }

      const res = await getAdminUsageStats(params);
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (error: any) {
      console.error('加载统计失败:', error);
    }
  };

  const loadRecords = async (page = 1, pageSize = 20) => {
    try {
      setLoading(true);

      const params: any = { page, pageSize };
      if (filters.email) params.email = filters.email;
      if (filters.model) params.model = filters.model;
      if (filters.dateRange) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      }

      const res = await getAdminUsageRecords(params);
      if (res.success && res.data) {
        setRecords(res.data.records);
        setPagination({
          current: res.data.pagination.page,
          pageSize: res.data.pagination.pageSize,
          total: res.data.pagination.total,
        });
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadStats();
    loadRecords(1, pagination.pageSize);
  };

  const handleReset = () => {
    setFilters({});
    setTimeout(() => {
      loadStats();
      loadRecords(1, pagination.pageSize);
    }, 0);
  };

  const handleRefresh = () => {
    loadStats();
    loadRecords(pagination.current, pagination.pageSize);
    message.success('刷新成功');
  };

  // 表格列定义
  const columns: ColumnsType<UsageRecord> = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp: string) => (
        <Text>{dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')}</Text>
      ),
    },
    {
      title: '用户',
      key: 'user',
      width: 200,
      render: (record: UsageRecord) => (
        <div>
          <div>{record.user.email}</div>
          {record.user.name && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.user.name}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'API Key',
      dataIndex: 'apiKeyLabel',
      key: 'apiKeyLabel',
      width: 120,
      ellipsis: true,
    },
    {
      title: '模型',
      dataIndex: 'model',
      key: 'model',
      width: 180,
      render: (model: string) => (
        <Tag color="blue">{model}</Tag>
      ),
    },
    {
      title: 'Tokens',
      key: 'tokens',
      width: 150,
      render: (record: UsageRecord) => (
        <div>
          <div>总计: {record.totalTokens.toLocaleString()}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            提示: {record.promptTokens.toLocaleString()} / 完成: {record.completionTokens.toLocaleString()}
          </Text>
        </div>
      ),
    },
    {
      title: '原始成本 (USD)',
      dataIndex: 'costUsd',
      key: 'costUsd',
      width: 120,
      align: 'right',
      render: (costUsd: number) => (
        <Text>${costUsd.toFixed(6)}</Text>
      ),
    },
    {
      title: '积分消耗',
      dataIndex: 'creditCost',
      key: 'creditCost',
      width: 100,
      align: 'right',
      render: (creditCost: number) => (
        <Text strong style={{ color: '#ff4d4f' }}>
          {creditCost.toLocaleString()}
        </Text>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 页面标题 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2} style={{ margin: 0 }}>
            <BarChartOutlined /> 使用记录
          </Title>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            刷新
          </Button>
        </div>

        {/* 统计卡片 */}
        {stats && (
          <Row gutter={16}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="总请求数"
                  value={stats.totalRecords}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="总 Tokens"
                  value={stats.totalTokens}
                  prefix={<ThunderboltOutlined />}
                  formatter={(value) => value.toLocaleString()}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="总积分消耗"
                  value={stats.totalCredits}
                  valueStyle={{ color: '#ff4d4f' }}
                  formatter={(value) => value.toLocaleString()}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="总成本 (USD)"
                  value={stats.totalCostUsd}
                  prefix={<DollarOutlined />}
                  precision={4}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* 模型统计 */}
        {stats && stats.modelStats.length > 0 && (
          <Card title="模型使用统计（Top 10）" size="small">
            <Row gutter={[16, 16]}>
              {stats.modelStats.map((m) => (
                <Col key={m.model} xs={24} sm={12} lg={8} xl={6}>
                  <Card size="small" bordered={false} style={{ background: '#fafafa' }}>
                    <div style={{ marginBottom: 8 }}>
                      <Tag color="blue">{m.model}</Tag>
                    </div>
                    <Space size="large">
                      <Statistic
                        title="次数"
                        value={m.count}
                        valueStyle={{ fontSize: 16 }}
                      />
                      <Statistic
                        title="积分"
                        value={m.creditCost}
                        valueStyle={{ fontSize: 16, color: '#ff4d4f' }}
                        formatter={(value) => value.toLocaleString()}
                      />
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        )}

        {/* 筛选器 */}
        <Card>
          <Space wrap>
            <Input
              placeholder="用户邮箱"
              style={{ width: 200 }}
              value={filters.email}
              onChange={(e) => setFilters({ ...filters, email: e.target.value })}
              allowClear
            />

            <Select
              placeholder="选择模型"
              style={{ width: 200 }}
              allowClear
              showSearch
              value={filters.model}
              onChange={(value) => setFilters({ ...filters, model: value })}
              options={models.map((m) => ({ label: m, value: m }))}
            />

            <RangePicker
              value={filters.dateRange}
              onChange={(dates) =>
                setFilters({ ...filters, dateRange: dates as [Dayjs, Dayjs] })
              }
              format="YYYY-MM-DD"
            />

            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              查询
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </Card>

        {/* 使用记录表格 */}
        <Card>
          <Table
            columns={columns}
            dataSource={records}
            rowKey="id"
            loading={loading}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
            onChange={(pag) => {
              loadRecords(pag.current, pag.pageSize);
            }}
            scroll={{ x: 1200 }}
          />
        </Card>
      </Space>
    </div>
  );
};

export default AdminUsage;
