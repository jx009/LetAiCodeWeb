# 🎉 阶段 6 完成：前端页面开发（Usage & Balance）

## ✅ 已完成功能

### 前端页面

1. **使用记录页面** (`frontend/src/pages/Usage/index.tsx`)
   - ✅ 使用记录列表展示（带分页）
   - ✅ 统计卡片（总 Tokens、总积分消耗、记录数）
   - ✅ 筛选功能
     - API Key 筛选
     - 模型筛选（gpt-4, gpt-3.5-turbo, gpt-4-turbo）
     - 时间范围筛选（日期选择器）
   - ✅ 手动同步按钮
   - ✅ 表格展示（7列）
     - 时间
     - API Key
     - 模型
     - Prompt Tokens
     - Completion Tokens
     - 总 Tokens
     - 积分消耗
   - ✅ 分页支持（带页码切换和每页数量选择）
   - ✅ 响应式布局

2. **积分余额页面** (`frontend/src/pages/Balance/index.tsx`)
   - ✅ 交易记录列表展示（带分页）
   - ✅ 统计卡片（5个）
     - 当前余额（大字号，蓝色高亮）
     - 总充值
     - 总消耗
     - 总赠送
     - 总退款
   - ✅ 筛选功能
     - 交易类型筛选（充值、赠送、扣费、退款、调整）
     - 时间范围筛选
   - ✅ 刷新按钮
   - ✅ 表格展示（5列）
     - 时间
     - 类型（带彩色标签）
     - 变动积分（正数绿色，负数红色）
     - 余额
     - 说明
   - ✅ 分页支持
   - ✅ 响应式布局

3. **页面样式**
   - ✅ `frontend/src/pages/Usage/styles.less` - 使用记录页样式
   - ✅ `frontend/src/pages/Balance/styles.less` - 积分余额页样式
   - ✅ 完全复刻 MiniMAXI 风格
   - ✅ 响应式设计（支持移动端）
   - ✅ 统一的卡片阴影和圆角
   - ✅ 表格悬停效果

### 状态管理

4. **Auth Store 更新** (`frontend/src/store/index.ts`)
   - ✅ 新增 `updateBalance()` 方法
   - ✅ User 类型已包含 `balance` 字段
   - ✅ 支持余额的持久化存储

5. **TopHeader 组件更新** (`frontend/src/components/Layout/TopHeader.tsx`)
   - ✅ 自动获取余额（组件挂载时）
   - ✅ 定时刷新余额（每30秒）
   - ✅ 实时显示用户积分余额
   - ✅ 点击余额跳转到余额页面
   - ✅ 退出登录时清理定时器

---

## 📋 页面功能详解

### 使用记录页面（Usage）

**URL**: `/usage`

**主要功能**:
1. **统计卡片**
   ```typescript
   - 总 Tokens: 显示所有记录的 token 总数
   - 总积分消耗: 显示总的积分消耗（红色高亮）
   - 记录数: 显示总记录条数
   ```

2. **筛选器**
   ```typescript
   - API Key 下拉选择（从已创建的 Key 中选择）
   - 模型下拉选择（gpt-4, gpt-3.5-turbo, gpt-4-turbo）
   - 时间范围选择（RangePicker）
   - 查询按钮：应用筛选条件
   - 重置按钮：清空所有筛选条件
   ```

3. **使用记录表格**
   ```typescript
   列配置:
   - 时间: YYYY-MM-DD HH:mm:ss 格式
   - API Key: 显示 Key 的标签
   - 模型: 蓝色 Tag 标签
   - Prompt Tokens: 右对齐，千分位格式
   - Completion Tokens: 右对齐，千分位格式
   - 总 Tokens: 右对齐，加粗，千分位格式
   - 积分消耗: 右对齐，加粗，红色，千分位格式
   ```

4. **操作**
   ```typescript
   - 手动同步: 触发后端同步 new-api 使用记录
   - 分页: 支持页码切换和每页数量选择（10/20/50/100）
   ```

### 积分余额页面（Balance）

**URL**: `/balance`

**主要功能**:
1. **统计卡片**
   ```typescript
   第一行（主要统计）:
   - 当前余额: 大字号（32px），蓝色，千分位格式
   - 总充值: 绿色，千分位格式
   - 总消耗: 红色，千分位格式

   第二行（次要统计）:
   - 总赠送: 千分位格式
   - 总退款: 千分位格式
   ```

