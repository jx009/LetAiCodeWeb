# 🎉 阶段 5 完成：使用记录和计费模块开发

## ✅ 已完成功能

### 后端 API

1. **积分管理服务** (`backend/src/services/credit.service.ts`)
   - ✅ 扣除积分（API 调用）
   - ✅ 充值积分
   - ✅ 退款积分
   - ✅ 管理员调整积分
   - ✅ 获取当前余额
   - ✅ 获取交易记录（带分页）
   - ✅ 获取统计信息
   - ✅ 事务安全保证

2. **使用记录同步服务** (`backend/src/services/usage.service.ts`)
   - ✅ 定时同步任务（每5分钟）
   - ✅ 从 new-api 拉取使用记录
   - ✅ 自动计算积分消耗
   - ✅ 自动扣除积分
   - ✅ 手动触发同步
   - ✅ 获取使用记录（带分页）
   - ✅ 获取使用统计（按模型分组）
   - ✅ 防止重复同步

3. **使用记录控制器** (`backend/src/controllers/usage.controller.ts`)
   - ✅ GET `/api/usage` - 获取使用记录列表
   - ✅ GET `/api/usage/statistics` - 获取使用统计
   - ✅ POST `/api/usage/sync` - 手动触发同步

4. **交易记录控制器** (`backend/src/controllers/transaction.controller.ts`)
   - ✅ GET `/api/transactions` - 获取交易记录列表
   - ✅ GET `/api/transactions/balance` - 获取当前余额
   - ✅ GET `/api/transactions/statistics` - 获取统计信息

5. **路由配置**
   - ✅ `backend/src/routes/usage.routes.ts` - 使用记录路由
   - ✅ `backend/src/routes/transaction.routes.ts` - 交易记录路由
   - ✅ 注册到主路由

6. **定时任务**
   - ✅ 服务器启动时自动初始化
   - ✅ 每5分钟自动同步使用记录
   - ✅ 优雅关闭时停止定时任务

### 前端 API

1. **API 请求封装** (`frontend/src/api/usage.ts`)
   - ✅ 获取使用记录列表
   - ✅ 获取使用统计
   - ✅ 手动触发同步
   - ✅ 获取交易记录列表
   - ✅ 获取当前余额
   - ✅ 获取积分统计信息

---

## 📋 API 端点列表

### 使用记录相关

```bash
# 获取使用记录列表
GET /api/usage
Query: keyId, startDate, endDate, model, page, pageSize
Auth: Required

# 获取使用统计（按模型分组）
GET /api/usage/statistics
Query: startDate, endDate
Auth: Required

# 手动触发同步
POST /api/usage/sync
Auth: Required
```

### 交易记录相关

```bash
# 获取交易记录列表
GET /api/transactions
Query: type, startDate, endDate, page, pageSize
Auth: Required

# 获取当前余额
GET /api/transactions/balance
Auth: Required

# 获取统计信息
GET /api/transactions/statistics
Query: startDate, endDate
Auth: Required
```

---

## 🔄 使用记录同步流程

```
定时任务（每5分钟）
  ↓
查询所有激活的 API Keys
  ↓
遍历每个 Key
  ↓
获取最后同步时间
  ↓
调用 new-api 获取新的使用记录
  ↓
处理每条记录：
  1. 检查是否已存在（防重复）
  2. 创建使用记录
  3. 计算积分消耗（每1000 tokens = 1积分）
  4. 扣除用户积分
  ↓
更新 Key 最后使用时间
```

---

## 💡 关键实现

### 1. 积分扣除（事务安全）

```typescript
async deductCredit(params: DeductCreditParams): Promise<void> {
  const { userId, apiKeyId, tokens, model, usageRecordId } = params;
  const creditCost = Math.ceil((tokens / 1000) * this.TOKEN_TO_CREDIT_RATIO);

  await prisma.$transaction(async (tx) => {
    // 1. 获取当前余额
    const currentBalance = await this.getBalance(userId, tx);

    // 2. 检查余额是否足够
    if (currentBalance < creditCost) {
      throw new Error('积分余额不足');
    }

    // 3. 创建扣费记录
    await tx.creditTransaction.create({
      data: {
        userId,
        type: TransactionType.DEDUCT,
        amount: -creditCost,
        balance: currentBalance - creditCost,
        ref: usageRecordId,
        desc: `API 调用扣费（${model}，${tokens} tokens）`,
      },
    });
  });
}
```

### 2. 使用记录同步（定时任务）

