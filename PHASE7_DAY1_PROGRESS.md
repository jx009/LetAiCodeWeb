# 阶段 7 - 第 1 天进度报告

> 日期：2024年12月14日
> 任务：权限系统 + 配置管理 API + 用户管理 API

---

## ✅ 今日完成任务

### 1. 用户角色系统设计

**数据模型更新** - `backend/prisma/schema.prisma`

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  role      UserRole @default(USER)  // ✅ 新增：用户角色
  status    Int      @default(1)      // ✅ 新增：状态（1=启用 0=禁用）
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  // ...
}

enum UserRole {
  USER  // 普通用户
  ADMIN // 管理员
  ROOT  // 超级管理员
}
```

**系统配置表** - `Option` 表

```prisma
model Option {
  key       String   @id  // 配置键（主键）
  value     String       // 配置值（支持 JSON）
  desc      String?      // 配置描述
  updatedAt DateTime @updatedAt
}
```

---

### 2. 权限验证中间件

**文件**：`backend/src/middlewares/role.middleware.ts`

**功能**：
- ✅ `adminAuth()` - 管理员权限验证（role >= ADMIN）
- ✅ `rootAuth()` - 超级管理员权限验证（role = ROOT）
- ✅ `statusCheck()` - 用户状态检查（status = 1）

**权限层级**：
```
ROOT (超级管理员)
  ├─ 可以做所有事情
  ├─ 修改系统配置
  ├─ 提升/降级用户角色
  └─ 管理所有用户

ADMIN (管理员)
  ├─ 查看所有用户
  ├─ 禁用/启用普通用户
  └─ 不能修改管理员和超级管理员

USER (普通用户)
  └─ 只能管理自己的资源
```

---

### 3. 配置管理系统

#### 3.1 配置服务 - `backend/src/services/option.service.ts`

**核心功能**：
- ✅ 内存缓存（提高性能）
- ✅ 获取单个/所有配置
- ✅ 更新配置（单个/批量）
- ✅ 删除配置
- ✅ 敏感信息脱敏（Secret/Token/Key 后缀）
- ✅ 支付配置专用接口

**使用示例**：
```typescript
// 获取配置
const payAddress = await optionService.getOption('PayAddress');

// 更新配置
await optionService.updateOption('MinTopUp', '10', '最小充值金额');

// 获取支付配置
const paymentConfig = await optionService.getPaymentConfig();
// {
//   payAddress: 'https://epay.example.com',
//   epayId: 'merchant_id',
//   epayKey: '***',
//   minTopUp: 1,
//   payMethods: [...]
// }
```

#### 3.2 配置控制器 - `backend/src/controllers/option.controller.ts`

**API 端点**：
```
GET    /api/options              获取所有配置（脱敏）
GET    /api/options/:key         获取单个配置
PUT    /api/options/:key         更新单个配置
PUT    /api/options              批量更新配置
DELETE /api/options/:key         删除配置

GET    /api/options/payment/config     获取支付配置
PUT    /api/options/payment/config     更新支付配置
GET    /api/options/payment/validate   验证支付配置
```

**权限要求**：所有端点需要 **超级管理员权限**（ROOT）

---

### 4. 用户管理系统

#### 4.1 用户管理服务 - `backend/src/services/admin.service.ts`

**核心功能**：
- ✅ 获取用户列表（分页、搜索、筛选）
- ✅ 获取用户详情
- ✅ 更新用户信息
- ✅ 启用/禁用用户
- ✅ 提升用户为管理员
- ✅ 降级管理员为普通用户
- ✅ 删除用户
- ✅ 获取用户统计信息

**权限检查逻辑**：
```typescript
// 1. 不能操作同级或更高级别的用户（除非是超级管理员）
if (adminRole !== UserRole.ROOT && targetRole >= adminRole) {
  throw new Error('无权修改');
}

// 2. 不能禁用/删除超级管理员
if (targetRole === UserRole.ROOT && (action === 'disable' || action === 'delete')) {
  throw new Error('不能操作超级管理员');
}

