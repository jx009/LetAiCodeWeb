# Webhook 实时积分扣除集成指南

## 概述

本指南介绍如何设置 LetAiCode 和 new-api 之间的 Webhook 实时事件同步，以实现 API 调用后立即扣除积分的功能。

## 架构说明

### 当前问题
之前采用的是**5分钟轮询同步**方式，存在以下问题：
- ❌ 同步延迟：用户可能在积分不足的情况下继续调用API
- ❌ 积分漂移：最多可能漂移5分钟
- ❌ 系统效率低：频繁的数据库查询

### 解决方案
采用**Webhook 事件驱动**架构：
- ✅ 实时性：API 调用完成立即发送 webhook
- ✅ 准确性：幂等性检查防止重复处理
- ✅ 可靠性：指数退避重试机制

## 工作流程

```
1. 用户通过 new-api token 调用 API
   ↓
2. new-api 记录使用日志（RecordConsumeLog）
   ↓
3. new-api 发送 webhook 事件到 LetAiCode（异步）
   ↓
4. LetAiCode 接收 webhook
   ├─ 验证签名 (HMAC-SHA256)
   ├─ 检查幂等性 (eventId)
   └─ 扣除积分 + 创建使用记录
   ↓
5. LetAiCode 返回 success 或 error
   ↓
6. new-api 根据响应决定是否重试
   └─ 失败：2秒后重试，然后4秒，然后8秒（最多3次）
```

## 配置步骤

### 第一步：配置 LetAiCode 环境变量

编辑 `backend/.env` 文件，添加或修改以下配置：

```bash
# Webhook 配置（来自 new-api 的事件）
WEBHOOK_SECRET=your_webhook_secret_here_min_32_chars_change_in_production
```

> ⚠️ **重要**：WEBHOOK_SECRET 必须与 new-api 中配置的值保持一致

### 第二步：配置 new-api 系统选项

在 new-api 管理后台，进入 **系统设置 → 系统选项**，添加以下选项：

| 选项键 | 值示例 | 说明 |
|--------|--------|------|
| `webhook_url` | `https://your-letaicode-domain.com/api/webhooks/events` | LetAiCode webhook 接收端点 |
| `webhook_secret` | `your_webhook_secret_here_min_32_chars_change_in_production` | 用于签名验证，**必须与 LetAiCode 配置保持一致** |

> 🔑 **密钥安全**：选择一个随机的32字符以上的字符串作为共享密钥

### 第三步：验证 LetAiCode 数据库迁移

运行 Prisma 数据库迁移以创建 WebhookLog 表：

```bash
cd backend
npm install
npx prisma migrate dev --name add_webhook_log
```

这会创建 `webhook_logs` 表用于记录处理过的 webhook 事件（幂等性）。

### 第四步：启动服务

1. **启动 LetAiCode 后端**：
   ```bash
   npm run dev
   ```

2. **启动 new-api 服务**（确保已编译最新代码）：
   ```bash
   ./new-api
   ```

## 验证集成

### 测试 1：webhook 端点可达性

```bash
curl -X GET https://your-letaicode-domain.com/api/webhooks/health
```

预期响应：
```json
{
  "success": true,
  "message": "Webhook service is healthy",
  "timestamp": "2024-12-18T12:00:00Z"
}
```

### 测试 2：API 调用产生 webhook

1. 在 LetAiCode 查看初始积分余额
2. 通过 new-api token 调用 API（如 GPT-4）
3. 查看 webhook_logs 表是否有新记录
4. 检查 LetAiCode 积分是否立即扣除

### 测试 3：检查幂等性

模拟 webhook 重试（发送相同 eventId 两次）：

```bash
curl -X POST https://your-letaicode-domain.com/api/webhooks/events \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: <signature>" \
  -d '{
    "eventId": "test-event-001",
    "eventType": "usage",
    "timestamp": 1702900800,
    "data": {
      "remoteKeyId": 123,
      "model": "gpt-4",
      "promptTokens": 100,
      "completionTokens": 50,
      "totalTokens": 150,
      "creditCost": 15
    }
  }'
```

预期：第一次成功，第二次返回 "Event already processed (idempotent)"

## 数据模型

### WebhookLog 表结构

```prisma
model WebhookLog {
  id          String   @id @default(uuid())           // 主键
  eventId     String   @unique                        // webhook 事件 ID（幂等性检查）
  payload     String   @db.LongText                  // 完整 webhook 负载（JSON）
  status      String   @default("processed")         // processed 或 failed
  errorMsg    String?                                 // 错误信息
  processedAt DateTime @default(now())               // 处理时间
  createdAt   DateTime @default(now())               // 创建时间

  @@index([eventId])
  @@index([createdAt])
}
```

### WebhookPayload 格式

```typescript
{
  eventId: string;           // UUID，用于幂等性
  eventType: "usage";        // 事件类型
  timestamp: number;         // Unix 时间戳
  data: {
    remoteKeyId: number;     // new-api 中的 Token ID
    model: string;           // 模型名称（如 "gpt-4"）
    promptTokens: number;    // 提示 tokens
    completionTokens: number; // 完成 tokens
    totalTokens: number;     // 总 tokens
    creditCost: number;      // 消耗的积分数
  }
}
```

