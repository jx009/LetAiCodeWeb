/**
 * 使用记录/账单页
 * 完全复刻 MiniMAXI 账单记录页面
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
import { SyncOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import { getUsageRecords, getApiKeys, syncUsageRecords } from '@/api';
import type { UsageRecord, ApiKey } from '@/types';
import './styles.less';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const Usage: React.FC = () => {
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [summary, setSummary] = useState({
    totalTokens: 0,
    totalCreditCost: 0,
  });

  // 筛选条件 - 默认当天
  const [filters, setFilters] = useState<{
    keyId?: string;
    model?: string;
    dateRange?: [Dayjs, Dayjs];
  }>({
    dateRange: [dayjs().startOf('day'), dayjs().endOf('day')],
  });

  /**
   * 加载使用记录
   */
  useEffect(() => {
    fetchRecords();
    fetchKeys();
  }, []);

  const fetchRecords = async (page = 1, pageSize = 20) => {
    try {
      setLoading(true);

      const params: any = {
        page,
        pageSize,
      };

      if (filters.keyId) params.keyId = filters.keyId;
      if (filters.model) params.model = filters.model;
      if (filters.dateRange) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      }

      const response = await getUsageRecords(params);

      if (response.success && response.data) {
        const { records, pagination: pag, summary: sum } = response.data;
        setRecords(records);
        setPagination({
          current: pag.page,
          pageSize: pag.pageSize,
          total: pag.total,
        });
        setSummary(sum);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取使用记录失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchKeys = async () => {
    try {
      const response = await getApiKeys();
      if (response.success && response.data) {
        setKeys(response.data);
      }
    } catch (error) {
      // 静默失败
    }
  };

  /**
   * 手动同步
   */
  const handleSync = async () => {
    try {
      setSyncing(true);
      const response = await syncUsageRecords();
      if (response.success) {
        message.success('同步成功');
        fetchRecords();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '同步失败');
    } finally {
      setSyncing(false);
    }
  };

  /**
   * 应用筛选
   */
  const handleFilter = () => {
    fetchRecords(1, pagination.pageSize);
  };

  /**
   * 重置筛选
   */
  const handleReset = () => {
    setFilters({});
    setTimeout(() => fetchRecords(1, pagination.pageSize), 0);
  };

  /**
   * 表格列定义
   */
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
      title: 'API Key',
      dataIndex: 'apiKey',
      key: 'apiKey',
      width: 200,
      render: (apiKey: any) => <Text>{apiKey?.label || '-'}</Text>,
    },
    {
      title: '模型',
      dataIndex: 'model',
      key: 'model',
      width: 150,
      render: (model: string) => <Tag color="blue">{model}</Tag>,
    },
    {
      title: 'Prompt Tokens',
      dataIndex: 'promptTokens',
      key: 'promptTokens',
      width: 150,
      align: 'right',
      render: (tokens: number) => <Text>{tokens.toLocaleString()}</Text>,
    },
    {
      title: 'Completion Tokens',
      dataIndex: 'completionTokens',
      key: 'completionTokens',
      width: 150,
      align: 'right',
      render: (tokens: number) => <Text>{tokens.toLocaleString()}</Text>,
    },
    {
      title: '总 Tokens',
      dataIndex: 'totalTokens',
      key: 'totalTokens',
      width: 150,
      align: 'right',
      render: (tokens: number) => <Text strong>{tokens.toLocaleString()}</Text>,
    },
    {
      title: '积分消耗',
      dataIndex: 'creditCost',
      key: 'creditCost',
      width: 120,
      align: 'right',
      render: (cost: number) => (
        <Text strong style={{ color: '#ff4d4f' }}>
          {cost.toLocaleString()}
        </Text>
      ),
    },
  ];

  return (
    <div className="usage-page">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="header-left">
          <Title level={2} style={{ margin: 0 }}>
            账单记录
          </Title>
          <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
            查看 API 使用记录和积分消耗明细
          </Text>
        </div>
        <div className="header-right">
          <Button
            icon={<SyncOutlined spin={syncing} />}
            onClick={handleSync}
            loading={syncing}
          >
            同步记录
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} className="stats-row">
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="总 Tokens"
              value={summary.totalTokens}
              formatter={(value) => value.toLocaleString()}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="总积分消耗"
              value={summary.totalCreditCost}
              formatter={(value) => value.toLocaleString()}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="记录数"
              value={pagination.total}
              formatter={(value) => value.toLocaleString()}
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选器 */}
      <Card className="filter-card">
        <Space wrap>
          <Select
            placeholder="选择 API Key"
            style={{ width: 200 }}
            allowClear
            value={filters.keyId}
            onChange={(value) => setFilters({ ...filters, keyId: value })}
          >
            {keys.map((key) => (
              <Option key={key.id} value={key.id}>
                {key.label}
              </Option>
            ))}
          </Select>

          <Select
            placeholder="选择模型"
            style={{ width: 200 }}
            allowClear
            value={filters.model}
            onChange={(value) => setFilters({ ...filters, model: value })}
          >
            <Option value="gpt-4">gpt-4</Option>
            <Option value="gpt-3.5-turbo">gpt-3.5-turbo</Option>
            <Option value="gpt-4-turbo">gpt-4-turbo</Option>
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

      {/* 使用记录表格 */}
      <Card className="table-card">
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
            fetchRecords(pag.current, pag.pageSize);
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default Usage;
