# 🧪 阶段 3 测试指南

## 快速测试 Coding Plan 页面

### 前置条件

1. ✅ Redis 已启动
2. ✅ 后端服务已启动（http://localhost:4000）
3. ✅ 前端服务已启动（http://localhost:5173）
4. ✅ 数据库已初始化（包含套餐数据）

---

## 📝 测试步骤

### 步骤 1：检查数据库中的套餐数据

```bash
cd /mnt/c/jxProject/LetAiCodeWeb/backend

# 查看套餐数据
pnpm prisma studio
```

在 Prisma Studio 中打开 `PackagePlan` 表，确认有 4 个套餐：
- 入门版（19元，100K积分）
- 标准版（49元，300K积分）
- 专业版（99元，700K积分）
- 企业版（199元，1500K积分）

如果没有数据，运行：
```bash
pnpm prisma:seed
```

### 步骤 2：测试套餐 API

**测试 1：获取套餐列表**
```bash
curl http://localhost:4000/api/packages
```

**预期结果：**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "入门版",
      "type": "coding",
      "credits": 100000,
      "price": 19,
      "description": "适合个人开发者，包含基础 API 调用额度",
      "features": {
        "features": [
          "100,000 积分额度",
          "支持所有基础模型",
          "7x24小时技术支持",
          "永久有效"
        ]
      },
      "isActive": true
    },
    ...
  ]
}
```

### 步骤 3：登录并测试购买流程

**3.1 发送验证码**
```bash
curl -X POST http://localhost:4000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

**3.2 登录**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "code": "从邮件中获取的验证码"
  }'
```

**保存返回的 accessToken！**

**3.3 创建订单**
```bash
# 先获取一个套餐 ID
PACKAGE_ID="从步骤2的响应中获取"

curl -X POST http://localhost:4000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "packageId": "'$PACKAGE_ID'"
  }'
```

**预期结果：**
```json
{
  "success": true,
  "message": "订单创建成功",
  "data": {
    "id": "ORDER_ID",
    "userId": "...",
    "packageId": "...",
    "amount": 19,
    "credits": 100000,
    "status": "PENDING",
    "package": {
      "name": "入门版",
      ...
    }
  }
}
```

**3.4 模拟支付**
```bash
ORDER_ID="从上一步获取"

curl -X POST http://localhost:4000/api/orders/$ORDER_ID/simulate-payment \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**预期结果：**
```json
{
  "success": true,
  "message": "支付成功（模拟）",
  "data": {
    "orderId": "ORDER_ID"
  }
}
```

