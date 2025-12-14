# 🧪 阶段 4 测试指南

## 快速测试 API Keys 页面

### 前置条件

1. ✅ Redis 已启动
2. ✅ 后端服务已启动（http://localhost:4000）
3. ✅ 前端服务已启动（http://localhost:5173）
4. ✅ **new-api 服务已启动（http://localhost:3000）**
5. ✅ 环境变量已配置

---

## 📝 环境变量配置

### backend/.env

```bash
# new-api 配置（必须）
NEW_API_BASE_URL=http://localhost:3000
NEW_API_ADMIN_TOKEN=your_admin_token_here

# AES 加密密钥（必须，32位字符）
AES_SECRET_KEY=your_32_chars_secret_key_here!!!
```

**获取 new-api Admin Token：**
1. 访问 new-api 管理界面
2. 登录管理员账户
3. 在"系统设置"或"Token 管理"中找到管理员 Token

---

## 📝 测试步骤

### 步骤 1：测试 new-api 连接

```bash
# 测试 new-api 服务是否可访问
curl http://localhost:3000/api/status
```

**预期结果：** 返回 200 状态码或服务信息

### 步骤 2：登录并获取 Token

**2.1 发送验证码**
```bash
curl -X POST http://localhost:4000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

**2.2 登录**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "code": "从邮件或日志中获取的验证码"
  }'
```

**保存返回的 accessToken！**

### 步骤 3：测试创建 API Key

```bash
# 设置 Token 变量
export TOKEN="YOUR_ACCESS_TOKEN"

# 创建 API Key
curl -X POST http://localhost:4000/api/keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"label": "测试环境Key"}'
```

**预期结果：**
```json
{
  "success": true,
  "message": "API Key created successfully",
  "data": {
    "id": "...",
    "label": "测试环境Key",
    "remoteKeyId": "123",
    "maskedValue": "sk-****...abc123",
    "fullValue": "sk-1234567890abcdef1234567890abcdef12345678",
    "status": "ACTIVE",
    "createdAt": "2024-12-14T...",
    "usage": {
      "totalTokens": 0,
      "creditCost": 0
    }
  }
}
```

**⚠️ 重要：** `fullValue` 只在创建时返回一次，请立即保存！

### 步骤 4：获取 Keys 列表

```bash
curl http://localhost:4000/api/keys \
  -H "Authorization: Bearer $TOKEN"
```

**预期结果：** 返回 Keys 数组，其中 `fullValue` 不存在，只有 `maskedValue`

### 步骤 5：更新 Key 状态

```bash
KEY_ID="从步骤3或4获取"

# 禁用 Key
curl -X PATCH http://localhost:4000/api/keys/$KEY_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status": "DISABLED"}'

# 启用 Key
curl -X PATCH http://localhost:4000/api/keys/$KEY_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status": "ACTIVE"}'
```

**预期结果：** 返回更新后的 Key 信息

### 步骤 6：删除 Key

```bash
curl -X DELETE http://localhost:4000/api/keys/$KEY_ID \
  -H "Authorization: Bearer $TOKEN"
```

**预期结果：**
```json
{
  "success": true,
  "message": "API Key deleted successfully"
}
```

### 步骤 7：验证 new-api 同步

1. 访问 new-api 管理界面
2. 查看 Token 列表
3. 确认：
   - ✅ 创建的 Key 存在于 new-api 中
   - ✅ Key 名称正确
   - ✅ Key 状态与 LetAiCode 同步
   - ✅ 删除的 Key 在 new-api 中也被删除

---

## 🌐 测试前端页面

### 步骤 1：访问 API Keys 页面

1. 打开浏览器：http://localhost:5173
2. 登录账户
3. 点击侧边栏的"接口密钥"
4. 应该看到 API Keys 管理页面

### 步骤 2：创建新 Key

1. 点击"创建新密钥"按钮
2. 输入 Key 名称（例如："生产环境"）
3. 点击"创建"
4. 应该看到：
   - ✅ 成功图标（绿色对勾）
   - ✅ 提示文字："API Key 创建成功！"
   - ✅ 完整的 Key 值（灰色背景框）
   - ✅ "复制到剪贴板"按钮

### 步骤 3：复制 Key

1. 点击"复制到剪贴板"按钮
2. 应该看到：
   - ✅ 按钮图标变为对勾
   - ✅ 提示消息："API Key 已复制到剪贴板"
3. 粘贴到文本编辑器，验证复制成功

### 步骤 4：查看 Keys 列表

1. 点击"我已保存，关闭"按钮
2. 应该看到：
   - ✅ 新创建的 Key 出现在列表中
   - ✅ Key 值显示为脱敏格式（sk-****...后4位）
   - ✅ 状态显示为"启用"（绿色标签）
   - ✅ 使用情况显示为 0
   - ✅ 创建时间正确
   - ✅ 最后使用显示为"从未使用"

### 步骤 5：复制脱敏 Key

1. 点击 Key 值旁边的复制按钮
2. 应该看到：
   - ✅ 复制按钮图标变为对勾
   - ✅ 提示消息："已复制到剪贴板"
3. 粘贴验证（复制的是脱敏值）

### 步骤 6：禁用/启用 Key

