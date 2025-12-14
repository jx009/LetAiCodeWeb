# LetAiCode 详细开发方案

> **项目目标**：在 `C:\jxProject\LetAiCodeWeb` 内实现名为 "LetAiCode" 的前后端应用，**完全1:1复刻** MiniMAXI 平台界面（https://platform.minimaxi.com），实现邮箱登录、积分扣费、Key管理、文档、充值套餐等完整功能闭环，并对接中转站项目 `C:\jxProject\new-api`。

---

## 一、技术栈选型

### 1.1 前端技术栈
```
核心框架：React 18+ + TypeScript 5+
构建工具：Vite 5.0+
UI 组件库：Ant Design 5.x（与 MiniMAXI 保持一致）
状态管理：Zustand / React Context + Hooks
路由：React Router v6
HTTP 客户端：Axios
CSS 方案：CSS Modules + Ant Design 主题定制
代码规范：ESLint + Prettier
```

**关键点**：
- 必须使用 Ant Design 5.x，因为 MiniMAXI 使用该版本
- 主题色：`#24be58`（绿色），需要在 Ant Design 中配置
- 字体：默认 `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto...`

### 1.2 后端技术栈
```
运行时：Node.js 18+
框架：Express 4.18+
语言：TypeScript 5+
ORM：Prisma 5+
数据库：SQLite（开发） / PostgreSQL（生产可选）
缓存/会话：Redis（通过 ioredis）
认证：JWT + HttpOnly Cookie
邮件：nodemailer
支付：微信支付 V3（参考 InterviewCodeOverlay3333）
包管理：pnpm
```

### 1.3 开发工具链
```
版本控制：Git
代码编辑器：VSCode
API 测试：Postman / Thunder Client
数据库工具：Prisma Studio / DBeaver
```

---

## 二、前端架构设计

### 2.1 目录结构
```
frontend/
├── public/                    # 静态资源（从 htmlCopy 提取）
│   ├── images/               # 图片资源
│   ├── fonts/                # 字体文件
│   └── favicon.ico           # 站点图标
├── src/
│   ├── api/                  # API 请求封装
│   │   ├── auth.ts          # 认证相关 API
│   │   ├── keys.ts          # Key 管理 API
│   │   ├── usage.ts         # 使用记录 API
│   │   ├── recharge.ts      # 充值 API
│   │   └── index.ts         # API 统一导出
│   ├── components/           # 通用组件
│   │   ├── Layout/          # 布局组件
│   │   │   ├── AppLayout.tsx        # 主布局（侧边栏+顶栏）
│   │   │   ├── Sidebar.tsx          # 侧边导航
│   │   │   ├── TopHeader.tsx        # 顶部导航栏
│   │   │   └── index.ts
│   │   ├── Cards/           # 卡片组件
│   │   │   ├── PlanCard.tsx         # 套餐卡片
│   │   │   ├── KeyCard.tsx          # Key 展示卡片
│   │   │   └── index.ts
│   │   ├── Tables/          # 表格组件
│   │   │   ├── UsageTable.tsx       # 使用记录表格
│   │   │   ├── TransactionTable.tsx # 交易记录表格
│   │   │   └── index.ts
│   │   ├── Modals/          # 弹窗组件
│   │   │   ├── CreateKeyModal.tsx   # 创建 Key 弹窗
│   │   │   ├── PaymentModal.tsx     # 支付弹窗
│   │   │   └── index.ts
│   │   └── Common/          # 通用组件
│   │       ├── LoadingSpinner.tsx
│   │       ├── EmptyState.tsx
│   │       └── index.ts
│   ├── pages/                # 页面组件
│   │   ├── Login/           # 登录页
│   │   │   └── index.tsx
│   │   ├── CodingPlan/      # 套餐订阅页（主页）
│   │   │   └── index.tsx
│   │   ├── ApiKeys/         # Key 管理页
│   │   │   └── index.tsx
│   │   ├── Usage/           # 使用记录/账单页
│   │   │   └── index.tsx
│   │   ├── Account/         # 账户信息页
│   │   │   └── index.tsx
│   │   ├── Balance/         # 余额/充值记录页
│   │   │   └── index.tsx
│   │   ├── Recharge/        # 充值页
│   │   │   └── index.tsx
│   │   ├── Docs/            # 文档页（占位）
│   │   │   └── index.tsx
│   │   └── Notifications/   # 通知页
│   │       └── index.tsx
│   ├── hooks/                # 自定义 Hooks
│   │   ├── useAuth.ts       # 认证 Hook
│   │   ├── useApiKeys.ts    # Key 管理 Hook
│   │   ├── useUsage.ts      # 使用记录 Hook
│   │   └── useBalance.ts    # 余额 Hook
│   ├── store/                # 状态管理
│   │   ├── authStore.ts     # 用户认证状态
│   │   ├── uiStore.ts       # UI 状态
│   │   └── index.ts
│   ├── styles/               # 全局样式
│   │   ├── variables.css    # CSS 变量（主题色等）
│   │   ├── antd-theme.ts    # Ant Design 主题配置
│   │   └── global.css       # 全局样式
│   ├── types/                # TypeScript 类型定义
│   │   ├── api.ts           # API 响应类型
│   │   ├── models.ts        # 数据模型类型
│   │   └── index.ts
│   ├── utils/                # 工具函数
│   │   ├── request.ts       # Axios 封装
│   │   ├── auth.ts          # 认证工具
│   │   ├── format.ts        # 格式化工具
│   │   └── constants.ts     # 常量定义
│   ├── App.tsx               # 根组件
│   ├── main.tsx              # 入口文件
│   └── vite-env.d.ts         # Vite 类型声明
├── .env.example              # 环境变量示例
├── .eslintrc.json            # ESLint 配置
├── .prettierrc               # Prettier 配置
├── tsconfig.json             # TypeScript 配置
├── vite.config.ts            # Vite 配置
└── package.json              # 依赖配置
```

### 2.2 核心组件设计

#### 2.2.1 布局组件（AppLayout）
```tsx
// 功能：主布局，包含侧边栏和顶栏
// 特点：
// - 侧边栏折叠/展开
// - 顶栏包含用户信息、余额、通知
// - 响应式设计（移动端适配）
// - 路由高亮显示
```

#### 2.2.2 套餐卡片（PlanCard）
```tsx
// 功能：展示套餐信息
// 特点：
// - 价格、积分、赠送积分展示
// - 订阅/购买按钮
// - hover 动效
// - 推荐标签
```

#### 2.2.3 Key 管理表格（ApiKeys）
```tsx
// 功能：展示和管理 API Keys
// 特点：
// - 新建 Key 按钮
// - Key 列表（名称、创建时间、状态）
// - 复制 Key 功能（脱敏显示）
// - 删除/禁用 Key
// - 使用量统计
```

