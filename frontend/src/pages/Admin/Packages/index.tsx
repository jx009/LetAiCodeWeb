import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  message,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Popconfirm,
  Statistic,
  Row,
  Col,
  Typography,
} from 'antd';
import {
  GiftOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import {
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
  togglePackageActive,
  getPackageStats,
} from '@/api/packages';
import type { SubscriptionPackage, PackageStats } from '@/api/packages';

const { Title, Text } = Typography;

// 周期类型映射
const CYCLE_OPTIONS = [
  { label: '按周', value: 'WEEK', days: 7 },
  { label: '按月', value: 'MONTH', days: 30 },
  { label: '按季', value: 'QUARTER', days: 90 },
  { label: '按年', value: 'YEAR', days: 365 },
];

const CYCLE_LABELS: Record<string, string> = {
  WEEK: '周',
  MONTH: '月',
  QUARTER: '季',
  YEAR: '年',
};

/**
 * 套餐管理页面（管理员）
 */
const AdminPackages = () => {
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [stats, setStats] = useState<PackageStats | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPackage, setEditingPackage] = useState<SubscriptionPackage | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadPackages();
    loadStats();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const res = await getPackages(false); // 获取全部套餐，包括未激活的
      if (res.success && res.data) {
        setPackages(res.data);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载套餐列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await getPackageStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (error: any) {
      console.error('加载统计失败:', error);
    }
  };

  const handleCreate = () => {
    setEditingPackage(null);
    form.resetFields();
    form.setFieldsValue({
      cycle: 'MONTH',
      active: true,
      recommended: false,
      sortOrder: 0,
    });
    setModalVisible(true);
  };

  const handleEdit = (pkg: SubscriptionPackage) => {
    setEditingPackage(pkg);
    form.setFieldsValue({
      name: pkg.name,
      cycle: pkg.cycle,
      price: pkg.price,
      baseCredits: pkg.baseCredits,
      replenishCredits: pkg.replenishCredits,
      desc: pkg.desc,
      sortOrder: pkg.sortOrder,
      active: pkg.active,
      recommended: pkg.recommended,
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingPackage) {
        await updatePackage(editingPackage.id, values);
        message.success('套餐更新成功');
      } else {
        await createPackage(values);
        message.success('套餐创建成功');
      }

      setModalVisible(false);
      loadPackages();
      loadStats();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleDelete = async (pkg: SubscriptionPackage) => {
    try {
      await deletePackage(pkg.id);
      message.success('套餐删除成功');
      loadPackages();
      loadStats();
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const handleToggleActive = async (pkg: SubscriptionPackage) => {
    try {
      await togglePackageActive(pkg.id);
      message.success(pkg.active ? '套餐已禁用' : '套餐已启用');
      loadPackages();
      loadStats();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  // 计算预览积分
  const calculateDisplayCredits = (baseCredits: number, replenishCredits: number) => {
    return baseCredits * 30 + replenishCredits * 24 * 30;
  };

  // 表格列定义
  const columns = [
    {
      title: '套餐名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (name: string, record: SubscriptionPackage) => (
        <Space>
          <span>{name}</span>
          {record.recommended && <Tag color="gold">推荐</Tag>}
        </Space>
      ),
    },
    {
      title: '周期',
      dataIndex: 'cycle',
      key: 'cycle',
      width: 80,
      render: (cycle: string) => CYCLE_LABELS[cycle] || cycle,
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price: number) => `¥${price}`,
    },
    {
      title: '基础积分',
      dataIndex: 'baseCredits',
      key: 'baseCredits',
      width: 120,
      render: (credits: number) => credits.toLocaleString(),
    },
    {
      title: '补充积分',
      dataIndex: 'replenishCredits',
      key: 'replenishCredits',
      width: 120,
      render: (credits: number) => `${credits.toLocaleString()}/小时`,
    },
    {
      title: '展示积分',
      key: 'displayCredits',
      width: 140,
      render: (record: SubscriptionPackage) => (
        <Text type="secondary">{record.displayCredits?.toLocaleString()}</Text>
      ),
    },
    {
      title: '月均价格',
      key: 'monthlyPrice',
      width: 100,
      render: (record: SubscriptionPackage) => `¥${record.monthlyPrice?.toFixed(2)}`,
    },
    {
      title: '省钱比例',
      key: 'savingsPercentage',
      width: 100,
      render: (record: SubscriptionPackage) =>
        record.savingsPercentage > 0 ? (
          <Tag color="green">省{record.savingsPercentage}%</Tag>
        ) : (
          '-'
        ),
    },
    {
      title: '状态',
      dataIndex: 'active',
      key: 'active',
      width: 80,
      render: (active: boolean) =>
        active ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            启用
          </Tag>
        ) : (
          <Tag color="default" icon={<StopOutlined />}>
            禁用
          </Tag>
        ),
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (record: SubscriptionPackage) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>

          <Button
            size="small"
            type={record.active ? 'default' : 'primary'}
            icon={record.active ? <StopOutlined /> : <CheckCircleOutlined />}
            onClick={() => handleToggleActive(record)}
          >
            {record.active ? '禁用' : '启用'}
          </Button>

          <Popconfirm
            title="确认删除此套餐？"
            description="如果有用户订阅了此套餐，将无法删除"
            onConfirm={() => handleDelete(record)}
            okText="确认"
            cancelText="取消"
            icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 监听表单变化，实时计算展示积分
  const [previewCredits, setPreviewCredits] = useState(0);

  const handleFormChange = () => {
    const baseCredits = form.getFieldValue('baseCredits') || 0;
    const replenishCredits = form.getFieldValue('replenishCredits') || 0;
    setPreviewCredits(calculateDisplayCredits(baseCredits, replenishCredits));
  };

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 页面标题 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2} style={{ margin: 0 }}>
            <GiftOutlined /> 套餐管理
          </Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建套餐
          </Button>
        </div>

        {/* 统计卡片 */}
        {stats && (
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic title="总套餐数" value={stats.total} prefix={<GiftOutlined />} />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="启用套餐"
                  value={stats.active}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="禁用套餐"
                  value={stats.inactive}
                  prefix={<StopOutlined />}
                  valueStyle={{ color: '#999' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* 套餐列表 */}
        <Card>
          <Table
            columns={columns}
            dataSource={packages}
            rowKey="id"
            loading={loading}
            pagination={false}
            scroll={{ x: 1400 }}
          />
        </Card>

        {/* 配置说明 */}
        <Card title="配置说明" size="small">
          <Space direction="vertical">
            <Text>
              <strong>基础积分</strong>：用户的积分天花板，每日重置后恢复到此值
            </Text>
            <Text>
              <strong>补充积分</strong>：每小时自动补充的积分数量，不超过基础积分
            </Text>
            <Text>
              <strong>展示积分</strong>：用于前端展示的月度参考值 = 基础积分 × 30 + 补充积分 × 24 × 30
            </Text>
            <Text>
              <strong>省钱比例</strong>：相比月付套餐的月均省钱百分比（自动计算）
            </Text>
          </Space>
        </Card>
      </Space>

      {/* 新建/编辑套餐弹窗 */}
      <Modal
        title={editingPackage ? '编辑套餐' : '新建套餐'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onValuesChange={handleFormChange}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="套餐名称"
                name="name"
                rules={[{ required: true, message: '请输入套餐名称' }]}
              >
                <Input placeholder="例如：基础版" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="周期类型"
                name="cycle"
                rules={[{ required: true, message: '请选择周期类型' }]}
              >
                <Select options={CYCLE_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="价格（元）"
                name="price"
                rules={[{ required: true, message: '请输入价格' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  placeholder="例如：29.9"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="排序"
                name="sortOrder"
                extra="数字越小越靠前"
              >
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="基础积分（天花板）"
                name="baseCredits"
                rules={[{ required: true, message: '请输入基础积分' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="例如：5000"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="补充积分（/小时）"
                name="replenishCredits"
                rules={[{ required: true, message: '请输入补充积分' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="例如：100"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* 预览展示积分 */}
          {previewCredits > 0 && (
            <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f6ffed' }}>
              <Text>
                展示积分（月度参考值）：<strong>{previewCredits.toLocaleString()}</strong>
              </Text>
              <br />
              <Text type="secondary">
                = 基础积分 × 30 + 补充积分 × 24 × 30
              </Text>
            </Card>
          )}

          <Form.Item label="描述" name="desc">
            <Input.TextArea rows={2} placeholder="套餐描述（可选）" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="启用" name="active" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="推荐" name="recommended" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminPackages;