## 签名验证

### 如何生成签名

```go
import (
  "crypto/hmac"
  "crypto/sha256"
  "encoding/hex"
)

func generateSignature(payload []byte, secret string) string {
  h := hmac.New(sha256.New, []byte(secret))
  h.Write(payload)
  return hex.EncodeToString(h.Sum(nil))
}
```

### 签名验证流程

1. 取得 webhook payload（JSON 字符串）
2. 使用共享密钥生成 HMAC-SHA256 签名
3. 对比签名与请求头中的 `X-Webhook-Signature`
4. 签名匹配才处理请求

## 故障排查

### 问题 1：webhook 无法送达

**症状**：LetAiCode 收不到 webhook 事件

**解决步骤**：
1. ✅ 确认 LetAiCode 后端已启动并可访问
2. ✅ 检查防火墙/安全组允许 new-api 到 LetAiCode 的连接
3. ✅ 在 new-api 日志中查看是否有发送尝试
4. ✅ 验证 `webhook_url` 配置是否正确
5. ✅ 检查网络连接：`curl -I https://your-letaicode-domain.com/api/webhooks/health`

### 问题 2：signature 验证失败

**症状**：返回 "Invalid webhook signature" 错误

**解决步骤**：
1. ✅ 确认 `WEBHOOK_SECRET` 在 LetAiCode 和 new-api 中完全相同
2. ✅ 确保没有在配置中误加空格
3. ✅ 检查是否使用了错误的密钥类型（如使用了旧密钥）

### 问题 3：幂等性检查失败

**症状**：同一 eventId 的 webhook 无法重试

**解决步骤**：
1. ✅ 检查 webhook_logs 表是否存在并有记录
2. ✅ 验证数据库迁移是否成功完成
3. ✅ 查看日志中的 errorMsg 字段

### 问题 4：积分未正确扣除

**症状**：API 调用完成但积分未扣除

**解决步骤**：
1. ✅ 检查 `creditCost` 值是否正确传递
2. ✅ 确认用户积分余额充足（检查 creditTransaction 表）
3. ✅ 查看 webhook_logs 中的 status 是否为 "failed"
4. ✅ 检查 LetAiCode 日志中的错误信息

## 监控和维护

### 监控指标

建议定期检查：

```sql
-- 检查最近的 webhook 处理情况
SELECT status, COUNT(*) as count, MAX(createdAt) as latest
FROM webhook_logs
WHERE createdAt > DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY status;

-- 检查失败的 webhook
SELECT * FROM webhook_logs
WHERE status = 'failed'
ORDER BY createdAt DESC
LIMIT 10;

-- 检查积分交易记录
SELECT type, COUNT(*) as count, SUM(amount) as total
FROM credit_transactions
WHERE createdAt > DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY type;
```

### 清理旧 webhook 日志

LetAiCode webhook 服务会自动清理7天以前的已处理 webhook 日志。可以通过调用以下接口手动触发清理（如果实现了的话）：

```bash
# 手动清理（可选，需要实现端点）
curl -X POST https://your-letaicode-domain.com/api/webhooks/cleanup \
  -H "Authorization: Bearer <admin_token>"
```

## 性能优化建议

1. **异步处理**：new-api 中的 webhook 发送采用异步 goroutine 方式，不会阻塞 API 响应
2. **批量处理**：可以考虑在 LetAiCode 中实现批量积分扣除以提升性能
3. **缓存优化**：考虑缓存用户积分余额以加速扣除操作
4. **数据库连接**：确保连接池配置合理

## 安全考虑

⚠️ **重要的安全措施**：

1. **HTTPS Only**：生产环境务必使用 HTTPS 传输 webhook
2. **密钥管理**：
   - 定期更换 WEBHOOK_SECRET
   - 不要在版本控制中提交真实密钥
   - 使用环境变量管理敏感配置
3. **IP 白名单**：可以考虑限制只有 new-api 服务器 IP 能访问 webhook 端点
4. **速率限制**：已内置速率限制防止滥用
5. **签名验证**：总是验证 webhook 签名，不要跳过此步骤

## 回退方案

如果 webhook 集成出现问题：

1. **临时禁用 webhook**：在 new-api 中删除或注释掉 `webhook_url` 配置
2. **恢复轮询同步**：LetAiCode 仍然保持5分钟轮询作为备份机制
3. **手动调整**：在 LetAiCode 管理后台手动调整用户积分

## 常见问题

### Q: 如果 LetAiCode 不可用会怎样？
A: new-api 会进行指数退避重试（1秒、2秒、4秒、8秒），最多重试3次。失败的 webhook 不会导致 API 调用本身失败，只是积分扣除延迟。

### Q: 能否修改 webhook 重试策略？
A: 可以，修改 `service/webhook.go` 中的 `maxRetries` 和 `baseBackoff` 变量。

### Q: 多个 LetAiCode 实例能共享同一 new-api 吗？
A: 可以，但需要配置不同的 webhook_url 或实现负载均衡。

### Q: webhook 失败是否会影响 API 调用结果？
A: 不会。webhook 是异步发送的，API 响应不依赖 webhook 的成功/失败。

## 联系方式

如有问题，请提交 Issue 或联系技术支持团队。