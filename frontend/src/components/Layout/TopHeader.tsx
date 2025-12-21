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
import { useAuthStore } from '@/store';
import { ROUTES } from '@/utils/constants';
import './TopHeader.css';

const { Header } = Layout;
const { Text } = Typography;

/**
 * 顶部导航栏组件
 * 完全复刻 MiniMAXI 平台的顶部导航
 */
const TopHeader = () => {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();

  // 退出登录
  const handleLogout = () => {
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
        {/* 右侧：用户信息、通知 */}
        <Space size="large" className="header-right">
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
