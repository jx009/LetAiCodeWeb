import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import { useUIStore } from '@/store';
import './AppLayout.css';

const { Content } = Layout;

/**
 * 主布局组件
 * 完全复刻 MiniMAXI 平台的布局结构
 */
const AppLayout = () => {
  const { sidebarCollapsed } = useUIStore();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 侧边栏 */}
      <Sidebar />

      {/* 主内容区 */}
      <Layout
        style={{
          marginLeft: sidebarCollapsed ? 80 : 200,
          transition: 'margin-left 0.3s ease',
        }}
      >
        {/* 顶部导航栏 */}
        <TopHeader />

        {/* 内容区域 */}
        <Content
          style={{
            margin: '24px',
            padding: '24px',
            background: '#ffffff',
            borderRadius: '8px',
            minHeight: 'calc(100vh - 64px - 48px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