#### 2.2.4 使用记录表格（UsageTable）
```tsx
// 功能：展示 API 使用记录
// 特点：
// - 时间范围筛选
// - 模型名称筛选
// - Token 消耗展示
// - 积分扣除展示
// - 分页加载
// - 导出功能
```

### 2.3 Ant Design 主题定制

```typescript
// src/styles/antd-theme.ts
import type { ThemeConfig } from 'antd';

export const theme: ThemeConfig = {
  token: {
    colorPrimary: '#24be58',          // 主题色（绿色）
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1677ff',
    colorLink: '#24be58',
    borderRadius: 4,
    fontSize: 14,
    fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif`,
  },
  components: {
    Button: {
      controlHeight: 32,
      fontSize: 14,
    },
    Table: {
      headerBg: '#fafafa',
      headerColor: 'rgba(0,0,0,0.88)',
    },
    Card: {
      borderRadiusLG: 8,
      boxShadowTertiary: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02)',
    },
  },
};
```

### 2.4 路由设计

```typescript
// src/App.tsx 路由配置
const routes = [
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/coding-plan" /> },
      { path: 'coding-plan', element: <CodingPlan /> },      // 套餐页（首页）
      { path: 'keys', element: <ApiKeys /> },                 // Key 管理
      { path: 'usage', element: <Usage /> },                  // 使用记录
      { path: 'account', element: <Account /> },              // 账户信息
      { path: 'balance', element: <Balance /> },              // 余额
      { path: 'recharge', element: <Recharge /> },            // 充值
      { path: 'docs', element: <Docs /> },                    // 文档
      { path: 'notifications', element: <Notifications /> },  // 通知
    ],
  },
];
```

### 2.5 状态管理设计

```typescript
// 使用 Zustand 进行状态管理

// authStore.ts - 用户认证状态
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, code: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

// uiStore.ts - UI 状态
interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}
```

---

## 三、后端架构设计

### 3.1 目录结构
```
backend/
├── src/
│   ├── controllers/          # 控制器层
│   │   ├── auth.controller.ts       # 认证控制器
│   │   ├── keys.controller.ts       # Key 管理控制器
│   │   ├── usage.controller.ts      # 使用记录控制器
│   │   ├── recharge.controller.ts   # 充值控制器
│   │   └── user.controller.ts       # 用户控制器
│   ├── services/             # 服务层
│   │   ├── auth.service.ts          # 认证服务
│   │   ├── email.service.ts         # 邮件服务
│   │   ├── keys.service.ts          # Key 管理服务
│   │   ├── usage.service.ts         # 使用记录服务
│   │   ├── credit.service.ts        # 积分服务
│   │   ├── payment.service.ts       # 支付服务
│   │   └── newapi.service.ts        # new-api 集成服务
│   ├── middlewares/          # 中间件
│   │   ├── auth.middleware.ts       # JWT 认证中间件
│   │   ├── error.middleware.ts      # 错误处理中间件
│   │   ├── validate.middleware.ts   # 参数验证中间件
│   │   └── rateLimit.middleware.ts  # 限流中间件
│   ├── routes/               # 路由
│   │   ├── auth.routes.ts           # 认证路由
│   │   ├── keys.routes.ts           # Key 管理路由
│   │   ├── usage.routes.ts          # 使用记录路由
│   │   ├── recharge.routes.ts       # 充值路由
│   │   └── index.ts                 # 路由汇总
│   ├── models/               # Prisma 客户端封装
│   │   └── prisma.ts                # Prisma 实例
│   ├── types/                # TypeScript 类型
│   │   ├── express.d.ts             # Express 扩展类型
│   │   └── api.types.ts             # API 类型定义
│   ├── utils/                # 工具函数
│   │   ├── jwt.util.ts              # JWT 工具
│   │   ├── bcrypt.util.ts           # 密码加密工具
│   │   ├── redis.util.ts            # Redis 工具
│   │   ├── logger.util.ts           # 日志工具
│   │   └── validators.util.ts       # 验证器
│   ├── config/               # 配置文件
│   │   ├── database.config.ts       # 数据库配置
│   │   ├── redis.config.ts          # Redis 配置
│   │   ├── email.config.ts          # 邮件配置
│   │   └── payment.config.ts        # 支付配置
│   ├── app.ts                # Express 应用配置
│   └── server.ts             # 服务器入口
├── prisma/
│   ├── schema.prisma         # Prisma 数据模型
│   ├── migrations/           # 数据库迁移文件
│   └── seed.ts               # 数据填充脚本
├── .env.example              # 环境变量示例
├── tsconfig.json             # TypeScript 配置
└── package.json              # 依赖配置
```

### 3.2 数据库设计（Prisma Schema）

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"  // 开发环境使用 SQLite，生产可切换为 postgresql
  url      = env("DATABASE_URL")
}

// 用户表
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 关联
  apiKeys           ApiKey[]
  creditTransactions CreditTransaction[]
  sessions          Session[]

  @@map("users")
}

// 邮箱验证码表
model EmailCode {
  id        String   @id @default(uuid())
  email     String
  code      String   // 6位验证码
  expiresAt DateTime // 过期时间（5分钟）
  used      Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([email, createdAt])
  @@map("email_codes")
}

// API Key 表
model ApiKey {
  id            String   @id @default(uuid())
  userId        String
  label         String   // Key 名称/备注
  remoteKeyId   String?  // new-api 中的 Key ID
  maskedValue   String   // 脱敏后的 Key 值（sk-****...后4位）
  fullValue     String   // 完整 Key 值（加密存储）
  status        KeyStatus @default(ACTIVE)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  lastUsedAt    DateTime?

  // 关联
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  usageRecords  UsageRecord[]

  @@index([userId])
  @@index([remoteKeyId])
  @@map("api_keys")
}

enum KeyStatus {
  ACTIVE
  DISABLED
  DELETED
}

// 使用记录表
model UsageRecord {
  id            String   @id @default(uuid())
  apiKeyId      String
  timestamp     DateTime @default(now())
  model         String   // 模型名称
  promptTokens  Int      // 提示 tokens
  completionTokens Int   // 完成 tokens
  totalTokens   Int      // 总 tokens
  creditCost    Int      // 积分消耗
  rawMeta       Json?    // 原始元数据（JSON）

  // 关联
  apiKey        ApiKey   @relation(fields: [apiKeyId], references: [id], onDelete: Cascade)

  @@index([apiKeyId, timestamp])
  @@map("usage_records")
}

// 积分交易表
model CreditTransaction {
  id        String   @id @default(uuid())
  userId    String
  type      TransactionType
  amount    Int      // 积分数量（正数为充值/赠送，负数为扣除）
  balance   Int      // 交易后余额
  ref       String?  // 关联引用（订单号、使用记录ID等）
  desc      String?  // 描述
  createdAt DateTime @default(now())

  // 关联
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
  @@map("credit_transactions")
}

enum TransactionType {
  RECHARGE      // 充值
  BONUS         // 赠送
  DEDUCT        // 扣除
  REFUND        // 退款
  ADMIN_ADJUST  // 管理员调整
}

// 套餐计划表
model PackagePlan {
  id          String   @id @default(uuid())
  name        String   // 套餐名称
  price       Decimal  @db.Decimal(10, 2) // 价格（元）
  creditAmount Int     // 基础积分
  bonusCredit  Int     @default(0) // 赠送积分
  desc        String?  // 描述
  sortOrder   Int      @default(0) // 排序
  active      Boolean  @default(true) // 是否激活
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // 关联
  orders      PaymentOrder[]

  @@map("package_plans")
}

// 支付订单表
model PaymentOrder {
  id            String   @id @default(uuid())
  orderNo       String   @unique // 订单号
  userId        String
  packageId     String
  amount        Decimal  @db.Decimal(10, 2) // 支付金额
  creditAmount  Int      // 购买积分
  bonusCredit   Int      @default(0) // 赠送积分
  status        PaymentStatus @default(PENDING)
  paymentMethod String?  // 支付方式（wechat/alipay）
  transactionId String?  // 第三方交易号
  paidAt        DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  expiresAt     DateTime // 订单过期时间

  // 关联
  package       PackagePlan @relation(fields: [packageId], references: [id])

  @@index([userId, createdAt])
  @@index([orderNo])
  @@map("payment_orders")
}

enum PaymentStatus {
  PENDING    // 待支付
  PAID       // 已支付
  CANCELLED  // 已取消
  EXPIRED    // 已过期
  REFUNDED   // 已退款
}

// 会话表
model Session {
  id           String   @id @default(uuid())
  userId       String
  refreshToken String   @unique
  expiresAt    DateTime // 14天有效期
  createdAt    DateTime @default(now())

  // 关联
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([refreshToken])
  @@map("sessions")
}

// 配置表（系统配置）
model Config {
  id        String   @id @default(uuid())
  key       String   @unique
  value     String
  desc      String?
  updatedAt DateTime @updatedAt

  @@map("configs")
}
```