2. **筛选器**
   ```typescript
   - 交易类型下拉选择
     - 充值 (RECHARGE)
     - 赠送 (BONUS)
     - 扣费 (DEDUCT)
     - 退款 (REFUND)
     - 调整 (ADMIN_ADJUST)
   - 时间范围选择（RangePicker）
   - 查询按钮：应用筛选条件
   - 重置按钮：清空所有筛选条件
   ```

3. **交易记录表格**
   ```typescript
   列配置:
   - 时间: YYYY-MM-DD HH:mm:ss 格式
   - 类型: 彩色 Tag 标签
     - 充值: 绿色
     - 赠送: 青色
     - 扣费: 红色
     - 退款: 橙色
     - 调整: 紫色
   - 变动积分: 正数绿色带+号，负数红色，千分位格式
   - 余额: 加粗，千分位格式
   - 说明: 显示详细描述
   ```

4. **操作**
   ```typescript
   - 刷新按钮: 刷新所有数据（余额、统计、交易记录）
   - 分页: 支持页码切换和每页数量选择
   ```

---

## 💡 关键实现

### 1. 使用记录页面核心代码

```typescript
const Usage: React.FC = () => {
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [summary, setSummary] = useState({ totalTokens: 0, totalCreditCost: 0 });
  const [filters, setFilters] = useState<{
    keyId?: string;
    model?: string;
    dateRange?: [Dayjs, Dayjs];
  }>({});

  // 获取使用记录
  const fetchRecords = async (page = 1, pageSize = 20) => {
    const params: any = { page, pageSize };
    if (filters.keyId) params.keyId = filters.keyId;
    if (filters.model) params.model = filters.model;
    if (filters.dateRange) {
      params.startDate = filters.dateRange[0].format('YYYY-MM-DD');
      params.endDate = filters.dateRange[1].format('YYYY-MM-DD');
    }

    const response = await getUsageRecords(params);
    // 处理响应...
  };

  // 手动同步
  const handleSync = async () => {
    await syncUsageRecords();
    fetchRecords();
  };
};
```

### 2. 积分余额页面核心代码

```typescript
const Balance: React.FC = () => {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [statistics, setStatistics] = useState({
    currentBalance: 0,
    totalRecharge: 0,
    totalBonus: 0,
    totalDeduct: 0,
    totalRefund: 0,
  });

  // 获取余额
  const fetchBalance = async () => {
    const response = await getBalance();
    setBalance(response.data.data.balance);
  };

  // 获取统计信息
  const fetchStatistics = async () => {
    const params: any = {};
    if (filters.dateRange) {
      params.startDate = filters.dateRange[0].format('YYYY-MM-DD');
      params.endDate = filters.dateRange[1].format('YYYY-MM-DD');
    }
    const response = await getCreditStatistics(params);
    setStatistics(response.data.data);
  };

  // 交易类型标签
  const getTypeTag = (type: TransactionType) => {
    const typeMap = {
      RECHARGE: { color: 'green', label: '充值' },
      BONUS: { color: 'cyan', label: '赠送' },
      DEDUCT: { color: 'red', label: '扣费' },
      REFUND: { color: 'orange', label: '退款' },
      ADMIN_ADJUST: { color: 'purple', label: '调整' },
    };
    return <Tag color={typeMap[type].color}>{typeMap[type].label}</Tag>;
  };
};
```

### 3. TopHeader 余额实时刷新

```typescript
const TopHeader = () => {
  const { user, updateBalance, isAuthenticated } = useAuthStore();
  const intervalRef = useRef<NodeJS.Timeout>();

  // 获取余额
  const fetchBalance = async () => {
    if (!isAuthenticated) return;
    const response = await getBalance();
    updateBalance(response.data.data.balance);
  };

  // 定时刷新（每30秒）
  useEffect(() => {
    if (isAuthenticated) {
      fetchBalance();
      intervalRef.current = setInterval(fetchBalance, 30000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated]);

  // 显示余额
  return (
    <div className="balance-display" onClick={() => navigate(ROUTES.BALANCE)}>
      <WalletOutlined />
      <Text>余额: {formatCredit(user?.balance || 0)} 积分</Text>
    </div>
  );
};
```

