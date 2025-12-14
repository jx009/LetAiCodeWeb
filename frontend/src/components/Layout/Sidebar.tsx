import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppstoreOutlined,
  KeyOutlined,
  BarChartOutlined,
  UserOutlined,
  WalletOutlined,
  DollarOutlined,
  FileTextOutlined,
  BellOutlined,
  CrownOutlined,
  SettingOutlined,
  ShoppingOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useUIStore, useAuthStore } from '@/store';
import { ROUTES, APP_NAME } from '@/utils/constants';
import type { MenuItem } from '@/types';
import { UserRole } from '@/types';
import './Sidebar.css';

const { Sider } = Layout;

/**
 * 侧边栏组件
 * 完全复刻 MiniMAXI 平台的侧边导航
 */
const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user } = useAuthStore();

  // 检查是否是管理员
  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.ROOT;
  const isRoot = user?.role === UserRole.ROOT;

  // 基础菜单配置
  const basicMenuItems: MenuItem[] = [
    {
      key: ROUTES.CODING_PLAN,
      label: 'Coding Plan',
      icon: <AppstoreOutlined />,
      path: ROUTES.CODING_PLAN,
    },
    {
      key: ROUTES.API_KEYS,
      label: '接口密钥',
      icon: <KeyOutlined />,
      path: ROUTES.API_KEYS,
    },
    {
      key: ROUTES.USAGE,
      label: '账单记录',
      icon: <BarChartOutlined />,
      path: ROUTES.USAGE,
    },
    {
      key: ROUTES.ACCOUNT,
      label: '账户信息',
      icon: <UserOutlined />,
      path: ROUTES.ACCOUNT,
    },
    {
      key: ROUTES.BALANCE,
      label: '余额',
      icon: <WalletOutlined />,
      path: ROUTES.BALANCE,
    },
    {
      key: ROUTES.RECHARGE,
      label: '充值记录',
      icon: <DollarOutlined />,
      path: ROUTES.RECHARGE,
    },
    {
      key: ROUTES.DOCS,
      label: '文档',
      icon: <FileTextOutlined />,
      path: ROUTES.DOCS,
    },
    {
      key: ROUTES.NOTIFICATIONS,
      label: '通知',
      icon: <BellOutlined />,
      path: ROUTES.NOTIFICATIONS,
    },
  ];

  // 管理员菜单配置
  const adminMenuItems: MenuItem[] = [
    {
      key: 'admin-divider',
      label: '管理员',
      icon: <CrownOutlined />,
      path: '',
    },
    {
      key: '/admin/users',
      label: '用户管理',
      icon: <TeamOutlined />,
      path: '/admin/users',
    },
    {
      key: '/admin/orders',
      label: '订单管理',
      icon: <ShoppingOutlined />,
      path: '/admin/orders',
    },
  ];

  // 超级管理员菜单配置
  const rootMenuItems: MenuItem[] = [
    {
      key: '/admin/settings',
      label: '系统配置',
      icon: <SettingOutlined />,
      path: '/admin/settings',
    },
  ];

  // 组合菜单
  let menuItems = [...basicMenuItems];
  if (isAdmin) {
    menuItems = [...menuItems, ...adminMenuItems];
  }
  if (isRoot) {
    menuItems = [...menuItems, ...rootMenuItems];
  }

  // 菜单点击事件
  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  // 获取当前选中的菜单项
  const selectedKey = location.pathname;

  return (
    <Sider
      collapsible
      collapsed={sidebarCollapsed}
      onCollapse={toggleSidebar}
      width={200}
      collapsedWidth={80}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        background: '#ffffff',
        borderRight: '1px solid #f0f0f0',
        zIndex: 100,
      }}
    >
      {/* Logo 区域 */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <AppstoreOutlined style={{ fontSize: 24, color: '#24be58' }} />
        </div>
        {!sidebarCollapsed && <div className="logo-text">{APP_NAME}</div>}
      </div>

      {/* 菜单 */}
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        onClick={handleMenuClick}
        items={menuItems.map((item) => {
          // 管理员分隔标题
          if (item.key === 'admin-divider') {
            return {
              key: item.key,
              label: item.label,
              icon: item.icon,
              disabled: true,
              style: {
                cursor: 'default',
                fontWeight: 'bold',
                marginTop: 16,
                backgroundColor: 'transparent',
              },
            };
          }
          return {
            key: item.key,
            icon: item.icon,
            label: item.label,
          };
        })}
        style={{
          border: 'none',
        }}
      />
    </Sider>
  );
};

export default Sidebar;
