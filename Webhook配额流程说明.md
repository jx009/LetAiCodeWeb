# Webhook 与额度检查流程详解

## 问题回顾

当前 Webhook 实现中，LetAiCode 的积分扣除是在 API 调用**完成之后**发送的。那么问题来了：

**❌ 问题**：API 调用已经在 new-api 执行了，消耗了模型资源，但之后才检查 LetAiCode 的积分是否足够，会不会出现以下情况？

```
用户 API 调用 → new-api 执行调用 → 返回结果 → 才检查 LetAiCode 积分
                                        ↓
                                    积分不足！

那用户已经用了模型，但积分没扣，或扣不了怎么办？
```

## 完整答案

### 不会出现问题！因为有"预扣费"机制 ✅

new-api 已经有了完善的**"预扣费"机制**，在 API 调用**之前**就检查和预扣用户额度。

## 详细的流程解析

### 完整的 new-api API 调用流程

```
┌─────────────────────────────────────────────────────────────────────┐
│ 用户发起 API 请求（带 token）                                       │
└────────────────────────────┬────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│ ①【前置检查】PreConsumeQuota                                         │
│ ├─ 获取用户当前额度                                                │
│ ├─ 检查额度是否 > 0                                               │
│ ├─ 计算本次调用预计消耗额度                                        │
│ ├─ 检查额度是否足够：userQuota - preConsumedQuota >= 0             │
│ ├─ 若 trustQuota 内，无限令牌则不预扣                              │
│ └─ 若需要，立即从用户额度中扣除（预扣费）❌ 失败则拒绝             │
│                                                                    │
│    决策：                                                          │
│    ├─ 积分充足且是无限令牌 → 不预扣，直接调用                     │
│    ├─ 积分不足 → 返回 403 Forbidden（调用立即停止）              │
│    └─ 积分不足以支付预估额度 → 返回 403 Forbidden                 │
└────────────────────────────┬────────────────────────────────────────┘
                             ↓
          预扣成功（或无需预扣）
          relayInfo.FinalPreConsumedQuota 记录预扣额度
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│ ②【执行调用】Relay to Upstream                                     │
│ ├─ 调用上游模型（OpenAI、Claude 等）                              │
│ ├─ 获取响应和实际消耗的 tokens                                     │
│ └─ 计算实际消耗的额度                                              │
│                                                                    │
│    可能的结果：                                                    │
│    ├─ ✅ 成功：返回结果，继续到第③步                              │
│    └─ ❌ 失败：进行错误处理和额度返还                              │
└────────────────────────────┬────────────────────────────────────────┘
                             ↓
                    调用成功或失败
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│ ③【额度调整】PostConsumeQuota / ReturnPreConsumedQuota              │
│                                                                    │
│ 如果调用失败：                                                    │
│ ├─ 返还所有预扣的额度                                              │
│ │  relayInfo.FinalPreConsumedQuota 返还给用户                     │
│ └─ 用户额度恢复，不进行 webhook 调用                               │
│                                                                    │
│ 如果调用成功：                                                    │
│ ├─ 计算实际消耗 = 实际 tokens × 比例                              │
│ ├─ 如果预扣 > 实际消耗：返还差额                                  │
│ │  例如：预扣 100，实际消耗 80，返还 20                           │
│ ├─ 如果实际消耗 > 预扣：额外扣费                                  │
│ │  例如：预扣 100，实际消耗 150，额外扣 50                        │
│ └─ 【发送 Webhook】通知 LetAiCode 实际消耗情况                    │
└────────────────────────────┬────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│ ④【LetAiCode 处理】Webhook 事件（本次开发）                       │
│ ├─ 验证 webhook 签名                                               │
│ ├─ 检查幂等性（eventId）                                          │
│ └─ 记录使用情况，扣除用户积分                                     │
│                                                                    │
│ 重要：这一步只是记录和同步，不会再进行额度检查                     │
│      因为积分检查已在第①步完成！                                  │
└─────────────────────────────────────────────────────────────────────┘
```

## 关键概念解释

### 1. 预扣费（Pre-Consume Quota）

```go
// new-api 的预扣费逻辑（service/pre_consume_quota.go）

func PreConsumeQuota(c *gin.Context, preConsumedQuota int, relayInfo *relaycommon.RelayInfo) {
    // ① 获取用户当前额度
    userQuota, err := model.GetUserQuota(relayInfo.UserId, false)

    // ② 检查额度是否为 0
    if userQuota <= 0 {
        return "用户额度不足"  // ❌ 拒绝调用
    }

    // ③ 检查预扣额度是否超过当前额度
    if userQuota - preConsumedQuota < 0 {
        return "预扣费额度失败"  // ❌ 拒绝调用
    }

    // ④ 智能决策：是否需要预扣
    if userQuota > trustQuota {
        if relayInfo.TokenUnlimited {
            // 用户额度充足 + 无限令牌 = 无需预扣
            preConsumedQuota = 0
        } else if tokenQuota > trustQuota {
            // 用户额度充足 + 令牌额度充足 = 无需预扣
            preConsumedQuota = 0
        }
    }

    // ⑤ 执行预扣
    if preConsumedQuota > 0 {
        model.DecreaseUserQuota(relayInfo.UserId, preConsumedQuota)
    }
}
```

