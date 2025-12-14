# 阶段 7 - 第 2 天进度报告

> 日期：2024年12月14日
> 任务：订单管理 + 支付集成 + 充值页面

---

## ✅ 今日完成任务

### 1. 易支付客户端封装

**文件**：`backend/src/services/epay.service.ts`

**核心功能**：
- ✅ 易支付配置管理（从 Option 表读取）
- ✅ 生成支付签名（MD5 算法）
- ✅ 验证回调签名
- ✅ 创建支付请求（生成支付URL和参数）
- ✅ 处理支付回调通知

**签名算法**：
```typescript
// 1. 过滤空值和 sign 字段
// 2. 按 key 排序拼接：key1=value1&key2=value2&key=商户密钥
// 3. MD5 加密
const signStr = sortedKeys.map((k) => `${k}=${filteredParams[k]}`).join('&') + `&key=${key}`;
const sign = crypto.createHash('md5').update(signStr).digest('hex');
```

**关键接口**：
```typescript
interface PurchaseParams {
  type: string;              // 支付方式（alipay/wxpay）
  serviceTradeNo: string;    // 商户订单号
  name: string;              // 商品名称
  money: string;             // 支付金额
  notifyUrl: string;         // 异步通知地址
  returnUrl: string;         // 同步跳转地址
  device?: 'pc' | 'mobile';  // 设备类型
}

interface VerifyResult {
  verifyStatus: boolean;     // 签名验证结果
  tradeStatus: string;       // 交易状态
  serviceTradeNo: string;    // 商户订单号
  tradeNo: string;           // 易支付订单号
  // ...
}
```

---

### 2. 订单管理服务升级

**文件**：`backend/src/services/order.service.ts`

**新增功能**：

#### 2.1 订单号生成
```typescript
// 格式：USR{userId前8位}NO{随机6位}{时间戳}
// 示例：USR12345678NOABCxyz1702543200000
private generateOrderNo(userId: string): string {
  const userPrefix = userId.substring(0, 8);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestamp = Date.now();
  return `USR${userPrefix}NO${random}${timestamp}`;
}
```

#### 2.2 发起支付请求
```typescript
async requestEpayPayment(
  orderNo: string,
  paymentMethod: string,
  callbackUrl: string,
  returnUrl: string
)
```

**流程**：
1. 检查支付配置是否完成
2. 获取订单信息，验证状态
3. 检查订单是否过期（30分钟）
4. 验证支付方式是否可用
5. 调用 epayService 创建支付请求
6. 更新订单支付方式
7. 返回支付 URL 和参数

#### 2.3 处理支付回调
```typescript
async handleEpayCallback(params: Record<string, string>): Promise<boolean>
```

**流程**：
1. 验证易支付签名
2. 检查交易状态（TRADE_SUCCESS）
3. 使用订单锁防止并发处理
4. 调用内部方法 `processPaymentSuccess`

#### 2.4 处理支付成功（内部方法）
```typescript
private async processPaymentSuccess(orderNo: string, transactionId: string)
```

**使用事务处理，确保原子性**：
1. 更新订单状态为 PAID
2. 记录支付时间和交易号
3. 获取用户当前余额
4. 计算总充值积分（基础 + 赠送）
5. 更新用户余额
6. 记录积分交易（基础充值）
7. 记录积分交易（赠送）

**防止重复处理**：
- 检查订单状态，只处理 PENDING 状态订单
- 使用 Map 结构实现订单锁，防止并发回调

---

### 3. 订单控制器更新

**文件**：`backend/src/controllers/order.controller.ts`

**新增接口**：

#### 3.1 获取支付配置信息
```typescript
GET /api/orders/payment-info

Response:
{
  "success": true,
  "data": {
    "enableOnlineTopup": true,
    "payMethods": [
      {
        "name": "支付宝",
        "type": "alipay",
        "color": "rgba(var(--semi-blue-5), 1)"
      },
      {
        "name": "微信支付",
        "type": "wxpay",
        "color": "rgba(var(--semi-green-5), 1)"
      }
    ],
    "minTopUp": 1
  }
}
```

