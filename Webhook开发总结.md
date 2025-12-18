# Webhook 实时积分扣除 - 开发总结

## 项目背景

### 问题分析
- **现状**：LetAiCode 使用5分钟轮询方式同步 new-api 的使用数据
- **问题**：
  - 最多5分钟延迟导致积分扣除不及时
  - 用户可能在积分不足的情况下继续调用API
  - 积分可能漂移，造成财务不一致

### 解决方案
实施 **Webhook 事件驱动架构**，实现API调用后的**实时积分扣除**

---

## 开发成果

### 1. LetAiCode 后端改动

#### A. 数据库扩展 (`backend/prisma/schema.prisma`)

添加 `WebhookLog` 模型用于幂等性检查：

```prisma
model WebhookLog {
  id          String   @id @default(uuid())
  eventId     String   @unique
  payload     String   @db.LongText
  status      String   @default("processed")
  errorMsg    String?
  processedAt DateTime @default(now())
  createdAt   DateTime @default(now())

  @@index([eventId])
  @@index([createdAt])
  @@map("webhook_logs")
}
```

#### B. Webhook 服务层 (`backend/src/services/webhook.service.ts`)

实现完整的 webhook 处理服务：

- **签名验证**：HMAC-SHA256 签名验证
- **幂等性检查**：通过 eventId 防止重复处理
- **事务处理**：原子性创建使用记录和扣费记录
- **错误处理**：完善的错误记录和状态追踪

关键功能：
```typescript
interface WebhookService {
  verifyWebhookSignature()     // 验证请求签名
  handleWebhookEvent()         // 处理 webhook 事件
  handleUsageEvent()           // 处理使用事件
  cleanupOldWebhookLogs()      // 清理旧日志
}
```

#### C. Webhook 控制器 (`backend/src/controllers/webhook.controller.ts`)

HTTP 端点实现：

```typescript
POST /api/webhooks/events     // 接收 webhook 事件
GET  /api/webhooks/health     // 健康检查
```

功能：
- 签名验证
- 必要字段验证
- webhook 事件处理
- 错误响应

#### D. 路由配置 (`backend/src/routes/webhook.routes.ts`)

```typescript
router.post('/events', ...)    // webhook 接收
router.get('/health', ...)     // 健康检查
```

#### E. 环境配置 (`backend/.env`)

```bash
WEBHOOK_SECRET=your_webhook_secret_here_min_32_chars
```

---

### 2. new-api 后端改动

#### A. Webhook 发送服务 (`service/webhook.go`)

实现可靠的 webhook 发送机制：

```go
type WebhookService {
  SendWebhookUsageEvent()           // 发送使用事件
  sendWebhookEventWithRetry()       // 带重试的发送
  sendWebhookEvent()                // 单次发送
  generateWebhookSignature()        // 生成签名
}
```

特性：
- **异步发送**：使用 goroutine，不阻塞 API 响应
- **指数退避重试**：1秒、2秒、4秒、8秒（最多3次）
- **HMAC签名**：SHA256 签名验证
- **完整错误处理**：记录所有失败和重试

#### B. 日志记录改动 (`model/log.go`)

在 `RecordConsumeLog()` 函数中添加 webhook 发送：

```go
// 发送 webhook 事件到 LetAiCode
if params.TokenId > 0 {
  totalTokens := params.PromptTokens + params.CompletionTokens
  service.SendWebhookUsageEvent(c, params.TokenId, params.ModelName,
    params.PromptTokens, params.CompletionTokens, totalTokens, params.Quota)
}
```

---

## 技术架构

### 数据流

```
用户调用API via token
        ↓
new-api 处理请求
        ↓
记录使用日志 (RecordConsumeLog)
        ↓
异步发送 webhook 到 LetAiCode
        ├─ 包含：tokenId, model, tokens, creditCost
        ├─ 签名：HMAC-SHA256(payload, secret)
        └─ 带重试机制
        ↓
LetAiCode 接收 webhook
        ├─ 验证签名
        ├─ 检查幂等性 (eventId)
        ├─ 查询 API Key 关联的用户
        └─ 在事务中扣除积分 + 创建记录
        ↓
返回结果给 new-api
        ├─ Success: 记录处理成功
        └─ Failure: 重试或最终记录失败
```