### 2. 额度返还与调整（PostConsumeQuota）

```go
// 调用完成后，进行最终的额度调整

// 场景 1：调用失败 → 返还所有预扣
if callFailed {
    returnAmount = relayInfo.FinalPreConsumedQuota
    model.IncreaseUserQuota(userId, returnAmount)  // 退钱
}

// 场景 2：调用成功，实际消耗 < 预扣 → 返还差额
actualCost = actualTokens * ratio
if actualCost < relayInfo.FinalPreConsumedQuota {
    returnAmount = relayInfo.FinalPreConsumedQuota - actualCost
    model.IncreaseUserQuota(userId, returnAmount)  // 退差价
}

// 场景 3：调用成功，实际消耗 > 预扣 → 额外扣费
if actualCost > relayInfo.FinalPreConsumedQuota {
    extraCost = actualCost - relayInfo.FinalPreConsumedQuota
    model.DecreaseUserQuota(userId, extraCost)  // 额外扣
}
```

## 三种调用场景分析

### 场景 1：用户积分充足，预扣 100，实际消耗 80

```
初始状态
├─ LetAiCode 积分：1000
└─ new-api 额度：无限（0）

请求到达
│
├─ ①【PreConsumeQuota】
│  ├─ 当前 LetAiCode 积分：1000
│  ├─ 预估消耗：100
│  ├─ 检查：1000 > 100 ✅
│  ├─ 预扣：1000 - 100 = 900
│  └─ LetAiCode 积分：900
│
├─ ②【API 调用】
│  ├─ 调用上游模型
│  ├─ 响应成功 ✅
│  └─ 实际消耗 tokens 计算出实际消耗：80
│
└─ ③【PostConsumeQuota + Webhook】
   ├─ 实际消耗：80 < 预扣 100
   ├─ 需要返还：100 - 80 = 20
   ├─ LetAiCode 积分：900 + 20 = 920
   └─ 【发送 Webhook】
      ├─ eventId：xxx
      ├─ 实际消耗：80
      └─ LetAiCode 应用 Webhook
         └─ 记录使用记录，创建交易记录

最终状态
├─ LetAiCode 积分：920（用户支付了 80，预扣多了 20 已返还）
└─ new-api 额度：无限（保持）
```

### 场景 2：用户积分不足，拒绝调用（不会走到 Webhook）

```
初始状态
├─ LetAiCode 积分：50
└─ new-api 额度：无限

请求到达
│
└─ ①【PreConsumeQuota】
   ├─ 当前 LetAiCode 积分：50
   ├─ 预估消耗：100
   ├─ 检查：50 < 100 ❌
   ├─ 返回：HTTP 403 Forbidden（"预扣费额度失败"）
   ├─ 调用立即停止 🛑
   └─ LetAiCode 积分：50（未变）

❌ 不会调用上游模型
❌ 不会发送 Webhook
❌ 用户不会被扣费
✅ 用户无法使用超过积分的模型
```

### 场景 3：API 调用失败，返还所有预扣

```
初始状态
├─ LetAiCode 积分：1000
└─ new-api 额度：无限

请求到达
│
├─ ①【PreConsumeQuota】
│  ├─ 预扣：100
│  └─ LetAiCode 积分：900
│
├─ ②【API 调用】
│  ├─ 调用上游模型
│  ├─ 响应错误 ❌（例如 rate limit、timeout）
│  └─ 不返回 tokens
│
└─ ③【ReturnPreConsumedQuota】
   ├─ 调用失败，返还全部预扣
   ├─ 返还：100
   ├─ LetAiCode 积分：900 + 100 = 1000
   └─ ❌ 不发送 Webhook（因为调用本身失败）

最终状态
├─ LetAiCode 积分：1000（恢复）
└─ 用户：没有被扣费，也没有得到结果
```

## 信任度（TrustQuota）机制

为了不频繁地预扣和返还，new-api 引入了**信任度**概念：

```go
trustQuota := common.GetTrustQuota()  // 默认值，如 100

// 场景 1：用户额度充足（> trustQuota）
if userQuota > trustQuota {
    // 信任用户有足够额度，无需预扣
    preConsumedQuota = 0
    // 直接调用
}

// 场景 2：用户额度不足（<= trustQuota）
if userQuota <= trustQuota {
    // 信任度降低，需要精确的预扣来防止超支
    preConsumedQuota = estimatedCost
    // 扣费后再调用
}
```