### 3.3 API 接口设计

#### 3.3.1 认证模块

**POST /api/auth/send-code**
```json
// 发送邮箱验证码
Request:
{
  "email": "user@example.com"
}

Response:
{
  "success": true,
  "message": "验证码已发送",
  "expiresIn": 300  // 5分钟
}
```

**POST /api/auth/login**
```json
// 邮箱登录
Request:
{
  "email": "user@example.com",
  "code": "123456"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "xxx",
      "email": "user@example.com",
      "name": null,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGc..."  // JWT token
  }
}
```

**POST /api/auth/logout**
```json
// 登出
Response:
{
  "success": true,
  "message": "登出成功"
}
```

**POST /api/auth/refresh**
```json
// 刷新 token
Response:
{
  "success": true,
  "token": "eyJhbGc..."
}
```

#### 3.3.2 Key 管理模块

**GET /api/keys**
```json
// 获取 Key 列表
Response:
{
  "success": true,
  "data": [
    {
      "id": "xxx",
      "label": "开发环境Key",
      "maskedValue": "sk-****...abc123",
      "status": "ACTIVE",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastUsedAt": "2024-01-10T12:00:00.000Z",
      "usage": {
        "totalTokens": 1000000,
        "creditCost": 100
      }
    }
  ]
}
```

**POST /api/keys**
```json
// 创建新 Key
Request:
{
  "label": "生产环境Key"
}

Response:
{
  "success": true,
  "data": {
    "id": "xxx",
    "label": "生产环境Key",
    "fullValue": "sk-1234567890abcdef1234567890abcdef12345678",  // 只返回一次
    "maskedValue": "sk-****...5678",
    "status": "ACTIVE",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**DELETE /api/keys/:id**
```json
// 删除 Key
Response:
{
  "success": true,
  "message": "Key 已删除"
}
```

**PATCH /api/keys/:id/status**
```json
// 启用/禁用 Key
Request:
{
  "status": "DISABLED"
}

Response:
{
  "success": true,
  "message": "Key 状态已更新"
}
```

#### 3.3.3 使用记录模块

**GET /api/usage**
```json
// 获取使用记录
Query Parameters:
- keyId?: string          // Key ID（可选）
- startDate?: string      // 开始日期
- endDate?: string        // 结束日期
- model?: string          // 模型名称（可选）
- page: number = 1
- pageSize: number = 20

Response:
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "xxx",
        "apiKey": {
          "id": "xxx",
          "label": "开发环境Key"
        },
        "timestamp": "2024-01-10T12:00:00.000Z",
        "model": "gpt-4",
        "promptTokens": 100,
        "completionTokens": 200,
        "totalTokens": 300,
        "creditCost": 3
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "pageSize": 20,
      "totalPages": 5
    },
    "summary": {
      "totalTokens": 1000000,
      "totalCreditCost": 10000
    }
  }
}
```

**POST /api/usage/sync**
```json
// 手动同步 new-api 的使用记录
Response:
{
  "success": true,
  "data": {
    "synced": 50,  // 同步的记录数
    "message": "同步成功"
  }
}
```

#### 3.3.4 充值模块

**GET /api/plans**
```json
// 获取套餐列表
Response:
{
  "success": true,
  "data": [
    {
      "id": "xxx",
      "name": "基础套餐",
      "price": "99.00",
      "creditAmount": 100000,
      "bonusCredit": 10000,
      "desc": "适合个人开发者",
      "sortOrder": 1
    }
  ]
}
```

**POST /api/orders**
```json
// 创建充值订单
Request:
{
  "packageId": "xxx"
}

Response:
{
  "success": true,
  "data": {
    "orderNo": "ORD20240101120000001",
    "amount": "99.00",
    "creditAmount": 100000,
    "bonusCredit": 10000,
    "qrCodeUrl": "weixin://wxpay/...",  // 支付二维码
    "expiresAt": "2024-01-01T00:30:00.000Z"
  }
}
```

**POST /api/payments/notify/wechat**
```json
// 微信支付回调（由微信服务器调用）
// 处理支付成功，更新订单状态，增加用户积分
```

**GET /api/transactions**
```json
// 获取交易记录
Query Parameters:
- type?: TransactionType  // 交易类型
- startDate?: string
- endDate?: string
- page: number = 1
- pageSize: number = 20