// 3. 只有超级管理员可以提升/降级角色
if (action === 'promote' || action === 'demote') {
  if (adminRole !== UserRole.ROOT) {
    throw new Error('只有超级管理员可以修改角色');
  }
}
```

#### 4.2 用户管理控制器 - `backend/src/controllers/admin.controller.ts`

**API 端点**：
```
GET    /api/admin/users               获取用户列表
GET    /api/admin/users/stats         获取用户统计
GET    /api/admin/users/:id           获取用户详情
PUT    /api/admin/users/:id           更新用户信息
PATCH  /api/admin/users/:id/status    启用/禁用用户
POST   /api/admin/users/:id/promote   提升为管理员
POST   /api/admin/users/:id/demote    降级为普通用户
DELETE /api/admin/users/:id           删除用户
```

**权限要求**：
- 所有端点需要 **管理员权限**（ADMIN 或 ROOT）
- 提升/降级角色需要 **超级管理员权限**（ROOT）

---

### 5. 路由配置

#### 5.1 配置路由 - `backend/src/routes/option.routes.ts`
- ✅ 注册所有配置管理端点
- ✅ 应用超级管理员权限中间件

#### 5.2 管理员路由 - `backend/src/routes/admin.routes.ts`
- ✅ 注册所有用户管理端点
- ✅ 应用管理员权限中间件

#### 5.3 主路由更新 - `backend/src/routes/index.ts`
```typescript
router.use('/options', optionRoutes);  // 配置管理
router.use('/admin', adminRoutes);     // 用户管理
```

---

### 6. 前端类型定义更新

**文件**：`frontend/src/types/index.ts`

```typescript
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  ROOT = 'ROOT',
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;          // ✅ 新增
  status: number;          // ✅ 新增
  createdAt: string;
  balance?: number;
}
```

---

## 📋 API 端点汇总

### 配置管理 API（需要 ROOT 权限）

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/options` | 获取所有配置 |
| GET | `/api/options/:key` | 获取单个配置 |
| PUT | `/api/options/:key` | 更新单个配置 |
| PUT | `/api/options` | 批量更新配置 |
| DELETE | `/api/options/:key` | 删除配置 |
| GET | `/api/options/payment/config` | 获取支付配置 |
| PUT | `/api/options/payment/config` | 更新支付配置 |
| GET | `/api/options/payment/validate` | 验证支付配置 |

### 用户管理 API（需要 ADMIN 或 ROOT 权限）

| 方法 | 端点 | 说明 | 特殊权限 |
|------|------|------|----------|
| GET | `/api/admin/users` | 获取用户列表 | - |
| GET | `/api/admin/users/stats` | 获取用户统计 | - |
| GET | `/api/admin/users/:id` | 获取用户详情 | - |
| PUT | `/api/admin/users/:id` | 更新用户信息 | - |
| PATCH | `/api/admin/users/:id/status` | 启用/禁用用户 | - |
| POST | `/api/admin/users/:id/promote` | 提升为管理员 | 需要 ROOT |
| POST | `/api/admin/users/:id/demote` | 降级为普通用户 | 需要 ROOT |
| DELETE | `/api/admin/users/:id` | 删除用户 | - |

---

## 📊 文件清单

### 后端新增文件（7个）

```
backend/src/
├── middlewares/
│   └── role.middleware.ts         # 权限验证中间件
├── services/
│   ├── option.service.ts          # 配置管理服务
│   └── admin.service.ts           # 用户管理服务
├── controllers/
│   ├── option.controller.ts       # 配置管理控制器
│   └── admin.controller.ts        # 用户管理控制器
└── routes/
    ├── option.routes.ts           # 配置路由
    └── admin.routes.ts            # 管理员路由
```

### 数据库迁移文件（1个）

```
backend/prisma/migrations/
└── 20241214210600_add_user_roles_and_options/
    └── migration.sql              # 添加角色和配置表
```

### 前端更新文件（1个）

```
frontend/src/
└── types/
    └── index.ts                   # 添加 UserRole 枚举
```

**总计**：9个文件

---

## 🧪 测试指南

### 1. 测试权限系统

**前置条件**：
1. 在数据库中手动将一个用户的 role 设置为 'ROOT'
2. 使用该用户登录获取 token

```sql
-- SQLite
UPDATE users SET role = 'ROOT' WHERE email = 'admin@example.com';
```

**测试步骤**：

```bash
# 设置 token
export TOKEN="your_access_token_here"

# 1. 测试获取所有配置（需要 ROOT 权限）
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/options

# 2. 测试更新配置
curl -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value":"1","desc":"最小充值金额"}' \
  http://localhost:4000/api/options/MinTopUp

# 3. 测试获取用户列表（需要 ADMIN 权限）
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/admin/users

# 4. 测试用户统计
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/admin/users/stats
```

**预期响应**：

```json
// GET /api/options
{
  "success": true,
  "data": {
    "PayAddress": "",
    "EpayId": "",
    "EpayKey": "***",  // 敏感信息脱敏
    "MinTopUp": "1",
    "PayMethods": "[]"
  }
}

// GET /api/admin/users
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "...",
        "email": "user@example.com",
        "name": null,
        "role": "USER",
        "status": 1,
        "createdAt": "2024-12-14T...",
        "_count": {
          "apiKeys": 2,
          "creditTransactions": 5
        }
      }
    ],
    "pagination": {
      "total": 10,
      "page": 1,
      "pageSize": 20,
      "totalPages": 1
    }
  }
}

// GET /api/admin/users/stats
{
  "success": true,
  "data": {
    "total": 10,
    "activeUsers": 8,
    "admins": 1,
    "rootUsers": 1,
    "recentUsers": 3
  }
}
```

