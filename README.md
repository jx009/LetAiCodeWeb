# LetAiCode - AI 编程助手平台

> 完全复刻 MiniMAXI 平台界面的 AI 编程助手服务，提供邮箱登录、积分扣费、Key管理、文档、充值套餐等完整功能。

## 📦 项目结构

```
LetAiCodeWeb/
├── frontend/              # 前端项目（Vite + React + TypeScript）
│   ├── src/
│   │   ├── api/          # API 请求封装
│   │   ├── components/   # 通用组件
│   │   ├── pages/        # 页面组件
│   │   ├── hooks/        # 自定义 Hooks
│   │   ├── store/        # 状态管理（Zustand）
│   │   ├── styles/       # 全局样式和主题
│   │   ├── types/        # TypeScript 类型
│   │   └── utils/        # 工具函数
│   └── package.json
├── backend/               # 后端项目（Node.js + Express + TypeScript）
│   ├── src/
│   │   ├── controllers/  # 控制器
│   │   ├── services/     # 服务层
│   │   ├── middlewares/  # 中间件
│   │   ├── routes/       # 路由
│   │   ├── config/       # 配置文件
│   │   ├── utils/        # 工具函数
│   │   └── types/        # TypeScript 类型
│   ├── prisma/           # Prisma 数据库
│   │   ├── schema.prisma # 数据模型
│   │   └── seed.ts       # 数据填充
│   └── package.json
├── htmlCopy/              # MiniMAXI 界面参考（已有）
├── DEV_PLAN.md            # 简要开发方案
├── DETAILED_DEVELOPMENT_PLAN.md  # 详细开发方案（1000+行）
└── README.md              # 本文档
```

## 🚀 快速开始

### 前置要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0（推荐） 或 npm/yarn
- Redis >= 6.0
- SQLite（开发环境）或 PostgreSQL（生产环境）

### 1. 克隆项目

```bash
cd C:\jxProject\LetAiCodeWeb
```

### 2. 安装依赖

#### 前端

```bash
cd frontend
pnpm install
# 或
npm install
```

#### 后端

```bash
cd backend
pnpm install
# 或
npm install
```

### 3. 配置环境变量

#### 前端配置

在 `frontend/` 目录下创建 `.env` 文件：

```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_APP_NAME=LetAiCode
VITE_APP_LOGO_URL=/logo.png
```

#### 后端配置

在 `backend/` 目录下创建 `.env` 文件（参考 `.env.example`）：

```env
# 服务配置
NODE_ENV=development
PORT=4000
HOST=0.0.0.0

# 数据库（开发环境使用 SQLite）
DATABASE_URL="file:./dev.db"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_SECRET=your_secret_key_change_in_production_min_32_chars
JWT_EXPIRES_IN=7d

# 邮件配置（需要配置真实的 SMTP）
EMAIL_HOST=smtp.example.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=noreply@letaicode.com
EMAIL_PASSWORD=your_password
EMAIL_FROM=LetAiCode <noreply@letaicode.com>

# new-api 配置
NEW_API_BASE_URL=http://localhost:3000
NEW_API_ADMIN_TOKEN=your_admin_token

# 积分配置
CREDIT_TOKEN_RATIO=1
CREDIT_FREE_QUOTA=10000

# AES 加密密钥
AES_SECRET_KEY=your_aes_key_32_chars_long_change_this
```

### 4. 初始化数据库

```bash
cd backend

# 生成 Prisma Client
pnpm prisma:generate

# 运行数据库迁移
pnpm prisma:migrate

# 填充初始数据（套餐计划等）
pnpm prisma:seed

# 打开 Prisma Studio 查看数据库（可选）
pnpm prisma:studio
```

### 5. 启动开发服务器

#### 启动后端

```bash
cd backend
pnpm dev
# 后端将在 http://localhost:4000 运行
```

#### 启动前端

```bash
cd frontend
pnpm dev
# 前端将在 http://localhost:5173 运行
```

### 6. 访问应用

打开浏览器访问：http://localhost:5173

## 📖 项目特性

### ✅ 已完成

- ✅ **完整的项目架构搭建**
  - 前端：Vite + React 18 + TypeScript + Ant Design 5.x
  - 后端：Node.js + Express + TypeScript + Prisma
  - 数据库：完整的 Prisma Schema（10+ 数据模型）