#### 3.2 发起支付请求
```typescript
POST /api/orders/request-payment

Body:
{
  "orderNo": "USR12345678NOABCxyz1702543200000",
  "paymentMethod": "alipay"
}

Response:
{
  "success": true,
  "message": "支付请求创建成功",
  "data": {
    "url": "https://epay.example.com/submit.php",
    "params": {
      "pid": "merchant_id",
      "type": "alipay",
      "out_trade_no": "USR12345678NOABCxyz1702543200000",
      "notify_url": "http://localhost:4000/api/payment/epay/callback",
      "return_url": "http://localhost:3000/orders",
      "name": "基础套餐",
      "money": "10.00",
      "sign": "...",
      "sign_type": "MD5"
    }
  }
}
```

#### 3.3 根据订单号查询订单
```typescript
GET /api/orders/no/:orderNo
```

---

### 4. 支付回调控制器

**文件**：`backend/src/controllers/payment.controller.ts`

**核心接口**：

#### 4.1 易支付异步回调通知
```typescript
GET /api/payment/epay/callback?xxx=xxx
```

**处理流程**：
1. 接收易支付 GET 请求的 query 参数
2. 调用 orderService.handleEpayCallback 验证并处理
3. 返回 "success" 或 "fail" 给易支付

**重要**：
- 此接口不需要认证（易支付服务器调用）
- 必须返回纯文本 "success" 或 "fail"
- 失败时易支付会重试

#### 4.2 易支付同步返回
```typescript
GET /api/payment/epay/return?xxx=xxx
```

**处理流程**：
1. 接收用户支付完成后的跳转
2. 提取订单号
3. 重定向到前端订单页面

---

### 5. 路由配置

#### 5.1 订单路由更新 - `backend/src/routes/order.routes.ts`
```typescript
// 获取支付配置信息
router.get('/payment-info', orderController.getPaymentInfo);

// 创建订单
router.post('/', authMiddleware, orderController.createOrder);

// 发起支付请求
router.post('/request-payment', authMiddleware, orderController.requestPayment);

// 根据订单号查询订单
router.get('/no/:orderNo', authMiddleware, orderController.getOrderByOrderNo);

// 获取用户订单列表
router.get('/', authMiddleware, orderController.getUserOrders);

// 获取订单详情
router.get('/:id', authMiddleware, orderController.getOrderById);

// 取消订单
router.post('/:id/cancel', authMiddleware, orderController.cancelOrder);
```

#### 5.2 支付路由 - `backend/src/routes/payment.routes.ts`（新建）
```typescript
// 易支付异步回调通知（不需要认证）
router.get('/epay/callback', paymentController.handleEpayCallback);

// 易支付同步返回（不需要认证）
router.get('/epay/return', paymentController.handleEpayReturn);
```

#### 5.3 主路由更新 - `backend/src/routes/index.ts`
```typescript
// 支付路由（易支付回调）
router.use('/payment', paymentRoutes);
```

---

### 6. 前端 API 接口更新

**文件**：`frontend/src/api/recharge.ts`

**新增接口**：

```typescript
// 获取支付配置信息
export const getPaymentInfo = () => {
  return http.get<ApiResponse<PaymentInfo>>('/orders/payment-info');
};

// 根据订单号查询订单
export const getOrderByOrderNo = (orderNo: string) => {
  return http.get<ApiResponse<PaymentOrder>>(`/orders/no/${orderNo}`);
};

// 发起支付请求
export interface PaymentRequest {
  orderNo: string;
  paymentMethod: string;
}

export interface PaymentResult {
  url: string;
  params: Record<string, string>;
}

export const requestPayment = (data: PaymentRequest) => {
  return http.post<ApiResponse<PaymentResult>>('/orders/request-payment', data);
};
```

---

### 7. 充值页面实现

**文件**：`frontend/src/pages/Recharge/index.tsx`

**功能模块**：

#### 7.1 套餐展示
- ✅ 从后端加载套餐列表
- ✅ 按 sortOrder 排序
- ✅ 卡片式展示，支持点击选择
- ✅ 显示价格、基础积分、赠送积分
- ✅ 高亮显示已选套餐

#### 7.2 支付方式选择
- ✅ 从后端加载支付配置
- ✅ Radio 按钮组展示支付方式
- ✅ 支付宝、微信支付图标
- ✅ 默认选中第一个支付方式