### 关键设计决策

1. **异步处理**
   - ✅ 不阻塞 API 响应
   - ✅ 提高系统吞吐量
   - ⚠️ 可能存在短时间的积分漂移

2. **幂等性设计**
   - ✅ 使用 eventId 防止重复扣费
   - ✅ 支持安全重试

3. **签名验证**
   - ✅ 防止来自非授权方的请求
   - ✅ 使用 HMAC-SHA256

4. **指数退避重试**
   - ✅ 避免网络抖动导致失败
   - ✅ 不会过度重试

---

## 文件清单

### LetAiCode 项目

#### 新增文件
- `backend/src/services/webhook.service.ts` - Webhook 处理服务
- `backend/src/controllers/webhook.controller.ts` - Webhook 控制器
- `backend/src/routes/webhook.routes.ts` - Webhook 路由
- `WEBHOOK_INTEGRATION_GUIDE.md` - 完整集成指南
- `WEBHOOK_SETUP_QUICKSTART.md` - 快速配置指南
- `WEBHOOK_DEVELOPMENT_SUMMARY.md` - 本文件

#### 修改文件
- `backend/prisma/schema.prisma` - 添加 WebhookLog 模型
- `backend/src/routes/index.ts` - 注册 webhook 路由
- `backend/.env` - 添加 WEBHOOK_SECRET 配置

### new-api 项目

#### 新增文件
- `service/webhook.go` - Webhook 发送服务

#### 修改文件
- `model/log.go` - 在 RecordConsumeLog 中添加 webhook 发送

---

## 配置清单

### LetAiCode 需配置

```bash
# backend/.env
WEBHOOK_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

### new-api 需配置（系统选项）

| 选项键 | 值示例 |
|--------|--------|
| webhook_url | https://your-letaicode.com/api/webhooks/events |
| webhook_secret | a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6 |

> ⚠️ **重点**：两个密钥必须相同

---

## 部署步骤

### 步骤 1：LetAiCode 后端

```bash
cd backend

# 安装依赖
npm install

# 运行数据库迁移
npx prisma migrate dev --name add_webhook_log

# 启动服务
npm run dev
```

### 步骤 2：new-api

```bash
# 重新编译（包含新的 webhook.go）
go build -o new-api .

# 启动服务
./new-api
```

### 步骤 3：配置 new-api 系统选项

1. 打开 new-api 管理后台
2. 进入系统设置 → 系统选项
3. 添加/修改：
   - `webhook_url`
   - `webhook_secret`

### 步骤 4：验证

```bash
# 测试 webhook 端点
curl https://your-letaicode.com/api/webhooks/health

# 查看数据库中的 webhook_logs 表
SELECT * FROM webhook_logs ORDER BY createdAt DESC LIMIT 5;
```

---

## 性能指标

### 预期性能

| 指标 | 值 |
|------|-----|
| 积分扣除延迟 | < 100ms（平均） |
| webhook 发送超时 | 10秒/次请求 |
| 最大重试次数 | 3次 |
| 重试间隔 | 1秒、2秒、4秒（指数退避） |
| 幂等性检查速度 | < 1ms（唯一索引查询） |

### 可靠性指标

| 指标 | 目标 |
|------|------|
| 成功率 | > 99.9% |
| 数据一致性 | 100%（幂等性保证） |
| 重复扣费风险 | 0%（eventId 幂等性） |

---

## 监控和调试

### 监控查询

```sql
-- 最近1小时的 webhook 处理统计
SELECT status, COUNT(*) as count
FROM webhook_logs
WHERE createdAt > DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY status;

-- 失败的 webhook 详情
SELECT eventId, errorMsg, createdAt
FROM webhook_logs
WHERE status = 'failed'
ORDER BY createdAt DESC
LIMIT 20;