- ✅ **Ant Design 主题定制**
  - 完全复刻 MiniMAXI 的主题色（#24be58 绿色）
  - 自定义 CSS 变量系统
  - 响应式设计

- ✅ **前端核心组件**
  - AppLayout（主布局）
  - Sidebar（侧边栏导航）
  - TopHeader（顶部导航栏）
  - 状态管理（Zustand）
  - API 请求封装（Axios）

- ✅ **后端基础服务**
  - JWT 认证工具
  - 密码加密（bcrypt）
  - AES 加密（用于 API Key）
  - Redis 缓存封装
  - Winston 日志系统
  - Prisma ORM 配置

- ✅ **数据库设计**
  - 用户表（User）
  - 邮箱验证码表（EmailCode）
  - API Key 表（ApiKey）
  - 使用记录表（UsageRecord）
  - 积分交易表（CreditTransaction）
  - 套餐计划表（PackagePlan）
  - 支付订单表（PaymentOrder）
  - 会话表（Session）
  - 配置表（Config）

### 🚧 待实现（按开发方案进行）

- 🚧 **认证模块**（阶段 2）
  - 邮箱验证码登录
  - JWT 认证中间件
  - 会话管理

- 🚧 **Key 管理模块**（阶段 3）
  - 与 new-api 集成
  - Key 创建/删除/查询
  - 使用统计

- 🚧 **使用记录和计费模块**（阶段 4）
  - 定时同步 new-api 使用记录
  - 积分计算和扣除
  - 账单查询

- 🚧 **充值和套餐模块**（阶段 5）
  - 套餐展示
  - 订单创建
  - 微信支付集成

- 🚧 **UI 完整复刻**（阶段 6-7）
  - 登录页
  - Coding Plan 套餐页
  - API Keys 管理页
  - 使用记录页
  - 账户信息页
  - 余额页
  - 充值记录页
  - 文档页

## 🎨 UI 设计规范

本项目完全复刻 MiniMAXI 平台的界面设计：

- **主题色**：#24be58（绿色）
- **字体**：-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto...
- **组件库**：Ant Design 5.x
- **布局**：侧边栏 + 顶部导航 + 内容区
- **参考资源**：`htmlCopy/` 目录中的 HTML 文件

## 🔧 开发指南

### 添加新页面

1. 在 `frontend/src/pages/` 创建新页面目录
2. 在 `frontend/src/App.tsx` 添加路由
3. 在 `frontend/src/components/Layout/Sidebar.tsx` 添加菜单项

### 添加新 API

1. 在 `backend/src/routes/` 创建路由文件
2. 在 `backend/src/controllers/` 创建控制器
3. 在 `backend/src/services/` 创建服务
4. 在 `backend/src/app.ts` 注册路由
5. 在 `frontend/src/api/` 创建 API 请求函数

### 数据库迁移

```bash
cd backend

# 修改 prisma/schema.prisma 后执行：
pnpm prisma:migrate

# 重新生成 Prisma Client
pnpm prisma:generate
```

## 📚 相关文档

- [详细开发方案](./DETAILED_DEVELOPMENT_PLAN.md) - 1000+ 行完整开发指南
- [简要开发方案](./DEV_PLAN.md) - 快速概览
- [Ant Design 文档](https://ant.design)
- [Prisma 文档](https://www.prisma.io/docs)
- [Vite 文档](https://vitejs.dev)

## 🤝 贡献

本项目遵循以下开发流程：

1. 按照 `DETAILED_DEVELOPMENT_PLAN.md` 中的 8 个阶段逐步开发
2. 前端界面必须完全 1:1 复刻 MiniMAXI（除品牌名称）
3. 所有 API 接口遵循 RESTful 规范
4. 代码提交前运行 ESLint 和 Prettier

## 📄 许可证

MIT

## 🙏 致谢

- UI 设计参考：[MiniMAXI 平台](https://platform.minimaxi.com)
- 登录/支付逻辑参考：`C:\jxProject\InterviewCodeOverlay3333`
- 模型中转服务：`C:\jxProject\new-api`

---

**当前进度**：阶段 1 完成（环境搭建和基础架构）✅

**下一步**：开始阶段 2 - 认证模块开发
"# LetAiCodeWeb" 
