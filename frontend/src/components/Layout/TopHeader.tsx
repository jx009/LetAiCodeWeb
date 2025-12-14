import { Layout, Avatar, Dropdown, Badge, Space, Typography } from 'antd';
import {
  UserOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store';
import { ROUTES } from '@/utils/constants';
import { formatCredit } from '@/utils/format';
import { getBalance } from '@/api';
import './TopHeader.css';

const { Header } = Layout;
const { Text } = Typography;

/**
 * 顶部导航栏组件
 * 完全复刻 MiniMAXI 平台的顶部导航
 */
const TopHeader = () => {
  const navigate = useNavigate();
  const { user, clearAuth, updateBalance, isAuthenticated } = useAuthStore();
  const intervalRef = useRef<NodeJS.Timeout>();

  // 获取余额
  const fetchBalance = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await getBalance();
      if (response.success && response.data) {
        updateBalance(response.data.balance);
      }
    } catch (error) {
      // 静默失败，不影响用户体验
      console.error('Failed to fetch balance:', error);
    }
  };

  // 初始化：获取余额并设置定时刷新（每30秒）
  useEffect(() => {
    if (isAuthenticated) {
      fetchBalance();

      // 每30秒刷新一次余额
      intervalRef.current = setInterval(() => {
        fetchBalance();
      }, 30000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAuthenticated]);

  // 退出登录
  const handleLogout = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    clearAuth();
    navigate(ROUTES.LOGIN);
  };

  // 用户菜单
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'account',
      icon: <UserOutlined />,
      label: '账户信息',
      onClick: () => navigate(ROUTES.ACCOUNT),
    },
    {
      key: 'balance',
      icon: <WalletOutlined />,
      label: '余额',
      onClick: () => navigate(ROUTES.BALANCE),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => navigate(ROUTES.SETTINGS),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <Header className="top-header">
      <div className="top-header-content">
        {/* 右侧：用户信息、余额、通知 */}
        <Space size="large" className="header-right">
          {/* 余额显示 */}
          <div className="balance-display" onClick={() => navigate(ROUTES.BALANCE)}>
            <WalletOutlined style={{ fontSize: 16, color: '#24be58' }} />
            <Text style={{ marginLeft: 8, fontWeight: 500 }}>
              余额: {formatCredit(user?.balance || 0)} 积分
            </Text>
          </div>

          {/* 通知 */}
          <Badge count={0} offset={[-5, 5]}>
            <div
              className="header-icon-btn"
              onClick={() => navigate(ROUTES.NOTIFICATIONS)}
              title="通知"
            >
              <BellOutlined style={{ fontSize: 18 }} />
            </div>
          </Badge>

          {/* 用户下拉菜单 */}
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
            <div className="user-info">
              <Avatar size={32} icon={<UserOutlined />} style={{ backgroundColor: '#24be58' }} />
              <Text style={{ marginLeft: 8 }}>{user?.email || '未登录'}</Text>
            </div>
          </Dropdown>
        </Space>
      </div>
    </Header>
  );
};

export default TopHeader;