### 2. 测试权限拒绝

```bash
# 使用普通用户 token 访问管理员接口
curl -H "Authorization: Bearer $NORMAL_USER_TOKEN" \
  http://localhost:4000/api/admin/users
```

**预期响应**：
```json
{
  "success": false,
  "message": "权限不足：需要管理员权限"
}
```

---

## 💡 关键实现细节

### 1. 配置缓存机制

```typescript
class OptionService {
  private optionCache: Map<string, string> = new Map();

  // 启动时从数据库加载到内存
  async initCache() {
    const options = await prisma.option.findMany();
    for (const option of options) {
      this.optionCache.set(option.key, option.value);
    }
  }

  // 读取时直接从内存获取（O(1)）
  async getOption(key: string) {
    return this.optionCache.get(key) || null;
  }

  // 更新时同时更新数据库和缓存
  async updateOption(key: string, value: string) {
    await prisma.option.upsert({...});
    this.optionCache.set(key, value);
  }
}
```

**优势**：
- 提高读取性能（不用每次查数据库）
- 减少数据库压力
- 支持热更新（无需重启服务）

### 2. 权限检查的层次设计

```
请求 → authMiddleware → adminAuth/rootAuth → Controller → Service
         ↓                ↓
      验证 token      验证角色权限
```

**多层防护**：
1. authMiddleware：验证 token 有效性
2. adminAuth/rootAuth：验证角色权限
3. Service 层：二次权限检查（针对特定操作）

### 3. 敏感信息保护

```typescript
// 自动脱敏以 Secret/Token/Key 结尾的配置
if (key.endsWith('Secret') || key.endsWith('Token') || key.endsWith('Key')) {
  result[key] = '***';
}
```

**保护的配置**：
- EpayKey（支付密钥）
- StripeApiSecret（Stripe 密钥）
- 其他敏感token

---

## ⚠️ 注意事项

### 1. 初次使用

**创建超级管理员**：
```sql
-- 方法1：直接在数据库中修改
UPDATE users SET role = 'ROOT' WHERE email = 'your_email@example.com';

-- 方法2：通过注册后修改（推荐）
-- 1. 正常注册一个账号
-- 2. 在数据库中修改该用户的 role 为 'ROOT'
```

### 2. 权限说明

**不能做的事情**：
- ❌ 普通管理员不能提升/降级用户角色
- ❌ 普通管理员不能操作其他管理员
- ❌ 任何人都不能禁用/删除超级管理员
- ❌ 不能删除自己的账户

**可以做的事情**：
- ✅ 超级管理员可以做任何事情
- ✅ 普通管理员可以管理普通用户
- ✅ 超级管理员可以修改系统配置

### 3. 数据库迁移

**手动应用迁移**（如果自动迁移失败）：
```bash
cd backend
sqlite3 prisma/dev.db < prisma/migrations/20241214210600_add_user_roles_and_options/migration.sql
```

---

## 🎯 今日成果总结

### 已完成 ✅

1. ✅ 用户角色系统设计（USER/ADMIN/ROOT）
2. ✅ 权限验证中间件（adminAuth, rootAuth）
3. ✅ 系统配置管理（Option 表 + 服务 + API）
4. ✅ 用户管理功能（完整的 CRUD + 角色管理）
5. ✅ 路由配置和注册
6. ✅ 前端类型定义更新
7. ✅ 8个新API端点（配置管理）
8. ✅ 8个新API端点（用户管理）

### 技术亮点 🌟

1. **权限系统**：三层权限设计（USER/ADMIN/ROOT）
2. **配置缓存**：内存缓存提高性能
3. **敏感信息保护**：自动脱敏机制
4. **权限检查**：多层防护确保安全
5. **灵活的角色管理**：支持提升/降级

---

## 📅 明日计划（第 2 天）

### 任务：订单和支付功能

1. **订单管理**：
   - 创建订单 API
   - 订单查询 API
   - 订单状态管理

2. **易支付集成**：
   - 易支付客户端封装
   - 生成支付链接
   - 支付回调处理
   - 订单完成流程

3. **充值页面（前端）**：
   - 充值页面 UI
   - 支付弹窗
   - 支付状态轮询

**预计产出**：
- 后端文件：约 6-8 个
- 前端文件：约 4-5 个
- API 端点：约 6-8 个

---

## 📊 阶段 7 总体进度

```
第 1 天（今天）：权限系统 + 配置管理 + 用户管理  ✅ 100%
第 2 天（明天）：订单管理 + 支付集成 + 充值页面  ⏳ 0%
第 3 天（后天）：管理员前端页面 + 测试优化      ⏳ 0%
```

**当前完成度**：约 33%

---

**日期**：2024年12月14日
**作者**：Claude (Anthropic)
**状态**：✅ 第 1 天任务已完成
