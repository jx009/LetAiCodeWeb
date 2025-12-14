import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import { ROUTES } from './utils/constants';
import { UserRole } from './types';

// Layouts
import AppLayout from './components/Layout/AppLayout';

// Pages
import Login from './pages/Login';
import CodingPlan from './pages/CodingPlan';
import ApiKeys from './pages/ApiKeys';
import Usage from './pages/Usage';
import Account from './pages/Account';
import Balance from './pages/Balance';
import Recharge from './pages/Recharge';
import Docs from './pages/Docs';
import Notifications from './pages/Notifications';

// Admin Pages
import AdminUsers from './pages/Admin/Users';
import AdminSettings from './pages/Admin/Settings';
import AdminOrders from './pages/Admin/Orders';

// 路由守卫组件
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <>{children}</>;
};

// 管理员路由守卫
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (user?.role !== UserRole.ADMIN && user?.role !== UserRole.ROOT) {
    return <Navigate to={ROUTES.CODING_PLAN} replace />;
  }

  return <>{children}</>;
};

// 超级管理员路由守卫
const RootRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (user?.role !== UserRole.ROOT) {
    return <Navigate to={ROUTES.CODING_PLAN} replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 登录页 */}
        <Route path={ROUTES.LOGIN} element={<Login />} />

        {/* 主应用 */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        >
          {/* 默认重定向到套餐页 */}
          <Route index element={<Navigate to={ROUTES.CODING_PLAN} replace />} />

          {/* 套餐订阅页（首页） */}
          <Route path={ROUTES.CODING_PLAN} element={<CodingPlan />} />

          {/* API 密钥管理 */}
          <Route path={ROUTES.API_KEYS} element={<ApiKeys />} />

          {/* 使用记录 */}
          <Route path={ROUTES.USAGE} element={<Usage />} />

          {/* 账户信息 */}
          <Route path={ROUTES.ACCOUNT} element={<Account />} />

          {/* 余额 */}
          <Route path={ROUTES.BALANCE} element={<Balance />} />

          {/* 充值 */}
          <Route path={ROUTES.RECHARGE} element={<Recharge />} />

          {/* 文档 */}
          <Route path={ROUTES.DOCS} element={<Docs />} />

          {/* 通知 */}
          <Route path={ROUTES.NOTIFICATIONS} element={<Notifications />} />

          {/* 管理员路由 */}
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <AdminRoute>
                <AdminOrders />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <RootRoute>
                <AdminSettings />
              </RootRoute>
            }
          />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