-- 积分交易审计
SELECT u.username, ct.type, ct.amount, ct.balance, ct.createdAt
FROM credit_transactions ct
JOIN users u ON u.id = ct.userId
ORDER BY ct.createdAt DESC
LIMIT 100;
```

### 日志检查

**new-api 日志**：
```
grep -i "webhook" new-api.log
grep -i "SendWebhookUsageEvent" new-api.log
```

**LetAiCode 日志**：
```
grep -i "webhook" backend.log
grep -i "handleWebhook" backend.log
```

---

## 安全考虑

### 实施的安全措施

✅ **签名验证**
- 使用 HMAC-SHA256 防止伪造请求
- 每个 webhook 都会验证签名

✅ **幂等性**
- 防止重复处理导致重复扣费
- 使用 eventId 唯一性检查

✅ **密钥管理**
- 密钥最少32字符
- 在环境变量中管理
- 支持定期轮换

✅ **HTTPS 传输**
- 生产环境必须使用 HTTPS
- 防止中间人攻击

### 建议的额外安全措施

- [ ] 实施 IP 白名单（仅允许 new-api 服务器 IP）
- [ ] 速率限制（每秒最多 X 个 webhook）
- [ ] WAF 规则配置
- [ ] 审计日志记录
- [ ] 定期的安全审计

---

## 故障排查指南

### 常见问题和解决方案

| 问题 | 症状 | 解决方案 |
|------|------|--------|
| webhook 无法送达 | LetAiCode 收不到事件 | 1. 检查 URL 配置<br>2. 检查网络连接<br>3. 查看防火墙 |
| 签名验证失败 | "Invalid webhook signature" | 1. 确认两边密钥相同<br>2. 检查是否有空格 |
| 幂等性失败 | 重复扣费 | 1. 检查 webhook_logs 表<br>2. 验证数据库迁移 |
| 积分未扣除 | 使用记录有但积分不变 | 1. 查看 webhook_logs 错误<br>2. 检查余额是否充足 |

---

## 回退和禁用

### 临时禁用 webhook

```sql
-- 在 new-api 中
UPDATE options SET value = '' WHERE key = 'webhook_url';
```

### 恢复轮询同步

- 无需任何操作，LetAiCode 仍保持5分钟轮询机制
- webhook 禁用后自动回退到轮询

---

## 后续改进方向

### 短期（1-2周）
- [ ] 添加 webhook 管理界面（查看、重放、手动重试）
- [ ] 实现 webhook 日志清理策略
- [ ] 添加 webhook 性能指标监控

### 中期（1个月）
- [ ] 支持多个 webhook endpoint 配置
- [ ] 实现 webhook 白名单/黑名单
- [ ] 支持选择性的 webhook 事件订阅

### 长期（3个月+）
- [ ] 支持其他事件类型（退款、调整、等等）
- [ ] Webhook 重放功能
- [ ] Webhook 模板/规则引擎
- [ ] 分布式追踪集成

---

## 文档参考

- **快速开始**：`WEBHOOK_SETUP_QUICKSTART.md`
- **完整集成指南**：`WEBHOOK_INTEGRATION_GUIDE.md`
- **本文档**：`WEBHOOK_DEVELOPMENT_SUMMARY.md`

---

## 开发时间统计

| 阶段 | 预计 | 实际 |
|------|------|------|
| 需求分析 | - | ✅ 完成 |
| 架构设计 | - | ✅ 完成 |
| LetAiCode 开发 | - | ✅ 完成 |
| new-api 开发 | - | ✅ 完成 |
| 文档编写 | - | ✅ 完成 |
| 总计 | - | ✅ 完成 |

---

## 提交信息示例

```
feat: Implement webhook-based real-time credit deduction

- Add WebhookLog model to LetAiCode database for idempotency checking
- Implement webhook service layer for signature verification and event handling
- Create webhook controller and routes for receiving events
- Add webhook sending service to new-api with exponential backoff retry
- Integrate webhook calls into RecordConsumeLog for immediate credit deduction
- Support HMAC-SHA256 signature verification for security
- Include comprehensive integration and setup documentation

This replaces the previous 5-minute polling mechanism with real-time event
-driven credit deduction, improving user experience and financial accuracy.

Resolves: #issue-number
```

---

## 联系方式

如有问题或需要支持，请提交 Issue 或联系技术团队。

---

**开发日期**：2024-12-18
**版本**：1.0.0
**状态**：✅ 已完成