1. 点击"启用/禁用"按钮（电源图标）
2. Key 状态变为"禁用"（灰色标签）
3. 提示消息："Key 已禁用"
4. 再次点击，恢复为"启用"

### 步骤 7：删除 Key

1. 点击"删除"按钮（红色删除图标）
2. 应该看到确认对话框：
   - ✅ 标题："确认删除"
   - ✅ 内容："删除后无法恢复，是否确认删除此 API Key？"
3. 点击"删除"
4. Key 从列表中消失
5. 提示消息："API Key 已删除"

### 步骤 8：测试空状态

1. 删除所有 Keys
2. 应该看到空状态占位符：
   - ✅ 空状态图标
   - ✅ 文字："还没有 API Key，创建一个"
   - ✅ "创建一个"是可点击链接

### 步骤 9：测试响应式

1. 打开浏览器开发者工具（F12）
2. 切换到移动设备模拟模式
3. 选择 iPhone SE（375x667）
4. 验证：
   - ✅ 创建按钮全宽显示
   - ✅ 表格可横向滚动
   - ✅ Key 值正常显示
   - ✅ 操作按钮可点击

---

## 🐛 常见问题

### 问题 1：创建 Key 失败，提示 "Failed to create API key in new-api"

**原因：** new-api 服务未启动或连接失败

**解决方案：**
1. 确认 new-api 服务正在运行
2. 检查 `NEW_API_BASE_URL` 配置是否正确
3. 检查 `NEW_API_ADMIN_TOKEN` 是否有效
4. 查看后端日志获取详细错误信息

### 问题 2：创建 Key 成功但 new-api 中看不到

**原因：** 管理员 Token 权限不足或 new-api API 版本不匹配

**解决方案：**
1. 确认使用的是管理员 Token（不是普通用户 Token）
2. 检查 new-api 版本和 API 接口兼容性
3. 查看 new-api 日志

### 问题 3：前端显示 "获取 API Keys 失败"

**原因：** 后端服务未启动或认证失败

**解决方案：**
1. 确认后端服务正在运行
2. 确认已登录且 Token 有效
3. 打开浏览器控制台（F12），查看网络请求错误

### 问题 4：复制功能不工作

**原因：** 浏览器不支持 Clipboard API 或权限被拒绝

**解决方案：**
1. 使用 HTTPS 或 localhost（Clipboard API 要求）
2. 授予浏览器剪贴板权限
3. 手动选择并复制 Key 值

### 问题 5：Key 值显示为 undefined

**原因：** 数据库中 Key 数据不完整

**解决方案：**
1. 检查数据库 `ApiKey` 表
2. 确认 `maskedValue` 字段有值
3. 重新创建 Key

---

## ✅ 验收标准

### 功能验收

- [ ] 可以成功创建 API Key
- [ ] 创建的 Key 在 new-api 中同步
- [ ] 完整 Key 仅在创建时显示一次
- [ ] 列表中显示脱敏 Key
- [ ] 复制功能正常工作
- [ ] 可以启用/禁用 Key
- [ ] 可以删除 Key
- [ ] 删除的 Key 在 new-api 中也被删除
- [ ] 使用情况统计正确显示
- [ ] 空状态正常显示

### UI 验收

- [ ] 页面标题：32px, 700字重, #14151a
- [ ] 创建按钮：48px 高, 8px 圆角, 绿色
- [ ] 表格样式：#fafafa 头部背景
- [ ] Key 值：等宽字体, #f5f5f5 背景
- [ ] 状态标签：绿色（启用）、灰色（禁用）
- [ ] 操作按钮：悬停效果正确
- [ ] 响应式：移动端正常显示
- [ ] 加载状态：显示 Spin 组件
- [ ] 错误提示：显示 message.error

---

## 📊 测试数据

### 测试用户
- 邮箱：test@example.com
- 验证码：从邮件或后端日志获取

### 测试 Keys
- 名称示例：
  - "开发环境"
  - "测试环境"
  - "生产环境"
  - "临时测试"

---

## 🎯 测试检查表

### 后端测试
- [ ] GET `/api/keys` 返回 Keys 列表
- [ ] GET `/api/keys/:id` 返回 Key 详情
- [ ] POST `/api/keys` 创建 Key 成功
- [ ] PATCH `/api/keys/:id/status` 更新状态成功
- [ ] DELETE `/api/keys/:id` 删除 Key 成功
- [ ] new-api 同步正常
- [ ] AES 加密存储正常
- [ ] 权限验证正常（只能访问自己的 Keys）

### 前端测试
- [ ] API Keys 页面正确渲染
- [ ] 创建 Key 按钮可点击
- [ ] 创建 Key 弹窗正确显示
- [ ] Key 列表正确显示
- [ ] 脱敏 Key 显示正确
- [ ] 复制功能正常
- [ ] 启用/禁用功能正常
- [ ] 删除功能正常（带确认）
- [ ] 使用情况统计显示
- [ ] 空状态正常显示
- [ ] 加载状态正常显示
- [ ] 错误提示正常显示
- [ ] 响应式设计正常

---

✅ **测试通过后，阶段 4 开发完成！可以继续开发阶段 5。** 🚀
