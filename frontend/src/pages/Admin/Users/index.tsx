import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  message,
  Modal,
  Form,
  Popconfirm,
  Statistic,
  Row,
  Col,
  Typography,
} from 'antd';
import {
  UserOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  CrownOutlined,
  StopOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import {
  getUsers,
  getUserStats,
  updateUser,
  toggleUserStatus,
  promoteUser,
  demoteUser,
  deleteUser,
} from '@/api/admin';
import type { UserQueryParams, UserListResponse, UserStatsResponse } from '@/api/admin';
import type { User, UserRole } from '@/types';

const { Title } = Typography;
const { Search } = Input;

/**
 * 用户管理页面（管理员）
 */
const AdminUsers = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserListResponse['users']>([]);
  const [stats, setStats] = useState<UserStatsResponse | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState<UserQueryParams>({});
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadUsers();
    loadStats();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await getUsers({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
      });

      if (res.success && res.data) {
        setUsers(res.data.users);
        setPagination((prev) => ({
          ...prev,
          total: res.data!.pagination.total,
        }));
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await getUserStats();
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

  const handleRoleFilter = (role: string) => {
    setFilters({ ...filters, role: role === 'all' ? undefined : role });
    setPagination({ ...pagination, current: 1 });
  };

  const handleStatusFilter = (status: string) => {
    setFilters({ ...filters, status: status === 'all' ? undefined : Number(status) });
    setPagination({ ...pagination, current: 1 });
  };

  const handleEdit = (user: User) => {
    setCurrentUser(user);
    form.setFieldsValue({
      name: user.name,
      email: user.email,
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!currentUser) return;

      await updateUser(currentUser.id, values);
      message.success('更新成功');
      setEditModalVisible(false);
      loadUsers();
    } catch (error: any) {
      message.error(error.response?.data?.message || '更新失败');
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const newStatus = user.status === 1 ? 0 : 1;
      await toggleUserStatus(user.id, newStatus);
      message.success(newStatus === 1 ? '已启用' : '已禁用');
      loadUsers();
      loadStats();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handlePromote = async (user: User) => {
    try {
      await promoteUser(user.id);
      message.success('已提升为管理员');
      loadUsers();
      loadStats();
    } catch (error: any) {
      message.error(error.response?.data?.message || '提升失败');
    }
  };

  const handleDemote = async (user: User) => {
    try {
      await demoteUser(user.id);
      message.success('已降级为普通用户');
      loadUsers();
      loadStats();
    } catch (error: any) {
      message.error(error.response?.data?.message || '降级失败');
    }
  };

  const handleDelete = async (user: User) => {
    try {
      await deleteUser(user.id);
      message.success('删除成功');
      loadUsers();
      loadStats();
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const getRoleTag = (role: UserRole) => {
    const roleConfig = {
      ROOT: { color: 'red', text: '超级管理员', icon: <CrownOutlined /> },
      ADMIN: { color: 'blue', text: '管理员', icon: <CrownOutlined /> },
      USER: { color: 'default', text: '普通用户', icon: <UserOutlined /> },
    };
    const config = roleConfig[role];
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  const getStatusTag = (status: number) => {
    return status === 1 ? (
      <Tag color="success" icon={<CheckCircleOutlined />}>
        启用
      </Tag>
    ) : (
      <Tag color="error" icon={<StopOutlined />}>
        禁用
      </Tag>
    );
  };

  const columns = [
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: (name: string | null) => name || '-',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 140,
      render: (role: UserRole) => getRoleTag(role),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: number) => getStatusTag(status),
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      width: 120,
      render: (balance: number) => balance?.toLocaleString() || 0,
    },
    {
      title: 'API Keys',
      key: 'apiKeys',
      width: 100,
      render: (record: any) => record._count?.apiKeys || 0,
    },
    {
      title: '交易记录',
      key: 'transactions',
      width: 100,
      render: (record: any) => record._count?.creditTransactions || 0,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      fixed: 'right' as const,
      render: (record: User) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>

          {record.role === 'USER' && (
            <Popconfirm
              title="确认提升为管理员？"
              onConfirm={() => handlePromote(record)}
              okText="确认"
              cancelText="取消"
            >
              <Button size="small" type="primary" icon={<CrownOutlined />}>
                提升
              </Button>
            </Popconfirm>
          )}

          {record.role === 'ADMIN' && (
            <Popconfirm
              title="确认降级为普通用户？"
              onConfirm={() => handleDemote(record)}
              okText="确认"
              cancelText="取消"
            >
              <Button size="small" icon={<CrownOutlined />}>
                降级
              </Button>
            </Popconfirm>
          )}

          {record.status === 1 ? (
            <Popconfirm
              title="确认禁用此用户？"
              onConfirm={() => handleToggleStatus(record)}
              okText="确认"
              cancelText="取消"
            >
              <Button size="small" danger icon={<StopOutlined />}>
                禁用
              </Button>
            </Popconfirm>
          ) : (
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handleToggleStatus(record)}
            >
              启用
            </Button>
          )}

          {record.role !== 'ROOT' && (
            <Popconfirm
              title="确认删除此用户？此操作不可恢复！"
              onConfirm={() => handleDelete(record)}
              okText="确认"
              cancelText="取消"
              icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
            >
              <Button size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 页面标题 */}
        <div>
          <Title level={2}>
            <UserOutlined /> 用户管理
          </Title>
        </div>

        {/* 统计卡片 */}
        {stats && (
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic title="总用户数" value={stats.total} prefix={<UserOutlined />} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="活跃用户"
                  value={stats.activeUsers}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="管理员"
                  value={stats.admins}
                  prefix={<CrownOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="超级管理员"
                  value={stats.rootUsers}
                  prefix={<CrownOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* 筛选工具栏 */}
        <Card>
          <Space wrap>
            <Search
              placeholder="搜索邮箱或姓名"
              allowClear
              enterButton={<SearchOutlined />}
              style={{ width: 300 }}
              onSearch={handleSearch}
            />
            <Select
              placeholder="角色筛选"
              style={{ width: 150 }}
              allowClear
              onChange={handleRoleFilter}
            >
              <Select.Option value="all">全部角色</Select.Option>
              <Select.Option value="USER">普通用户</Select.Option>
              <Select.Option value="ADMIN">管理员</Select.Option>
              <Select.Option value="ROOT">超级管理员</Select.Option>
            </Select>
            <Select
              placeholder="状态筛选"
              style={{ width: 150 }}
              allowClear
              onChange={handleStatusFilter}
            >
              <Select.Option value="all">全部状态</Select.Option>
              <Select.Option value="1">启用</Select.Option>
              <Select.Option value="0">禁用</Select.Option>
            </Select>
            <Button onClick={loadUsers}>刷新</Button>
          </Space>
        </Card>

        {/* 用户列表 */}
        <Card>
          <Table
            columns={columns}
            dataSource={users}
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

      {/* 编辑用户弹窗 */}
      <Modal
        title="编辑用户"
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => setEditModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="姓名" name="name">
            <Input placeholder="可选" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminUsers;