#### 7.3 支付流程
```typescript
const handlePurchase = async () => {
  // 1. 验证选择
  if (!selectedPackage) {
    message.warning('请选择充值套餐');
    return;
  }

  // 2. 创建订单
  const orderRes = await createOrder(selectedPackage);
  const order = orderRes.data.data;

  // 3. 发起支付请求
  const payRes = await requestPayment({
    orderNo: order.orderNo,
    paymentMethod: selectedPayMethod,
  });

  const paymentData = payRes.data.data;

  // 4. 构建支付表单并自动提交（新窗口打开）
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = paymentData.url;
  form.target = '_blank';

  Object.keys(paymentData.params).forEach((key) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = paymentData.params[key];
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);

  message.success('已跳转到支付页面，请完成支付');
};
```

#### 7.4 UI 特性
- ✅ 响应式布局（支持手机/平板/桌面）
- ✅ 加载状态提示
- ✅ 错误提示
- ✅ 温馨提示卡片
- ✅ 支付图标（支付宝/微信）

---

## 📋 API 端点汇总

### 订单管理 API

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/orders/payment-info` | 获取支付配置信息 | 否 |
| POST | `/api/orders` | 创建订单 | 是 |
| POST | `/api/orders/request-payment` | 发起支付请求 | 是 |
| GET | `/api/orders` | 获取用户订单列表 | 是 |
| GET | `/api/orders/:id` | 获取订单详情 | 是 |
| GET | `/api/orders/no/:orderNo` | 根据订单号查询订单 | 是 |
| POST | `/api/orders/:id/cancel` | 取消订单 | 是 |

### 支付回调 API

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/payment/epay/callback` | 易支付异步回调通知 | 否 |
| GET | `/api/payment/epay/return` | 易支付同步跳转 | 否 |

---

## 📊 文件清单

### 后端新增/修改文件（6个）

```
backend/src/
├── services/
│   ├── epay.service.ts          # ✅ 新建 - 易支付客户端封装
│   └── order.service.ts         # ✅ 修改 - 集成易支付功能
├── controllers/
│   ├── order.controller.ts      # ✅ 修改 - 新增支付相关接口
│   └── payment.controller.ts    # ✅ 新建 - 支付回调处理
└── routes/
    ├── order.routes.ts          # ✅ 修改 - 更新路由
    ├── payment.routes.ts        # ✅ 新建 - 支付路由
    └── index.ts                 # ✅ 修改 - 注册支付路由
```

### 前端新增/修改文件（2个）

```
frontend/src/
├── api/
│   └── recharge.ts              # ✅ 修改 - 新增支付相关接口
└── pages/
    └── Recharge/
        └── index.tsx            # ✅ 修改 - 完整充值页面实现
```

**总计**：8个文件

---

## 🧪 测试指南

### 1. 配置易支付

**步骤 1**：以超级管理员身份登录

```sql
-- 设置用户为超级管理员
UPDATE users SET role = 'ROOT' WHERE email = 'admin@example.com';
```

**步骤 2**：配置支付参数

```bash
export TOKEN="your_root_user_token"

# 配置易支付网关地址
curl -X PUT http://localhost:4000/api/options/PayAddress \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value":"https://pay.example.com","desc":"易支付网关地址"}'

# 配置商户ID
curl -X PUT http://localhost:4000/api/options/EpayId \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value":"your_merchant_id","desc":"易支付商户ID"}'

# 配置商户密钥
curl -X PUT http://localhost:4000/api/options/EpayKey \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value":"your_merchant_key","desc":"易支付商户密钥"}'

# 配置支付方式
curl -X PUT http://localhost:4000/api/options/PayMethods \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value":"[{\"name\":\"支付宝\",\"type\":\"alipay\",\"color\":\"rgba(var(--semi-blue-5), 1)\"},{\"name\":\"微信支付\",\"type\":\"wxpay\",\"color\":\"rgba(var(--semi-green-5), 1)\"}]","desc":"支付方式列表"}'

# 配置最小充值金额
curl -X PUT http://localhost:4000/api/options/MinTopUp \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value":"1","desc":"最小充值金额"}'
```