---

## 📂 文件结构

### 新增文件

```
frontend/src/
├── pages/
│   ├── Usage/
│   │   ├── index.tsx           # 使用记录页面组件
│   │   └── styles.less         # 使用记录页面样式
│   └── Balance/
│       ├── index.tsx           # 积分余额页面组件
│       └── styles.less         # 积分余额页面样式
```

### 更新文件

```
frontend/src/
├── store/
│   └── index.ts                # (更新) 新增 updateBalance 方法
└── components/
    └── Layout/
        └── TopHeader.tsx       # (更新) 自动获取和刷新余额
```

---

## 🎨 UI/UX 特性

### 1. 视觉设计

- ✅ 完全复刻 MiniMAXI 平台风格
- ✅ 统一的卡片阴影: `box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03)`
- ✅ 统一的圆角: `border-radius: 8px`
- ✅ 一致的间距: `margin: 24px`
- ✅ 清晰的层级结构

### 2. 交互设计

- ✅ 表格悬停高亮
- ✅ 按钮加载状态
- ✅ 错误提示（message）
- ✅ 成功提示（message）
- ✅ 筛选器实时响应
- ✅ 分页流畅切换

### 3. 响应式布局

**断点配置**:
```less
// 平板（≤768px）
@media (max-width: 768px) {
  - 筛选器纵向排列
  - 按钮全宽
  - 表格字体缩小
  - 内边距减小
}

// 手机（≤576px）
@media (max-width: 576px) {
  - 标题字号缩小
  - 统计卡片纵向排列
  - 单列布局
}
```

### 4. 数据格式化

- ✅ 数字千分位格式: `toLocaleString()`
- ✅ 日期格式化: `YYYY-MM-DD HH:mm:ss`
- ✅ 积分正负显示: 正数绿色带+，负数红色
- ✅ 类型彩色标签

---

## 🧪 测试指南

### 1. 测试使用记录页面

**前置条件**: 已登录，已创建 API Key，已有使用记录

**测试步骤**:
1. 访问 `/usage`
2. 查看统计卡片是否显示正确数据
3. 测试筛选功能:
   - 选择不同的 API Key
   - 选择不同的模型
   - 选择时间范围
   - 点击"查询"按钮
   - 点击"重置"按钮
4. 测试手动同步:
   - 点击"同步记录"按钮
   - 等待同步完成
   - 查看是否有新记录
5. 测试分页:
   - 切换页码
   - 切换每页数量

**预期结果**:
- 所有统计数据正确显示
- 筛选功能正常工作
- 同步功能正常触发
- 分页切换流畅

### 2. 测试积分余额页面

**前置条件**: 已登录，已有积分交易记录

**测试步骤**:
1. 访问 `/balance`
2. 查看5个统计卡片是否显示正确
3. 测试筛选功能:
   - 选择不同的交易类型
   - 选择时间范围
   - 点击"查询"按钮
   - 点击"重置"按钮
4. 测试刷新功能:
   - 点击"刷新"按钮
   - 查看数据是否更新
5. 测试分页:
   - 切换页码
   - 切换每页数量

**预期结果**:
- 所有统计数据正确显示
- 当前余额突出显示（蓝色大字）
- 交易类型标签颜色正确
- 变动积分颜色正确（正数绿色，负数红色）
- 筛选和刷新功能正常

### 3. 测试 TopHeader 余额显示

**测试步骤**:
1. 登录系统
2. 查看顶部导航栏右侧是否显示余额
3. 等待30秒，查看余额是否自动刷新
4. 进行一次 API 调用（产生扣费）
5. 等待最多35秒（5分钟同步 + 30秒刷新）
6. 查看余额是否更新

**预期结果**:
- 余额正确显示
- 余额自动刷新
- 点击余额跳转到余额页面

### 4. 响应式测试

**测试步骤**:
1. 在桌面浏览器打开页面
2. 调整浏览器宽度:
   - 1200px+（桌面）
   - 768px-1200px（平板）
   - 0-768px（手机）
3. 查看布局是否适配

**预期结果**:
- 桌面: 多列布局，所有元素清晰可见
- 平板: 部分元素纵向排列
- 手机: 单列布局，卡片纵向排列

---

## 🔗 与后端集成

### API 调用关系