Response:
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "xxx",
        "type": "RECHARGE",
        "amount": 110000,  // +110000 积分
        "balance": 110000,
        "ref": "ORD20240101120000001",
        "desc": "充值套餐：基础套餐（含赠送）",
        "createdAt": "2024-01-01T12:00:00.000Z"
      },
      {
        "id": "xxx",
        "type": "DEDUCT",
        "amount": -300,  // -300 积分
        "balance": 109700,
        "ref": "usage_record_id",
        "desc": "API 调用扣费（gpt-4，300 tokens）",
        "createdAt": "2024-01-01T12:05:00.000Z"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "pageSize": 20,
      "totalPages": 3
    },
    "summary": {
      "currentBalance": 109700
    }
  }
}
```

#### 3.3.5 用户模块

**GET /api/user/profile**
```json
// 获取用户信息
Response:
{
  "success": true,
  "data": {
    "id": "xxx",
    "email": "user@example.com",
    "name": "张三",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "balance": 109700  // 当前积分余额
  }
}
```

**PATCH /api/user/profile**
```json
// 更新用户信息
Request:
{
  "name": "张三"
}

Response:
{
  "success": true,
  "message": "更新成功"
}
```

### 3.4 中间件设计

#### 3.4.1 认证中间件
```typescript
// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, message: '未授权' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    req.userId = decoded.userId;  // 扩展 Request 类型

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token 无效或已过期' });
  }
};
```

#### 3.4.2 错误处理中间件
```typescript
// src/middlewares/error.middleware.ts
import { Request, Response, NextFunction } from 'express';

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('[ERROR]', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
```

### 3.5 服务层设计示例

#### 3.5.1 new-api 集成服务
```typescript
// src/services/newapi.service.ts
import axios from 'axios';

class NewApiService {
  private baseURL: string;
  private adminToken: string;

  constructor() {
    this.baseURL = process.env.NEW_API_BASE_URL || 'http://localhost:3000';
    this.adminToken = process.env.NEW_API_ADMIN_TOKEN || '';
  }

  // 创建 Token（Key）
  async createToken(userId: string, label: string): Promise<{ key: string; id: string }> {
    const response = await axios.post(
      `${this.baseURL}/api/token/`,
      {
        name: label,
        remain_quota: -1,  // 无限额度（在我们的系统中控制）
        unlimited_quota: true,
        user_id: userId,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.adminToken}`,
        },
      }
    );

    return {
      key: response.data.key,      // 完整的 Key（sk-xxx...）
      id: response.data.id,         // new-api 中的 Token ID
    };
  }

  // 删除 Token
  async deleteToken(remoteKeyId: string): Promise<void> {
    await axios.delete(
      `${this.baseURL}/api/token/${remoteKeyId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.adminToken}`,
        },
      }
    );
  }

  // 获取 Token 使用记录
  async getTokenUsage(remoteKeyId: string, startTime?: Date, endTime?: Date) {
    const params: any = { token_id: remoteKeyId };
    if (startTime) params.start_timestamp = Math.floor(startTime.getTime() / 1000);
    if (endTime) params.end_timestamp = Math.floor(endTime.getTime() / 1000);

    const response = await axios.get(
      `${this.baseURL}/api/log/token`,
      {
        params,
        headers: {
          'Authorization': `Bearer ${this.adminToken}`,
        },
      }
    );

    return response.data;  // 返回使用记录列表
  }
}

export default new NewApiService();
```

#### 3.5.2 积分服务
```typescript
// src/services/credit.service.ts
import prisma from '../models/prisma';
import { TransactionType } from '@prisma/client';

class CreditService {
  // 积分换算比例配置（每1000 tokens = X 积分）
  private readonly TOKEN_TO_CREDIT_RATIO = 1;  // 可配置

  // 扣除积分（API 调用）
  async deductCredit(
    userId: string,
    apiKeyId: string,
    tokens: number,
    model: string,
    usageRecordId: string
  ): Promise<void> {
    const creditCost = Math.ceil((tokens / 1000) * this.TOKEN_TO_CREDIT_RATIO);

    await prisma.$transaction(async (tx) => {
      // 计算新余额
      const lastTransaction = await tx.creditTransaction.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      const currentBalance = lastTransaction?.balance || 0;
      const newBalance = currentBalance - creditCost;

      if (newBalance < 0) {
        throw new Error('积分余额不足');
      }

      // 创建扣费记录
      await tx.creditTransaction.create({
        data: {
          userId,
          type: TransactionType.DEDUCT,
          amount: -creditCost,
          balance: newBalance,
          ref: usageRecordId,
          desc: `API 调用扣费（${model}，${tokens} tokens）`,
        },
      });
    });
  }

  // 充值积分
  async rechargeCredit(
    userId: string,
    amount: number,
    bonusAmount: number,
    orderNo: string
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const lastTransaction = await tx.creditTransaction.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      const currentBalance = lastTransaction?.balance || 0;

      // 基础充值
      const newBalanceBase = currentBalance + amount;
      await tx.creditTransaction.create({
        data: {
          userId,
          type: TransactionType.RECHARGE,
          amount,
          balance: newBalanceBase,
          ref: orderNo,
          desc: `充值积分`,
        },
      });

      // 赠送积分（如果有）
      if (bonusAmount > 0) {
        const newBalanceBonus = newBalanceBase + bonusAmount;
        await tx.creditTransaction.create({
          data: {
            userId,
            type: TransactionType.BONUS,
            amount: bonusAmount,
            balance: newBalanceBonus,
            ref: orderNo,
            desc: `充值赠送积分`,
          },
        });
      }
    });
  }

  // 获取当前余额
  async getBalance(userId: string): Promise<number> {
    const lastTransaction = await prisma.creditTransaction.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return lastTransaction?.balance || 0;
  }
}

export default new CreditService();
```

---

## 四、与 new-api 集成方案

### 4.1 集成架构

```
┌─────────────────────────────────────────────────────────────┐
│                       LetAiCode 系统                          │
│                                                               │
│  ┌──────────┐    ┌──────────┐    ┌──────────────┐          │
│  │ 前端      │───▶│ 后端API   │───▶│ new-api服务  │          │
│  │ (React)  │    │ (Express) │    │ (Go)         │          │
│  └──────────┘    └──────────┘    └──────────────┘          │
│                        │                   │                  │
│                        ▼                   ▼                  │
│                  ┌──────────┐       ┌──────────┐            │
│                  │ PostgreSQL│       │ MySQL    │            │
│                  │ (LetAiCode)│       │ (new-api)│            │
│                  └──────────┘       └──────────┘            │
└─────────────────────────────────────────────────────────────┘

用户 ───────────────▶ LetAiCode ────────▶ new-api ────────▶ OpenAI/...
     (通过浏览器)      (管理和计费)       (模型中转)      (AI 服务商)
```

### 4.2 关键集成点

#### 4.2.1 Key 生成流程
```
1. 用户在 LetAiCode 前端点击"创建 Key"
   ↓
2. LetAiCode 后端调用 new-api 的 POST /api/token/ 接口
   ↓
3. new-api 生成 48 字符的 Key（sk-xxx...）并返回
   ↓
4. LetAiCode 将完整 Key 加密存储，脱敏值显示给用户
   ↓
5. LetAiCode 记录 remoteKeyId，用于后续查询和删除
```

**实现代码**：
```typescript
// src/services/keys.service.ts
async createKey(userId: string, label: string) {
  // 1. 调用 new-api 创建 Token
  const { key, id: remoteKeyId } = await newApiService.createToken(userId, label);

  // 2. 加密完整 Key
  const fullValue = encrypt(key);  // 使用 AES 加密

  // 3. 生成脱敏值
  const maskedValue = `sk-****...${key.slice(-4)}`;

  // 4. 存储到数据库
  const apiKey = await prisma.apiKey.create({
    data: {
      userId,
      label,
      remoteKeyId,
      fullValue,
      maskedValue,
      status: 'ACTIVE',
    },
  });

  return {
    ...apiKey,
    fullValue: key,  // 只在创建时返回一次完整 Key
  };
}
```

#### 4.2.2 Key 删除流程
```
1. 用户在 LetAiCode 前端点击"删除 Key"
   ↓
2. LetAiCode 后端调用 new-api 的 DELETE /api/token/:id 接口
   ↓
3. new-api 删除对应的 Token
   ↓
4. LetAiCode 标记本地 Key 状态为 DELETED
```

#### 4.2.3 使用记录同步流程
```
┌─────────────────────────────────────────────────────────────┐
│                    使用记录同步策略                           │
│                                                               │
│  方案A：定时轮询（推荐）                                      │
│  ────────────────────────────────────────────────────        │
│  1. 后端定时任务（每5分钟）                                   │
│  2. 调用 new-api GET /api/log/token?key=xxx 接口             │
│  3. 拉取最近的使用记录                                        │
│  4. 计算积分消耗并扣除                                        │
│  5. 存储到 UsageRecord 表                                     │
│                                                               │
│  方案B：Webhook 回调（可选）                                  │
│  ────────────────────────────────────────────────────        │
│  1. 配置 new-api 在每次调用后回调 LetAiCode                   │
│  2. LetAiCode 提供 POST /api/webhooks/usage 接口             │
│  3. 实时接收使用记录并扣费                                    │
│                                                               │
│  优先选择方案A，简单可靠，方案B需要 new-api 支持              │
└─────────────────────────────────────────────────────────────┘
```

**定时同步实现**：
```typescript
// src/services/usage.service.ts
import cron from 'node-cron';

class UsageService {
  // 初始化定时任务（每5分钟执行一次）
  initSyncScheduler() {
    cron.schedule('*/5 * * * *', async () => {
      console.log('[Usage Sync] 开始同步使用记录...');
      await this.syncAllKeys();
    });
  }

  // 同步所有激活的 Key
  async syncAllKeys() {
    const activeKeys = await prisma.apiKey.findMany({
      where: { status: 'ACTIVE' },
    });

    for (const key of activeKeys) {
      try {
        await this.syncKeyUsage(key.id, key.remoteKeyId!);
      } catch (error) {
        console.error(`[Usage Sync] Key ${key.id} 同步失败:`, error);
      }
    }
  }

  // 同步单个 Key 的使用记录
  async syncKeyUsage(keyId: string, remoteKeyId: string) {
    // 1. 获取最后同步时间
    const lastRecord = await prisma.usageRecord.findFirst({
      where: { apiKeyId: keyId },
      orderBy: { timestamp: 'desc' },
    });

    const startTime = lastRecord ? lastRecord.timestamp : new Date(0);

    // 2. 从 new-api 拉取新记录
    const logs = await newApiService.getTokenUsage(remoteKeyId, startTime);

    // 3. 处理并存储每条记录
    for (const log of logs) {
      await this.processUsageLog(keyId, log);
    }
  }

  // 处理单条使用记录
  async processUsageLog(keyId: string, log: any) {
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: keyId },
      include: { user: true },
    });

    if (!apiKey) return;

    // 计算积分消耗
    const tokens = log.prompt_tokens + log.completion_tokens;
    const creditCost = Math.ceil(tokens / 1000);  // 每1000 tokens = 1积分

    await prisma.$transaction(async (tx) => {
      // 1. 创建使用记录
      const usageRecord = await tx.usageRecord.create({
        data: {
          apiKeyId: keyId,
          timestamp: new Date(log.created_at * 1000),
          model: log.model_name,
          promptTokens: log.prompt_tokens,
          completionTokens: log.completion_tokens,
          totalTokens: tokens,
          creditCost,
          rawMeta: log,
        },
      });

      // 2. 扣除积分
      await creditService.deductCredit(
        apiKey.userId,
        keyId,
        tokens,
        log.model_name,
        usageRecord.id
      );
    });
  }
}

export default new UsageService();
```

### 4.3 new-api API 端点汇总

根据探索结果，new-api 提供以下关键接口：

| 接口 | 方法 | 说明 | 鉴权 |
|-----|------|-----|-----|
| `/api/token/` | POST | 创建 Token（生成 Key） | 需要管理员 Token |
| `/api/token/:id` | DELETE | 删除 Token | 需要管理员 Token |
| `/api/token/:id` | GET | 获取 Token 详情 | 需要管理员 Token |
| `/api/log/token` | GET | 获取 Token 使用日志 | 公开（带 CORS） |

**配置环境变量**：
```env
# new-api 配置
NEW_API_BASE_URL=http://localhost:3000
NEW_API_ADMIN_TOKEN=your_admin_token_here
```

---

## 五、UI 复刻清单

### 5.1 核心页面复刻要点

#### 5.1.1 登录页
- **参考文件**：`htmlCopy/登录 - MiniMax 开放平台.html`
- **关键特征**：
  - 居中的登录卡片
  - 邮箱输入框 + 验证码输入框
  - "发送验证码"按钮（倒计时60秒）
  - Logo 和标题
  - 底部链接（用户协议、隐私政策）
- **复刻重点**：
  - 验证码输入框样式（6个独立框）
  - 按钮状态（正常、禁用、加载中）
  - 表单验证提示

#### 5.1.2 Coding Plan 套餐页（首页）
- **参考文件**：`htmlCopy/Coding Plan - MiniMax API 平台.html`
- **关键特征**：
  - 顶部 Banner 介绍
  - 套餐卡片网格布局（3-4列）
  - 每个卡片包含：价格、积分、赠送积分、特性列表、订阅按钮
  - 推荐标签（"最受欢迎"等）
  - hover 动效（卡片阴影、缩放）
- **复刻重点**：
  - 卡片样式（边框、阴影、圆角）
  - 价格展示（大号字体）
  - 按钮样式（主色绿色 #24be58）
  - 响应式布局

#### 5.1.3 API Keys 管理页
- **参考文件**：`htmlCopy/接口密钥 - MiniMax 开放平台.html`
- **关键特征**：
  - "创建新密钥"按钮（右上角）
  - Key 列表表格：名称、创建时间、最后使用时间、状态、操作
  - Key 值脱敏显示（sk-****...后4位）
  - 复制按钮（点击复制完整 Key）
  - 删除/禁用按钮
  - 空状态占位符
- **复刻重点**：
  - 表格样式（斑马纹、hover 效果）
  - 操作按钮（图标 + Tooltip）
  - 复制成功提示

#### 5.1.4 使用记录/账单页
- **参考文件**：`htmlCopy/账单记录 - MiniMax 开放平台.html`
- **关键特征**：
  - 顶部统计卡片（总消耗、本月消耗等）
  - 时间范围选择器（日期选择器）
  - 模型筛选下拉框
  - 使用记录表格：时间、模型、tokens、积分消耗
  - 分页控件
  - 导出按钮
- **复刻重点**：
  - 统计卡片布局（横向排列）
  - 表格分页样式
  - 筛选器交互

#### 5.1.5 余额/充值记录页
- **参考文件**：`htmlCopy/余额 - MiniMax 开放平台.html`
- **关键特征**：
  - 当前余额大卡片（醒目展示）
  - "立即充值"按钮
  - 交易记录表格：时间、类型、金额、余额、描述
  - Tab 切换（全部/充值/扣费/退款）
- **复刻重点**：
  - 余额卡片样式（大号字体、绿色强调）
  - 交易类型徽章（不同颜色）
  - Tab 导航样式

#### 5.1.6 文档页（占位）
- **参考文件**：`htmlCopy/快速开始 - MiniMax 开放平台文档中心.html`
- **关键特征**：
  - 左侧文档目录
  - 右侧文档内容区域
  - Markdown 渲染
  - 代码高亮
  - 搜索框
- **复刻重点**：
  - 先实现基础布局和占位内容
  - 后续填充实际文档

### 5.2 通用组件复刻要点

#### 5.2.1 侧边栏（Sidebar）
```
┌────────────────┐
│ LetAiCode Logo │
├────────────────┤
│ 套餐订阅       │  ← 当前页高亮
│ API 密钥       │
│ 使用记录       │
│ 账户信息       │
│ 余额          │
│ 充值记录       │
│ 文档          │
│ 通知          │
├────────────────┤
│ 设置          │
│ 退出          │
└────────────────┘
```
- 图标 + 文字
- 当前路由高亮（绿色背景）
- 折叠/展开按钮
- 响应式（移动端抽屉式）

#### 5.2.2 顶部导航栏（TopHeader）
```
┌──────────────────────────────────────────────────────┐
│ [折叠按钮]  LetAiCode            [搜索框]   [用户头像] │
│                                    余额：10000  [通知] │
└──────────────────────────────────────────────────────┘
```
- Logo 和标题
- 搜索框
- 用户信息下拉菜单（账户信息、设置、退出）
- 余额显示
- 通知图标（红点提示）

#### 5.2.3 套餐卡片（PlanCard）
```
┌─────────────────────────┐
│  ┌───────┐              │
│  │ 推荐  │              │  ← 标签（可选）
│  └───────┘              │
│                         │
│    基础套餐              │  ← 标题
│                         │
│   ¥ 99.00               │  ← 价格（大号）
│                         │
│   100,000 积分          │  ← 基础积分
│   + 10,000 赠送积分     │  ← 赠送积分（绿色）
│                         │
│   • 适合个人开发者      │  ← 特性列表
│   • 无限调用次数        │
│   • 7x24 技术支持       │
│                         │
│   ┌─────────────┐       │
│   │   立即订阅   │       │  ← 按钮
│   └─────────────┘       │
└─────────────────────────┘
```

### 5.3 颜色和主题

根据 HTML 分析，MiniMAXI 使用以下颜色方案：

```css
/* 主色调 */
--primary-color: #24be58;        /* 绿色 - 主要按钮、链接、高亮 */
--primary-hover: #21AF51;        /* 绿色 hover */
--primary-active: #1e9e48;       /* 绿色 active */

/* 文本颜色 */
--text-primary: #262626;         /* 主要文本 */
--text-secondary: rgba(0,0,0,0.65); /* 次要文本 */
--text-tertiary: rgba(0,0,0,0.45);  /* 辅助文本 */
--text-disabled: rgba(0,0,0,0.25);  /* 禁用文本 */

/* 背景颜色 */
--bg-white: #ffffff;             /* 白色背景 */
--bg-gray: #f5f5f5;              /* 浅灰背景 */
--bg-container: #ffffff;         /* 容器背景 */

/* 边框颜色 */
--border-color: #d9d9d9;         /* 默认边框 */
--border-light: #f0f0f0;         /* 浅色边框 */

/* 状态颜色 */
--success: #52c41a;              /* 成功 */
--warning: #faad14;              /* 警告 */
--error: #ff4d4f;                /* 错误 */
--info: #1677ff;                 /* 信息 */

/* 阴影 */
--shadow-1: 0 1px 2px 0 rgba(0,0,0,0.03), 0 1px 6px -1px rgba(0,0,0,0.02);
--shadow-2: 0 6px 16px 0 rgba(0,0,0,0.08), 0 3px 6px -4px rgba(0,0,0,0.12);
```

---

## 六、参考项目复用策略

### 6.1 从 InterviewCodeOverlay3333 复用

#### 6.1.1 邮件发送逻辑
- **源文件**：`InterviewCodeOverlay3333/backend/server-simple.js`
- **复用内容**：
  ```typescript
  // 邮件配置（nodemailer）
  // 验证码生成逻辑（6位数字）
  // 邮件模板
  // Redis 存储验证码（key: verify_email:${email}, ttl: 5分钟）
  ```

#### 6.1.2 登录流程
- **源文件**：`InterviewCodeOverlay3333/backend/server-simple.js`
- **复用内容**：
  ```typescript
  // JWT token 生成和验证
  // Session 管理（Redis 存储，14天有效期）
  // SessionProtection 类（防止并发登录）
  ```

#### 6.1.3 支付集成
- **源文件**：`InterviewCodeOverlay3333/backend/src/routes/recharge.js`
- **复用内容**：
  ```typescript
  // 微信支付 V3 SDK 配置
  // 订单创建逻辑
  // 支付回调处理
  // 二维码生成（支付链接）
  // 订单状态机
  ```

#### 6.1.4 前端登录页面
- **源文件**：`InterviewCodeOverlay3333/web/src/pages/Login`
- **复用内容**：
  ```typescript
  // 邮箱验证码输入组件
  // 倒计时按钮逻辑
  // 表单验证
  ```

### 6.2 从 new-api 获取接口文档

根据探索结果，new-api 提供的接口文档：
- **Token 管理**：创建、删除、查询
- **使用日志**：按 Token 查询使用记录
- **鉴权方式**：JWT Bearer Token（管理员）

**注意事项**：
- new-api 的 `/api/log/token` 接口是公开的（CORS 支持）
- Token 创建需要管理员权限
- 使用记录可能有延迟（取决于 new-api 的日志写入策略）

---

## 七、开发流程和里程碑

### 7.1 开发阶段划分

```
阶段 1：环境搭建和基础架构（3天）
├── 初始化前端项目（Vite + React + TypeScript）
├── 配置 Ant Design 主题
├── 初始化后端项目（Express + TypeScript + Prisma）
├── 配置 Redis 连接
├── 设计并初始化数据库（Prisma migrate）
└── 配置开发环境变量

阶段 2：认证模块（3天）
├── 后端：邮件服务（nodemailer）
├── 后端：验证码生成和验证
├── 后端：JWT 认证中间件
├── 后端：登录/登出接口
├── 前端：登录页面 UI（复刻 MiniMAXI）
├── 前端：邮箱验证码输入组件
└── 前端：Auth 状态管理（Zustand）

阶段 3：Key 管理模块（4天）
├── 后端：new-api 集成服务（createToken, deleteToken）
├── 后端：Key CRUD 接口
├── 前端：Key 管理页面 UI
├── 前端：创建 Key 弹窗
├── 前端：Key 列表表格
├── 前端：复制 Key 功能
└── 联调：Key 创建/删除流程

阶段 4：使用记录和计费模块（5天）
├── 后端：使用记录同步定时任务
├── 后端：积分计算和扣除服务
├── 后端：使用记录查询接口
├── 后端：交易记录接口
├── 前端：使用记录页面 UI
├── 前端：账单表格和筛选器
├── 前端：余额页面 UI
└── 联调：使用记录同步和计费流程

阶段 5：充值和套餐模块（4天）
├── 后端：套餐管理（数据库初始化）
├── 后端：订单创建和管理
├── 后端：微信支付集成（参考 InterviewCodeOverlay3333）
├── 后端：支付回调处理
├── 前端：Coding Plan 套餐页 UI（主页）
├── 前端：套餐卡片组件
├── 前端：充值弹窗和支付二维码
└── 联调：充值流程测试

阶段 6：文档和其他页面（2天）
├── 前端：文档页面占位 UI
├── 前端：账户信息页面 UI
├── 前端：通知页面 UI
└── 前端：设置页面 UI

阶段 7：UI 细节优化和响应式（3天）
├── 前端：移动端适配
├── 前端：动画和过渡效果
├── 前端：加载状态和错误提示
├── 前端：空状态占位符
└── 前端：暗色模式（可选）

阶段 8：测试和部署（3天）
├── 单元测试（核心业务逻辑）
├── 集成测试（API 接口）
├── E2E 测试（关键流程）
├── 性能优化（代码分割、懒加载）
├── 生产环境配置
└── 部署文档
```

### 7.2 关键里程碑

| 里程碑 | 交付物 | 验收标准 | 预计时间 |
|-------|-------|---------|---------|
| M1：环境就绪 | 前后端项目骨架、数据库初始化 | 可启动开发服务器，数据库连接成功 | Day 3 |
| M2：登录可用 | 邮箱登录功能 | 用户可完成注册/登录，获得 JWT token | Day 6 |
| M3：Key 管理完成 | Key 创建/删除/查询 | 用户可在前端创建 Key，Key 在 new-api 中生效 | Day 10 |
| M4：计费系统就绪 | 使用记录同步和扣费 | 定时任务正常拉取 new-api 日志，正确扣除积分 | Day 15 |
| M5：充值流程打通 | 套餐购买和支付 | 用户可购买套餐，支付成功后积分到账 | Day 19 |
| M6：UI 完整 | 所有页面 UI 完成 | 所有页面与 MiniMAXI 高度一致（90%+相似度） | Day 21 |
| M7：优化完成 | 性能优化和响应式 | 移动端可正常使用，页面加载速度 < 2s | Day 24 |
| M8：可交付 | 测试通过、文档完整 | 通过所有测试用例，提供部署文档 | Day 27 |

### 7.3 风险和应对

| 风险 | 可能性 | 影响 | 应对措施 |
|-----|-------|-----|---------|
| new-api 接口文档不完整 | 中 | 高 | 提前联调测试，必要时查看源代码 |
| 微信支付配置困难 | 低 | 中 | 参考 InterviewCodeOverlay3333 完整实现 |
| UI 复刻进度慢 | 中 | 中 | 使用 htmlCopy 资源，分阶段交付 |
| 使用记录同步延迟 | 低 | 中 | 增加手动同步按钮，缩短定时任务间隔 |
| 前端性能问题 | 低 | 低 | 代码分割、懒加载、虚拟滚动 |

---

## 八、配置清单

### 8.1 前端环境变量（.env）
```env
# API 基础 URL
VITE_API_BASE_URL=http://localhost:4000/api

# 应用配置
VITE_APP_NAME=LetAiCode
VITE_APP_LOGO_URL=/logo.png

# 第三方服务
VITE_SENTRY_DSN=  # 错误监控（可选）
```

### 8.2 后端环境变量（.env）
```env
# 服务配置
NODE_ENV=development
PORT=4000
HOST=0.0.0.0

# 数据库
DATABASE_URL="file:./dev.db"  # SQLite（开发）
# DATABASE_URL="postgresql://user:password@localhost:5432/letaicode"  # PostgreSQL（生产）

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_SECRET=your_jwt_secret_here_min_32_chars
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=14d

# 邮件配置（nodemailer）
EMAIL_HOST=smtp.example.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=noreply@letaicode.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=LetAiCode <noreply@letaicode.com>

# new-api 配置
NEW_API_BASE_URL=http://localhost:3000
NEW_API_ADMIN_TOKEN=your_new_api_admin_token

# 微信支付配置
WECHAT_PAY_APP_ID=your_app_id
WECHAT_PAY_MCH_ID=your_mch_id
WECHAT_PAY_API_KEY=your_api_key
WECHAT_PAY_CERT_PATH=./certs/apiclient_cert.pem
WECHAT_PAY_KEY_PATH=./certs/apiclient_key.pem
WECHAT_PAY_NOTIFY_URL=https://yourdomain.com/api/payments/notify/wechat

# 积分配置
CREDIT_TOKEN_RATIO=1  # 每1000 tokens = 1 积分
CREDIT_FREE_QUOTA=10000  # 新用户免费额度

# 日志
LOG_LEVEL=info  # debug | info | warn | error
```

---

## 九、技术细节和最佳实践

### 9.1 安全性

1. **密码存储**：使用 bcrypt 加密（salt rounds = 10）
2. **API Key 存储**：使用 AES-256 加密完整 Key
3. **JWT Token**：
   - 短期 access token（7天）
   - 长期 refresh token（14天，存储在 HttpOnly Cookie）
4. **SQL 注入防护**：使用 Prisma 参数化查询
5. **XSS 防护**：React 默认转义，后端使用 helmet 中间件
6. **CSRF 防护**：使用 csurf 中间件
7. **Rate Limiting**：使用 express-rate-limit 限制登录和验证码发送频率

### 9.2 性能优化

1. **前端**：
   - 代码分割（React.lazy + Suspense）
   - 路由懒加载
   - 图片懒加载
   - 虚拟滚动（大列表使用 react-window）
   - CDN 加速静态资源

2. **后端**：
   - Redis 缓存（用户信息、套餐列表）
   - 数据库索引（userId、apiKeyId、timestamp）
   - 连接池（Prisma 默认）
   - 分页查询（避免全表扫描）

3. **网络**：
   - HTTP/2
   - Gzip 压缩
   - 静态资源缓存策略

### 9.3 监控和日志

1. **日志框架**：Winston（后端）
2. **错误监控**：Sentry（可选）
3. **性能监控**：
   - 前端：Web Vitals（LCP、FID、CLS）
   - 后端：响应时间、错误率
4. **日志级别**：
   - `debug`：详细调试信息
   - `info`：正常业务日志
   - `warn`：警告信息
   - `error`：错误信息

### 9.4 测试策略

1. **单元测试**：
   - 后端：Jest + Supertest（服务层、工具函数）
   - 前端：Vitest + React Testing Library（组件、Hooks）

2. **集成测试**：
   - API 接口测试（Postman/Newman）
   - 数据库集成测试

3. **E2E 测试**：
   - Playwright/Cypress（关键业务流程）

---

## 十、部署方案

### 10.1 开发环境
```bash
# 前端
cd frontend
pnpm install
pnpm dev  # http://localhost:5173

# 后端
cd backend
pnpm install
pnpm prisma generate
pnpm prisma migrate dev
pnpm dev  # http://localhost:4000
```

### 10.2 生产环境

**方案 A：传统部署（服务器）**
```
┌─────────────────────────────────────────┐
│             Nginx (反向代理)              │
│   ┌───────────────┬──────────────────┐  │
│   │ Frontend      │ Backend          │  │
│   │ (静态文件)     │ (Node.js)        │  │
│   │ :80/:443      │ :4000            │  │
│   └───────────────┴──────────────────┘  │
│                                         │
│   ┌───────────────┬──────────────────┐  │
│   │ PostgreSQL    │ Redis            │  │
│   │ :5432         │ :6379            │  │
│   └───────────────┴──────────────────┘  │
└─────────────────────────────────────────┘
```

**方案 B：Docker Compose**
```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/letaicode
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: letaicode
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

**方案 C：云服务（推荐）**
- **前端**：Vercel / Netlify（自动部署、CDN）
- **后端**：Railway / Render / Fly.io（容器化部署）
- **数据库**：Supabase（PostgreSQL）/ Railway
- **Redis**：Upstash（Serverless Redis）

---

## 十一、交付清单

### 11.1 代码交付物
```
✅ 前端源代码（frontend/）
✅ 后端源代码（backend/）
✅ 数据库迁移文件（prisma/migrations/）
✅ Docker 配置（Dockerfile、docker-compose.yml）
✅ 环境变量示例（.env.example）
```

### 11.2 文档交付物
```
✅ 本开发方案文档（DETAILED_DEVELOPMENT_PLAN.md）
✅ API 接口文档（基于本文档第三章）
✅ 数据库设计文档（基于本文档 Prisma Schema）
✅ 部署文档（DEPLOYMENT.md）
✅ 开发者指南（DEVELOPER_GUIDE.md）
✅ 用户手册（USER_MANUAL.md）
```

### 11.3 测试交付物
```
✅ 单元测试代码
✅ 集成测试代码
✅ E2E 测试代码
✅ 测试覆盖率报告
```

---

## 十二、后续扩展建议

### 12.1 功能扩展
- **团队协作**：多用户协作、角色权限管理
- **API 调用监控**：实时调用统计图表、告警
- **模型切换**：支持多种 AI 模型选择
- **Webhook**：API 调用完成后回调用户服务器
- **API 限流**：按 Key 设置调用频率限制
- **成本分析**：可视化积分消耗趋势
- **发票管理**：自动开具发票

### 12.2 技术优化
- **微服务拆分**：计费服务、通知服务独立部署
- **消息队列**：RabbitMQ/Kafka 处理异步任务
- **搜索引擎**：Elasticsearch 实现日志全文搜索
- **数据分析**：ClickHouse 存储大量使用记录
- **负载均衡**：多实例部署 + Nginx 负载均衡

---

## 附录：参考资料

### A. 技术文档链接
- **React 官方文档**：https://react.dev
- **Ant Design 文档**：https://ant.design
- **Prisma 文档**：https://www.prisma.io/docs
- **Express 文档**：https://expressjs.com
- **JWT 最佳实践**：https://jwt.io/introduction

### B. 项目依赖版本
```json
// frontend/package.json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "antd": "^5.12.0",
    "axios": "^1.6.0",
    "zustand": "^4.4.0",
    "@ant-design/icons": "^5.2.0",
    "dayjs": "^1.11.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0"
  }
}

// backend/package.json
{
  "dependencies": {
    "express": "^4.18.0",
    "@prisma/client": "^5.7.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "nodemailer": "^6.9.8",
    "ioredis": "^5.3.0",
    "axios": "^1.6.0",
    "wechatpay-node-v3": "^2.2.1",
    "node-cron": "^3.0.3",
    "winston": "^3.11.0",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "express-rate-limit": "^7.1.0",
    "dotenv": "^16.3.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/node": "^20.10.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/nodemailer": "^6.4.14",
    "prisma": "^5.7.0",
    "typescript": "^5.3.0",
    "ts-node": "^10.9.0",
    "nodemon": "^3.0.0",
    "jest": "^29.7.0",
    "supertest": "^6.3.0"
  }
}
```

---

**文档版本**：v1.0
**最后更新**：2024年12月14日
**作者**：Claude (Anthropic)
**审核状态**：待用户审核

---

**注意事项**：
1. 本方案基于对 MiniMAXI 平台的静态 HTML 分析，实际 UI 复刻需以 `htmlCopy/` 目录中的文件为准。
2. 所有 API 端点、数据模型和业务逻辑均为建议性方案，实施时可根据实际需求调整。
3. 安全性配置（JWT_SECRET、数据库密码等）必须使用强密码，不得使用示例值。
4. 微信支付配置需要商户资质，具体流程参考微信支付官方文档。
5. new-api 的具体接口细节需在联调阶段确认，本方案基于已知信息推断。