**3.5 验证积分是否充值**
```bash
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**预期结果：** 用户的 `credits` 字段应该增加了 100000

### 步骤 4：测试前端页面

1. 打开浏览器：http://localhost:5173

2. 如果未登录，会自动跳转到登录页

3. 登录后，点击侧边栏的 "Coding Plan"

4. 应该看到 4 个套餐卡片，完全复刻 MiniMAXI 设计：
   - ✅ 卡片圆角：16px
   - ✅ 卡片阴影：0 2px 8px rgba(0,0,0,0.08)
   - ✅ 悬停效果：上移 4px，阴影加深
   - ✅ 价格字体：48px，700 字重
   - ✅ 购买按钮：48px 高，12px 圆角，绿色

5. 点击任意套餐的"立即购买"按钮

6. 应该弹出支付确认对话框

7. 点击"确认支付"

8. 应该显示"购买成功！积分已充值到账户"

9. 查看顶部导航栏，用户积分应该更新

### 步骤 5：测试响应式设计

1. 打开浏览器开发者工具（F12）

2. 切换到移动设备模拟模式

3. 选择 iPhone SE（375x667）

4. 验证：
   - ✅ 套餐卡片单列显示
   - ✅ 页面布局正常
   - ✅ 按钮可点击
   - ✅ 文字大小合适

---

## 🐛 常见问题

### 问题 1：套餐列表为空

**症状：** API 返回空数组

**解决方案：**
```bash
cd /mnt/c/jxProject/LetAiCodeWeb/backend
pnpm prisma:seed
```

### 问题 2：创建订单失败

**症状：** 返回 "套餐不存在" 或 "该套餐已下架"

**解决方案：**
1. 检查套餐 ID 是否正确
2. 检查套餐的 `isActive` 字段是否为 `true`

### 问题 3：模拟支付失败

**症状：** 返回 "订单状态不正确，无法支付"

**解决方案：**
- 确认订单状态为 `PENDING`
- 确认订单 ID 正确
- 确认使用的是创建订单的用户的 Token

### 问题 4：积分未充值

**症状：** 支付成功但积分没有增加

**解决方案：**
1. 检查后端日志，查看是否有错误
2. 查看数据库中的 `CreditTransaction` 表，确认交易记录
3. 查看数据库中的 `User` 表，确认 `credits` 字段

### 问题 5：前端卡片不显示

**症状：** 页面只显示加载动画或空白

**解决方案：**
1. 打开浏览器控制台（F12），查看是否有错误
2. 检查网络请求，确认 API 调用成功
3. 确认后端服务正在运行

---

## ✅ 验收标准

### 功能验收

- [ ] 可以成功获取套餐列表
- [ ] 可以成功创建订单
- [ ] 可以成功模拟支付
- [ ] 支付成功后积分正确充值
- [ ] 积分交易记录正确创建
- [ ] 可以查看订单列表
- [ ] 可以查看订单详情
- [ ] 可以取消待支付订单

### UI 验收

- [ ] 页面标题：40px, 700字重, #14151a
- [ ] 套餐卡片：16px 圆角, 阴影正确
- [ ] 价格显示：48px, 700字重
- [ ] 购买按钮：48px 高, 12px 圆角, 绿色
- [ ] 悬停效果：卡片上移 4px，阴影加深
- [ ] 按钮悬停：颜色变浅，上移 2px
- [ ] 响应式：移动端单列显示
- [ ] 加载状态：显示 Spin 组件
- [ ] 错误提示：显示 message.error

---

## 📊 测试数据

### 测试用户
- 邮箱：test@example.com
- 验证码：从邮件获取（或查看后端日志）

### 测试套餐（seed 数据）
1. **入门版** - ¥19 / 100,000 积分
2. **标准版** - ¥49 / 300,000 积分
3. **专业版** - ¥99 / 700,000 积分
4. **企业版** - ¥199 / 1,500,000 积分

---

## 🎯 测试检查表

### 后端测试
- [ ] GET `/api/packages` 返回套餐列表
- [ ] GET `/api/packages/:id` 返回套餐详情
- [ ] POST `/api/orders` 创建订单成功
- [ ] GET `/api/orders` 返回订单列表
- [ ] GET `/api/orders/:id` 返回订单详情
- [ ] POST `/api/orders/:id/simulate-payment` 支付成功
- [ ] POST `/api/orders/:id/cancel` 取消订单成功
- [ ] 积分充值事务正确执行
- [ ] 交易记录正确创建

### 前端测试
- [ ] Coding Plan 页面正确渲染
- [ ] 套餐列表正确显示
- [ ] 套餐卡片样式完全符合 MiniMAXI
- [ ] 点击购买按钮显示确认对话框
- [ ] 确认支付后显示成功消息
- [ ] 用户积分正确更新
- [ ] 加载状态正确显示
- [ ] 错误提示正确显示
- [ ] 响应式设计在移动端正常

---

## 📝 测试报告模板

测试完成后，请填写：

### 测试环境
- 操作系统：
- Node 版本：
- 浏览器：
- 测试时间：

### 测试结果
- 后端测试：通过 / 未通过
- 前端测试：通过 / 未通过
- UI 验收：通过 / 未通过

### 发现的问题
1.
2.
3.

### 备注

---

✅ **测试通过后，阶段 3 开发完成！可以继续开发阶段 4。** 🚀
