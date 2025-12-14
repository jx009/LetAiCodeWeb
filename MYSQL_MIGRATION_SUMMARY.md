# MySQL 数据库迁移总结

> 项目已从 SQLite 成功迁移到 MySQL

---

## ✅ 已完成的迁移步骤

### 1. 更新 Prisma Schema

**文件**：`backend/prisma/schema.prisma`

**变更内容**：
```diff
datasource db {
-  provider = "sqlite"  // 开发环境使用 SQLite，生产可切换为 postgresql
+  provider = "mysql"
   url      = env("DATABASE_URL")
}
```

### 2. 更新环境变量配置

**文件**：`backend/.env.example`

**变更内容**：
```diff
-# 数据库
-DATABASE_URL="file:./dev.db"
-# DATABASE_URL="postgresql://user:password@localhost:5432/letaicode"
+# 数据库（MySQL）
+DATABASE_URL="mysql://root:password@localhost:3306/letaicode"
+# 说明：
+# - root: MySQL用户名
+# - password: MySQL密码
+# - localhost: 数据库地址
+# - 3306: MySQL端口
+# - letaicode: 数据库名
```

### 3. 安装依赖

已安装的包：
- `@prisma/client`: ^5.22.0
- `prisma`: ^5.22.0
- MySQL 相关依赖已自动处理

### 4. 生成 Prisma Client

```bash
npx prisma generate
```

✅ Prisma Client 已成功生成并支持 MySQL

---

## 📋 后续操作步骤

### 用户需要完成的操作：

1. **安装 MySQL 数据库**（如果尚未安装）
   - 参考：`MYSQL_SETUP_GUIDE.md` 第一步

2. **创建数据库**
   ```sql
   CREATE DATABASE letaicode CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **配置环境变量**
   ```bash
   cd backend
   cp .env.example .env
   # 编辑 .env 文件，修改 DATABASE_URL 为您的 MySQL 连接信息
   ```

4. **运行数据库迁移**

   **选项 A：使用 db push（推荐用于开发环境）**
   ```bash
   npx prisma db push
   ```

   **选项 B：使用迁移（推荐用于生产环境）**
   ```bash
   npx prisma migrate dev --name init
   ```

5. **初始化数据**（可选）
   - 创建管理员账户
   - 创建默认套餐
   - 参考：`MYSQL_SETUP_GUIDE.md` 第五步

6. **启动服务**
   ```bash
   npm run dev
   ```

---

## 🔄 数据迁移（从 SQLite 到 MySQL）

如果您之前使用 SQLite 并有现有数据需要迁移：

### 方法 1：使用 Prisma Studio（小数据量）

1. 连接 SQLite 数据库
   ```bash
   # 临时改回 SQLite
   DATABASE_URL="file:./dev.db" npx prisma studio
   ```

2. 导出数据（手动复制）

3. 连接 MySQL 数据库
   ```bash
   DATABASE_URL="mysql://root:password@localhost:3306/letaicode" npx prisma studio
   ```

4. 导入数据（手动粘贴）

### 方法 2：使用脚本迁移（大数据量）

创建迁移脚本 `migrate-to-mysql.ts`：

```typescript
import { PrismaClient as SQLiteClient } from '@prisma/client';
import { PrismaClient as MySQLClient } from '@prisma/client';

const sqlite = new SQLiteClient({
  datasources: {
    db: {
      url: 'file:./dev.db',
    },
  },
});

const mysql = new MySQLClient({
  datasources: {
    db: {
      url: 'mysql://root:password@localhost:3306/letaicode',
    },
  },
});

async function migrate() {
  console.log('开始迁移数据...');

  // 迁移用户
  const users = await sqlite.user.findMany();
  for (const user of users) {
    await mysql.user.create({ data: user });
  }
  console.log(`迁移了 ${users.length} 个用户`);

  // 迁移套餐
  const packages = await sqlite.packagePlan.findMany();
  for (const pkg of packages) {
    await mysql.packagePlan.create({ data: pkg });
  }
  console.log(`迁移了 ${packages.length} 个套餐`);

  // 迁移其他表...
  // ...

  console.log('迁移完成！');
}

migrate()
  .catch(console.error)
  .finally(async () => {
    await sqlite.$disconnect();
    await mysql.$disconnect();
  });
```

---

## 📊 数据库架构

迁移后的 MySQL 数据库包含以下表：

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| `users` | 用户表 | id, email, name, role, status |
| `email_codes` | 邮箱验证码 | id, email, code, expiresAt |
| `api_keys` | API密钥 | id, userId, label, fullValue, status |
| `usage_records` | 使用记录 | id, apiKeyId, model, tokens, creditCost |
| `credit_transactions` | 积分交易 | id, userId, type, amount, balance |
| `package_plans` | 套餐计划 | id, name, price, creditAmount |
| `payment_orders` | 支付订单 | id, orderNo, userId, packageId, status |
| `sessions` | 会话 | id, userId, refreshToken, expiresAt |
| `options` | 系统配置 | key, value, desc |

---

## 🔍 验证迁移结果

### 1. 检查表结构

```bash
npx prisma db pull
```

### 2. 查看数据库内容

```bash
npx prisma studio
```

### 3. 测试 API 连接

```bash
# 启动后端
npm run dev

