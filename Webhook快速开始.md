# Webhook 快速配置指南

## 5分钟快速开始

### 第一步：生成共享密钥

在终端运行以生成一个安全的32字符密钥：

```bash
# macOS/Linux
openssl rand -hex 16

# Windows PowerShell
[Convert]::ToHexString((1..16 | ForEach-Object {Get-Random -Max 256}))
```

记住输出的密钥，例如：`a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

### 第二步：配置 LetAiCode

编辑 `backend/.env` 文件：

```bash
# Webhook 配置
WEBHOOK_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

### 第三步：配置 new-api

1. 打开 new-api 管理后台
2. 进入 **系统设置 → 系统选项**
3. 创建/修改以下选项：

**选项 1：webhook_url**
- 键：`webhook_url`
- 值：`https://your-letaicode-domain.com/api/webhooks/events`
  - 将 `your-letaicode-domain.com` 替换为你的实际域名
  - 如果本地测试，使用 `http://localhost:4000/api/webhooks/events`

**选项 2：webhook_secret**
- 键：`webhook_secret`
- 值：`a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`（与第一步生成的密钥相同）

### 第四步：创建数据库表

在 LetAiCode 后端目录运行：

```bash
npm install
npx prisma migrate dev --name add_webhook_log
```

### 第五步：验证配置

**测试 webhook 端点**：

```bash
curl -X GET https://your-letaicode-domain.com/api/webhooks/health
```

预期响应：
```json
{
  "success": true,
  "message": "Webhook service is healthy"
}
```

## 就这样！

配置完成后，当用户通过 new-api token 调用 API 时：

1. ✅ API 调用完成
2. ✅ 立即发送 webhook 到 LetAiCode
3. ✅ 立即扣除用户积分
4. ✅ 完成！

## 故障排查

| 问题 | 解决方案 |
|------|--------|
| "Failed to send webhook" | 检查 webhook_url 是否正确，LetAiCode 服务是否在线 |
| "Invalid webhook signature" | 确保 webhook_secret 在两边配置相同 |
| 积分未扣除 | 查看 LetAiCode webhook_logs 表检查错误 |
| webhook_url/webhook_secret 选项不存在 | 在管理后台创建新选项 |

## 环境变量参考

### LetAiCode (.env)

```bash
# 必需
WEBHOOK_SECRET=your_32_char_secret_here

# 可选（默认已配置）
WEBHOOK_ENABLED=true
```

### new-api (系统选项)

```
webhook_url     = https://your-domain.com/api/webhooks/events
webhook_secret  = your_32_char_secret_here
```

## 高级配置

### 修改重试策略

编辑 `loveyouai/service/webhook.go`：

```go
// 修改重试次数（默认3次）
maxRetries := 5

// 修改初始重试延迟（默认1秒）
baseBackoff := 2 * time.Second
```

### 自定义 webhook 端点

如需修改 webhook 接收路径，编辑 `LetAiCodeWeb/backend/src/routes/webhook.routes.ts`：

```typescript
// 改为其他路径，如 /webhook/new-api
router.post('/new-api', webhookController.handleWebhook.bind(webhookController));
```

## 监控 webhook

查看最近的 webhook 处理情况：

```sql
SELECT
  status,
  COUNT(*) as count,
  MAX(processedAt) as latest
FROM webhook_logs
WHERE createdAt > DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY status;
```

查看失败的 webhook：

```sql
SELECT
  eventId,
  errorMsg,
  createdAt
FROM webhook_logs
WHERE status = 'failed'
ORDER BY createdAt DESC
LIMIT 10;
```

## 关闭 webhook（回退）

如果需要临时禁用 webhook：

1. 在 new-api 系统选项中删除或清空 `webhook_url`
2. LetAiCode 会自动回退到5分钟轮询同步

## 更多信息

详细配置和故障排查：见 `WEBHOOK_INTEGRATION_GUIDE.md`