### 2. 创建套餐

**方法 1**：通过数据库直接插入

```sql
INSERT INTO package_plans (id, name, price, creditAmount, bonusCredit, "desc", sortOrder, active, createdAt, updatedAt)
VALUES
  ('pkg1', '体验套餐', '10', 100000, 10000, '适合新用户体验', 1, 1, datetime('now'), datetime('now')),
  ('pkg2', '标准套餐', '50', 500000, 100000, '性价比之选', 2, 1, datetime('now'), datetime('now')),
  ('pkg3', '专业套餐', '100', 1000000, 300000, '专业用户首选', 3, 1, datetime('now'), datetime('now'));
```

### 3. 测试充值流程

**步骤 1**：访问充值页面
```
http://localhost:3000/recharge
```

**步骤 2**：选择套餐

**步骤 3**：选择支付方式（支付宝/微信）

**步骤 4**：点击"立即支付"

**预期行为**：
1. 创建订单成功
2. 自动打开新窗口跳转到易支付页面
3. 完成支付后，易支付异步回调 `/api/payment/epay/callback`
4. 用户账户自动充值积分

### 4. 测试支付回调

**模拟易支付回调**：

```bash
# 模拟支付成功回调
curl "http://localhost:4000/api/payment/epay/callback?pid=merchant_id&trade_no=EPAY123456&out_trade_no=USR12345678NOABCxyz1702543200000&type=alipay&name=基础套餐&money=10.00&trade_status=TRADE_SUCCESS&sign=计算的MD5签名"
```

**预期响应**：
- 成功：返回 "success"
- 失败：返回 "fail"

**数据库变化**：
1. `payment_orders` 表：订单状态变为 PAID
2. `users` 表：用户 balance 增加
3. `credit_transactions` 表：新增 2 条记录（RECHARGE + BONUS）

### 5. 验证积分到账

```bash
# 查询用户余额
curl -H "Authorization: Bearer $USER_TOKEN" \
  http://localhost:4000/api/auth/me
```

**预期响应**：
```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "user@example.com",
    "balance": 110000,  // 100000(基础) + 10000(赠送)
    "role": "USER"
  }
}
```

---

## 💡 关键实现细节

### 1. 订单号设计

**格式**：`USR{userId前8位}NO{随机6位}{时间戳}`

**优势**：
- 包含用户信息，便于追溯
- 包含时间戳，确保唯一性
- 添加随机字符，增强安全性

**示例**：`USR12345678NOABCxyz1702543200000`

### 2. 签名验证机制

**防止伪造回调**：
```typescript
// 1. 接收易支付回调参数
const params = req.query;

// 2. 验证签名
const verifyResult = await epayService.verifyCallback(params);
if (!verifyResult.verifyStatus) {
  return res.send('fail');  // 签名验证失败
}

// 3. 处理订单
await orderService.handleEpayCallback(params);
return res.send('success');
```

### 3. 并发处理保护

**使用订单锁防止重复处理**：
```typescript
const orderLocks = new Map<string, Promise<void>>();

async handleEpayCallback(params) {
  const orderNo = params.out_trade_no;

  // 检查是否已有锁
  const existingLock = orderLocks.get(orderNo);
  if (existingLock) {
    await existingLock;
    return true;
  }

  // 创建新锁
  const lockPromise = this.processPaymentSuccess(orderNo, transactionId);
  orderLocks.set(orderNo, lockPromise);

  try {
    await lockPromise;
    return true;
  } finally {
    orderLocks.delete(orderNo);
  }
}
```

**防止的问题**：
- 易支付多次回调导致重复充值
- 用户刷新回调页面
- 网络延迟导致的并发请求

### 4. 事务处理保证原子性

```typescript
await prisma.$transaction(async (tx) => {
  // 1. 更新订单状态
  await tx.paymentOrder.update({...});

  // 2. 更新用户余额
  await tx.user.update({...});

  // 3. 记录积分交易（基础充值）
  await tx.creditTransaction.create({...});

  // 4. 记录积分交易（赠送）
  await tx.creditTransaction.create({...});
});
```

**确保**：
- 要么全部成功，要么全部失败
- 不会出现订单已支付但积分未到账的情况