# 测试健康检查
curl http://localhost:4000/api/health
```

**预期响应**：
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-12-14T..."
}
```

---

## 🆚 SQLite vs MySQL 差异

### 1. 数据类型映射

| Prisma 类型 | SQLite | MySQL |
|-------------|--------|-------|
| String | TEXT | VARCHAR(191) |
| Int | INTEGER | INT |
| DateTime | TEXT | DATETIME(3) |
| Boolean | INTEGER | TINYINT(1) |
| BigInt | INTEGER | BIGINT |

### 2. UUID 处理

- **SQLite**: 存储为 TEXT
- **MySQL**: 存储为 VARCHAR(36) 或 BINARY(16)

当前使用 `@default(uuid())` 在应用层生成 UUID。

### 3. 索引差异

MySQL 对索引长度有限制：
- VARCHAR 索引最大长度：191 字符（utf8mb4）
- 长文本字段建议使用全文索引（FULLTEXT）

### 4. 性能差异

| 特性 | SQLite | MySQL |
|------|--------|-------|
| 并发写入 | ❌ 单线程 | ✅ 多线程 |
| 连接数 | 1 | 数百/数千 |
| 数据量 | < 1GB | TB 级别 |
| 事务隔离 | 简单 | 完整 ACID |
| 复制 | ❌ | ✅ 主从/集群 |

---

## ⚠️ 注意事项

### 1. 连接字符串格式

确保 DATABASE_URL 格式正确：
```
mysql://[用户名]:[密码]@[主机]:[端口]/[数据库]?[参数]
```

常用参数：
- `connection_limit=10`: 连接池大小
- `pool_timeout=10`: 连接超时时间
- `sslmode=require`: 强制 SSL 连接

### 2. 字符集

**必须使用 utf8mb4**，而不是 utf8：
- utf8mb4 支持完整 Unicode（包括 emoji）
- utf8 仅支持基本多文种平面（BMP）

### 3. 时区处理

MySQL 默认使用服务器时区，建议：
```sql
SET time_zone = '+00:00';  -- 使用 UTC
```

或在连接字符串中指定：
```
DATABASE_URL="mysql://root:password@localhost:3306/letaicode?timezone=UTC"
```

### 4. 大小写敏感

- Linux 下表名大小写敏感
- Windows/Mac 下不敏感
- 建议统一使用小写表名

---

## 🚀 性能优化

### 1. 连接池配置

```typescript
// backend/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'error', 'warn'],
});

// 设置连接池
prisma.$connect();

export default prisma;
```

### 2. 查询优化

- 使用 `select` 仅查询需要的字段
- 使用 `include` 谨慎加载关联数据
- 添加适当的 `@@index` 索引

### 3. 批量操作

使用事务和批量操作：
```typescript
await prisma.$transaction([
  prisma.user.createMany({ data: users }),
  prisma.apiKey.createMany({ data: apiKeys }),
]);
```

---

## 📚 相关文档

1. **MYSQL_SETUP_GUIDE.md** - MySQL 安装和配置详细指南
2. **backend/prisma/schema.prisma** - 数据库架构定义
3. **backend/.env.example** - 环境变量配置示例

---

## 🎯 迁移检查清单

- [x] 更新 Prisma schema provider 为 "mysql"
- [x] 更新 .env.example 配置文件
- [x] 安装必要的 npm 依赖
- [x] 生成 MySQL 版本的 Prisma Client
- [x] 创建 MySQL 设置指南文档
- [ ] 用户安装 MySQL 数据库
- [ ] 用户创建 letaicode 数据库
- [ ] 用户配置 .env 文件
- [ ] 用户运行数据库迁移
- [ ] 用户初始化种子数据
- [ ] 用户测试应用连接

---

## 💡 常见问题

### Q1: 迁移后原有 SQLite 数据会丢失吗？

A: 不会。原有的 `dev.db` 文件仍然保留，只是不再使用。如需迁移数据，参考上文"数据迁移"部分。

### Q2: 可以同时支持 SQLite 和 MySQL 吗？

A: 不能在同一时间，但可以通过环境变量切换：
```bash
# 开发用 SQLite
DATABASE_URL="file:./dev.db" npm run dev

# 生产用 MySQL
DATABASE_URL="mysql://..." npm run start
```

### Q3: 迁移后需要修改代码吗？

A: 不需要。Prisma 抽象了数据库差异，应用代码无需修改。

### Q4: MySQL 8.0 的认证插件问题？

A: MySQL 8.0 默认使用 `caching_sha2_password`，如遇到问题：
```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';
FLUSH PRIVILEGES;
```

---

**迁移日期**：2024年12月14日
**版本**：MySQL 5.7+ / 8.0+
**状态**：✅ Schema 迁移完成，等待用户配置数据库
**作者**：Claude (Anthropic)