```typescript
initSyncScheduler() {
  this.syncScheduler = cron.schedule('*/5 * * * *', async () => {
    console.log('[Usage Sync] Starting sync...');
    try {
      await this.syncAllKeys();
      console.log('[Usage Sync] Sync completed');
    } catch (error) {
      console.error('[Usage Sync] Sync failed:', error);
    }
  });
}

async syncKeyUsage(keyId: string, remoteKeyId: number) {
  // 1. 获取最后同步时间
  const lastRecord = await prisma.usageRecord.findFirst({
    where: { apiKeyId: keyId },
    orderBy: { timestamp: 'desc' },
  });

  const startTime = lastRecord ? lastRecord.timestamp : new Date(0);

  // 2. 从 new-api 拉取新记录
  const logs = await newApiService.getTokenUsage(remoteKeyId, startTime);

  // 3. 处理每条记录
  for (const log of logs) {
    await this.processUsageLog(keyId, log);
  }
}
```

### 3. 防止重复同步

```typescript
async processUsageLog(keyId: string, log: any) {
  await prisma.$transaction(async (tx) => {
    // 检查是否已存在（防止重复）
    const existing = await tx.usageRecord.findFirst({
      where: {
        apiKeyId: keyId,
        timestamp: new Date(log.created_at * 1000),
        model: log.model_name || 'unknown',
        totalTokens,
      },
    });

    if (existing) {
      console.log(`[Usage Sync] Record already exists, skipping`);
      return;
    }

    // 创建记录并扣费...
  });
}
```

---

## 📂 文件结构

### 后端新增文件

```
backend/src/
├── services/
│   ├── credit.service.ts        # 积分管理服务
│   └── usage.service.ts          # 使用记录同步服务
├── controllers/
│   ├── usage.controller.ts       # 使用记录控制器
│   └── transaction.controller.ts # 交易记录控制器
├── routes/
│   ├── usage.routes.ts           # 使用记录路由
│   ├── transaction.routes.ts     # 交易记录路由
│   └── index.ts                  # (更新) 注册新路由
└── server.ts                     # (更新) 初始化定时任务
```

### 前端更新文件

```
frontend/src/
└── api/
    └── usage.ts                  # (更新) 完整的 API 请求封装
```

---

## 🧪 测试指南

### 1. 测试积分余额

```bash
# 设置 Token
export TOKEN="YOUR_ACCESS_TOKEN"

# 获取当前余额
curl http://localhost:4000/api/transactions/balance \
  -H "Authorization: Bearer $TOKEN"
```

**预期响应：**
```json
{
  "success": true,
  "data": {
    "balance": 100000
  }
}
```

### 2. 测试使用记录同步

**2.1 手动触发同步**
```bash
curl -X POST http://localhost:4000/api/usage/sync \
  -H "Authorization: Bearer $TOKEN"
```

**预期响应：**
```json
{
  "success": true,
  "data": {
    "synced": 2,
    "message": "Manual sync completed"
  },
  "message": "Sync completed successfully"
}
```

**2.2 查看使用记录**
```bash
curl http://localhost:4000/api/usage \
  -H "Authorization: Bearer $TOKEN"
```

**预期响应：**
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "...",
        "apiKeyId": "...",
        "timestamp": "2024-12-14T...",
        "model": "gpt-4",
        "promptTokens": 100,
        "completionTokens": 200,
        "totalTokens": 300,
        "creditCost": 1,
        "apiKey": {
          "id": "...",
          "label": "开发环境Key"
        }
      }
    ],
    "pagination": {
      "total": 10,
      "page": 1,
      "pageSize": 20,
      "totalPages": 1
    },
    "summary": {
      "totalTokens": 3000,
      "totalCreditCost": 3
    }
  }
}
```

### 3. 测试交易记录

```bash
# 获取交易记录
curl http://localhost:4000/api/transactions \
  -H "Authorization: Bearer $TOKEN"
```

**预期响应：**
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "...",
        "userId": "...",
        "type": "RECHARGE",
        "amount": 100000,
        "balance": 100000,
        "ref": "ORDER_ID",
        "desc": "充值积分",
        "createdAt": "2024-12-14T..."
      },
      {
        "id": "...",
        "type": "DEDUCT",
        "amount": -1,
        "balance": 99999,
        "ref": "usage_record_id",
        "desc": "API 调用扣费（gpt-4，300 tokens）",
        "createdAt": "2024-12-14T..."
      }
    ],
    "pagination": {
      "total": 2,
      "page": 1,
      "pageSize": 20,
      "totalPages": 1
    },
    "summary": {
      "currentBalance": 99999
    }
  }
}
```