**优势**：
- ✅ 减少频繁的数据库操作
- ✅ 提高系统性能
- ✅ 保证账户安全（防止透支）

## Webhook 在这个流程中的作用

### Webhook 的职责

```
Webhook 的作用 ≠ 控制用户是否可以调用 API
Webhook 的作用 = 记录实际消耗，同步到 LetAiCode
```

### 具体流程

1. **【前置检查】** new-api 在调用前检查额度 ✅
   - 这时如果积分不足，直接返回 403，**不调用模型**

2. **【执行调用】** 如果前置检查通过，调用模型

3. **【后置同步】** 调用完成后发送 Webhook 到 LetAiCode
   - Webhook **只负责记录**实际消耗
   - Webhook **不负责检查**是否有足够积分
   - 检查已经在步骤 1 完成了！

## 故障场景分析

### 场景 1：new-api 预扣成功，但 Webhook 发送失败

```
①【PreConsumeQuota】
└─ LetAiCode 积分：100 → 80（预扣 20）

②【API 调用】
└─ 成功，消耗 20

③【Webhook】
└─ 发送失败 ❌
   ├─ 尝试重试（1秒后、2秒后、4秒后）
   ├─ 最多重试 3 次
   └─ 仍然失败...

④【LetAiCode 侧】
└─ 没有收到 Webhook
   ├─ 不知道这次调用发生了
   ├─ 用户在 LetAiCode 看不到这次使用记录
   ├─ 但...
   └─ 用户的积分在 new-api 已经扣了！

⚠️ 问题：new-api 扣了，LetAiCode 没扣（不知道）

✅ 解决方案：这是可接受的
   ├─ LetAiCode 还有 5 分钟轮询机制作为备份
   ├─ 5 分钟后会从 new-api 同步数据
   └─ 最终一致性得到保证

🔄 改进建议：
   ├─ 实现管理员 dashboard 显示 webhook 失败
   ├─ 支持手动重放失败的 webhook
   └─ 监控 webhook 失败率
```

### 场景 2：Webhook 重复送达（幂等性保证）

```
①【第一次 Webhook】
├─ eventId：abc123
├─ 消耗：20
├─ LetAiCode 处理成功 ✅
├─ 积分：1000 → 980
└─ 记录到 webhook_logs：status = processed

②【网络抖动，重试】
├─ 再次发送同一个 webhook
├─ eventId：abc123（相同！）
├─ LetAiCode 收到
├─ 检查 webhook_logs：eventId abc123 已存在！
├─ 返回："Event already processed (idempotent)" ✅
└─ 不再扣费

③【最终状态】
└─ 用户积分：980（不会被重复扣两次）
```

## 完整的安全保障

```
多层防护：

① 【new-api 层】预扣费 + 动态调整
   ├─ 防止用户透支
   ├─ 防止积分漂移
   └─ 精确的实际消耗计算

② 【Webhook 层】幂等性 + 签名验证
   ├─ 防止重复扣费
   ├─ 防止伪造请求
   └─ 可靠的事务处理

③ 【LetAiCode 层】5 分钟轮询备份
   ├─ Webhook 失败时作为备份
   ├─ 确保最终一致性
   └─ 定期审计

④ 【数据库层】事务 + 索引
   ├─ 原子性操作
   ├─ 快速查询
   └─ 数据完整性
```

## 总结：问题的最终答案

### ❓ 问题
API 调用已经执行，之后才检查 LetAiCode 积分，会不会出现"用了但没扣费"的情况？

### ✅ 答案
**不会！** 因为：

1. **预扣费机制**：在 API 调用**之前**，new-api 就检查并扣除了用户额度
   - 如果积分不足，直接返回 403，**不调用模型**
   - 只有积分检查通过，才会调用上游模型

2. **三步流程保证**：
   - ① PreConsumeQuota（调用前检查和预扣）✅
   - ② API 调用（执行模型调用）
   - ③ PostConsumeQuota（精确调整）

3. **Webhook 的角色**：
   - Webhook 只是**记录和同步**使用情况
   - **不负责检查**是否有积分
   - 检查已经在第①步完成！

4. **备份机制**：
   - 即使 Webhook 失败，5 分钟轮询会同步
   - 保证最终一致性

### 📊 实际流程

```
【严格的积分检查】     【模型执行】      【记录和同步】
      ↓                  ↓               ↓
① PreConsume         ② API Call    ③ Webhook
   ✅ 检查通过          ✅ 成功      + PostConsume
   拒绝不足            模型调用        记录使用

← 这里决定是否调用    这里决定调用    这里决定记录
← 费用检查完成!        是否成功       实际金额
```

所以用户**绝对不会**在积分不足的情况下调用模型！🔒