```typescript
使用记录页面 (Usage)
├── getUsageRecords()        → GET /api/usage
├── getUsageStatistics()     → GET /api/usage/statistics
├── syncUsageRecords()       → POST /api/usage/sync
└── getApiKeys()             → GET /api/keys

积分余额页面 (Balance)
├── getBalance()             → GET /api/transactions/balance
├── getCreditStatistics()    → GET /api/transactions/statistics
└── getTransactions()        → GET /api/transactions

TopHeader 组件
└── getBalance()             → GET /api/transactions/balance
```

### 数据流

```
1. 后端定时同步（每5分钟）
   new-api → backend/usage.service → database

2. 前端获取数据
   database → backend/API → frontend/pages

3. TopHeader 实时刷新（每30秒）
   database → backend/API → frontend/TopHeader → auth store
```

---

## ⚠️ 注意事项

### 1. 性能优化

- ✅ 使用分页避免一次性加载大量数据
- ✅ 统计信息与列表数据分离请求
- ✅ TopHeader 余额刷新间隔30秒（避免过于频繁）
- ✅ 筛选器防抖处理（setTimeout 0ms）
- ⚠️ 大数据量时建议使用虚拟滚动

### 2. 错误处理

- ✅ API 调用失败显示错误提示
- ✅ 网络错误不影响页面显示
- ✅ 余额获取失败静默处理（不干扰用户）
- ⚠️ 需要考虑 token 过期的情况

### 3. 用户体验

- ✅ 加载状态明确（loading spinner）
- ✅ 操作反馈及时（message 提示）
- ✅ 数据格式化友好（千分位、日期）
- ✅ 响应式布局适配多端
- ⚠️ 建议添加骨架屏提升体验

---

## 📊 统计

- **前端新增文件**: 4 个（2 个页面组件 + 2 个样式文件）
- **前端更新文件**: 2 个（store + TopHeader）
- **代码行数**: 约 800+ 行
- **页面功能**: 2 个完整页面
- **UI 组件**: 20+ 个 Ant Design 组件

---

## 🎯 成果

✅ **阶段 6 已完成！**

我们成功实现了：
1. ✅ 使用记录页面（Usage）
   - 完整的使用记录列表
   - 统计卡片展示
   - 多维度筛选功能
   - 手动同步功能

2. ✅ 积分余额页面（Balance）
   - 当前余额突出显示
   - 完整的交易记录列表
   - 5个统计维度
   - 交易类型筛选

3. ✅ TopHeader 实时余额
   - 自动获取余额
   - 定时刷新（30秒）
   - 点击跳转

4. ✅ 完整的状态管理
   - Auth Store 支持余额更新
   - 余额持久化存储

**关键亮点**:
- 🎨 完全复刻 MiniMAXI 设计风格
- 📱 完整的响应式布局
- ⚡ 性能优化（分页、定时刷新）
- 🔄 实时数据同步
- 💎 优秀的用户体验

---

## 🚀 下一步计划（阶段 7）

根据开发方案，后续可以实现：

1. **账户信息页面（Account）**
   - 个人资料编辑
   - 密码修改
   - 账户统计

2. **充值页面（Recharge）**
   - 套餐选择
   - 支付流程
   - 订单管理

3. **通知页面（Notifications）**
   - 系统通知列表
   - 通知标记已读
   - 通知删除

4. **设置页面（Settings）**
   - 主题切换
   - 语言设置
   - 偏好设置

---

## ✅ 功能验证清单

### 前端页面

- [x] 使用记录页面组件
- [x] 使用记录页面样式
- [x] 积分余额页面组件
- [x] 积分余额页面样式
- [x] 统计卡片展示
- [x] 筛选功能
- [x] 分页功能
- [x] 响应式布局
- [x] 加载状态
- [x] 错误处理

### 状态管理

- [x] Auth Store 余额字段
- [x] updateBalance 方法
- [x] 余额持久化

### TopHeader

- [x] 余额显示
- [x] 自动获取余额
- [x] 定时刷新余额
- [x] 点击跳转
- [x] 退出清理定时器

### UI/UX

- [x] MiniMAXI 风格复刻
- [x] 统一的视觉风格
- [x] 流畅的交互
- [x] 友好的错误提示
- [x] 响应式适配

---

准备好继续开发阶段 7：账户信息和其他页面了吗？ 🚀