### 5. 支付表单自动提交

**前端实现**：
```typescript
// 动态创建表单
const form = document.createElement('form');
form.method = 'POST';
form.action = paymentData.url;
form.target = '_blank';  // 新窗口打开

// 添加隐藏字段
Object.keys(paymentData.params).forEach((key) => {
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = key;
  input.value = paymentData.params[key];
  form.appendChild(input);
});

// 提交并清理
document.body.appendChild(form);
form.submit();
document.body.removeChild(form);
```

**优势**：
- 避免跨域问题
- 支持易支付的 POST 请求
- 新窗口打开，用户体验更好

---

## ⚠️ 注意事项

### 1. 回调 URL 配置

**必须配置环境变量**：
```env
API_BASE_URL=http://your-domain.com  # 后端地址
FRONTEND_URL=http://your-frontend.com  # 前端地址
```

**回调地址必须**：
- 公网可访问（易支付服务器需要访问）
- 使用 HTTPS（生产环境）
- 配置到易支付商户后台

### 2. 订单过期处理

- 订单创建后 30 分钟自动过期
- 过期订单无法支付
- 前端应定期检查订单状态

### 3. 支付安全

**已实现的安全措施**：
- ✅ MD5 签名验证
- ✅ 订单状态检查
- ✅ 订单锁防止并发
- ✅ 事务保证原子性

**建议额外措施**：
- 限制单用户订单创建频率
- 记录支付日志用于审计
- 监控异常支付行为

### 4. 测试环境

**建议使用易支付测试环境**：
- 避免真实扣款
- 完整测试支付流程
- 测试回调通知

---

## 🎯 今日成果总结

### 已完成 ✅

1. ✅ 易支付客户端封装（签名生成+验证）
2. ✅ 订单管理服务升级（支付流程）
3. ✅ 订单控制器更新（支付接口）
4. ✅ 支付回调处理（异步+同步）
5. ✅ 路由配置（订单+支付）
6. ✅ 前端 API 接口更新
7. ✅ 充值页面完整实现
8. ✅ 7个新API端点（订单+支付）

### 技术亮点 🌟

1. **易支付集成**：完整的签名验证和回调处理
2. **订单锁机制**：防止并发导致的重复充值
3. **事务处理**：确保支付成功的原子性
4. **支付表单自动提交**：良好的用户体验
5. **响应式充值页面**：支持多端访问

### 功能流程图

```
用户充值流程：
1. 用户访问充值页面
2. 选择套餐 + 支付方式
3. 点击"立即支付"
   ├─ 创建订单（orderNo）
   ├─ 请求支付（获取支付URL和参数）
   └─ 自动提交表单到易支付
4. 跳转到易支付页面
5. 用户完成支付
6. 易支付异步回调
   ├─ 验证签名
   ├─ 使用订单锁
   ├─ 更新订单状态
   ├─ 充值用户积分
   └─ 记录交易
7. 易支付同步返回
   └─ 跳转回前端订单页
8. 用户查看积分到账
```

---

## 📅 明日计划（第 3 天）

### 任务：管理员前端页面 + 测试优化

1. **管理员页面**：
   - 用户管理页面（列表、编辑、角色管理）
   - 配置管理页面（支付配置、系统设置）
   - 订单管理页面（所有订单列表、补单功能）
   - 管理员导航菜单

2. **测试优化**：
   - 完整流程测试
   - 边界情况测试
   - 性能优化
   - 错误处理完善

3. **文档完善**：
   - 部署文档
   - 管理员使用手册
   - 阶段 7 总结文档

**预计产出**：
- 前端页面：约 5-6 个
- API 测试：完整测试用例
- 文档：3-4 个

---

## 📊 阶段 7 总体进度

```
第 1 天（昨天）：权限系统 + 配置管理 + 用户管理  ✅ 100%
第 2 天（今天）：订单管理 + 支付集成 + 充值页面  ✅ 100%
第 3 天（明天）：管理员前端页面 + 测试优化      ⏳ 0%
```

**当前完成度**：约 67%

---

**日期**：2024年12月14日
**作者**：Claude (Anthropic)
**状态**：✅ 第 2 天任务已完成