### 4. 测试使用统计

```bash
curl http://localhost:4000/api/usage/statistics \
  -H "Authorization: Bearer $TOKEN"
```

**预期响应：**
```json
{
  "success": true,
  "data": {
    "byModel": [
      {
        "model": "gpt-4",
        "totalTokens": 2000,
        "totalCreditCost": 2,
        "requestCount": 5
      },
      {
        "model": "gpt-3.5-turbo",
        "totalTokens": 1000,
        "totalCreditCost": 1,
        "requestCount": 3
      }
    ],
    "total": {
      "totalTokens": 3000,
      "totalCreditCost": 3,
      "requestCount": 8
    }
  }
}
```

### 5. 查看定时任务日志

```bash
# 后端日志中应该看到：
[Usage Sync] Scheduler initialized (runs every 5 minutes)
[Usage Sync] Starting sync...
[Usage Sync] Found 2 active keys
[Usage Sync] Syncing key xxx from 2024-12-14T10:00:00.000Z
[Usage Sync] Found 3 new records for key xxx
[Usage Sync] Processed record: 300 tokens, 1 credits
[Usage Sync] Sync completed
```

---

## ⚠️ 注意事项

### 1. 定时同步

- ✅ 每5分钟自动同步一次
- ✅ 只同步激活状态的 Keys
- ✅ 从最后同步时间开始拉取
- ✅ 防止重复同步（检查记录是否存在）
- ⚠️ new-api 服务必须正常运行
- ⚠️ 同步失败不会中断服务

### 2. 积分计算

- ✅ 每1000 tokens = 1积分
- ✅ 向上取整（300 tokens = 1积分）
- ✅ 可配置比例
- ⚠️ 余额不足时API调用会失败

### 3. 事务安全

- ✅ 使用 Prisma 事务确保原子性
- ✅ 积分扣除和记录创建同时完成
- ✅ 失败时自动回滚

---

## 🚀 下一步计划（阶段 6）

根据开发方案，下一步可以实现：

1. **使用记录页面（Usage）**
   - 使用记录列表展示
   - 时间范围筛选
   - 模型筛选
   - Key 筛选
   - 导出功能

2. **余额页面（Balance）**
   - 当前余额展示
   - 交易记录列表
   - 交易类型筛选
   - 统计图表

3. **账户信息页面（Account）**
   - 个人资料
   - 账户统计

---

## ✅ 功能验证清单

### 后端功能

- [x] 积分扣除服务
- [x] 积分充值服务
- [x] 积分退款服务
- [x] 交易记录查询
- [x] 余额查询
- [x] 统计信息查询
- [x] 使用记录同步服务
- [x] 定时同步任务（每5分钟）
- [x] 手动触发同步
- [x] 使用记录查询
- [x] 使用统计（按模型分组）
- [x] 防止重复同步
- [x] 事务安全保证

### API 端点

- [x] GET `/api/usage`
- [x] GET `/api/usage/statistics`
- [x] POST `/api/usage/sync`
- [x] GET `/api/transactions`
- [x] GET `/api/transactions/balance`
- [x] GET `/api/transactions/statistics`

### 前端 API

- [x] 使用记录 API 封装
- [x] 交易记录 API 封装
- [x] 余额查询 API 封装
- [x] 统计信息 API 封装

---

## 📊 统计

- **后端新增文件**: 6 个
- **前端更新文件**: 1 个
- **API 端点**: 6 个
- **代码行数**: 约 1500+ 行

---

## 🎯 成果

✅ **阶段 5 已完成！**

我们成功实现了：
1. ✅ 完整的积分管理系统
2. ✅ 自动使用记录同步服务
3. ✅ 定时任务（每5分钟同步）
4. ✅ 积分自动扣除
5. ✅ 交易记录管理
6. ✅ 统计信息查询
7. ✅ 事务安全保证

**关键亮点：**
- ⏰ 自动定时同步（每5分钟）
- 🔒 事务安全的积分扣除
- 🔄 与 new-api 完美集成
- 📊 完整的统计信息
- 🛡️ 防止重复同步
- ⚡ 高性能的分页查询

**注意：** 前端页面组件（Usage 和 Balance 页面）需要继续开发，当前已完成后端 API 和前端 API 封装。建议在下一阶段完成前端页面的开发。

准备好继续开发阶段 6：前端页面开发了吗？ 🚀
