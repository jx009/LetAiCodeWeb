# Migration Files Note

## ⚠️ 重要说明

当前目录下的迁移文件是为 **SQLite** 数据库创建的，不适用于 **MySQL**。

### 已有迁移文件（SQLite）

- `20241214210600_add_user_roles_and_options/` - SQLite 语法
- `20251214212200_add_user_roles_and_options/` - SQLite 语法

这些文件包含 SQLite 特定的语法（如 `DATETIME`、双引号表名等），**不能直接用于 MySQL**。

---

## 🔄 MySQL 迁移方式

### 方式 1：使用 `prisma db push`（推荐用于开发）

这是最简单的方式，会直接将 schema 推送到数据库：

```bash
npx prisma db push
```

**优点**：
- 不创建迁移文件
- 直接同步 schema 到数据库
- 适合开发环境快速迭代

**缺点**：
- 没有迁移历史记录
- 不适合生产环境

### 方式 2：重新创建迁移（推荐用于生产）

如果需要迁移历史记录，可以重置并重新创建：

```bash
# 1. 删除旧的迁移记录（可选，如果数据库是新建的）
rm -rf prisma/migrations

# 2. 创建新的初始迁移（MySQL 版本）
npx prisma migrate dev --name init
```

这会生成 **MySQL 语法** 的迁移文件。

---

## 🆚 SQLite vs MySQL 迁移语法差异

### SQLite 语法（旧迁移文件）

```sql
-- SQLite 使用双引号
ALTER TABLE "users" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'USER';

-- SQLite 使用 DATETIME
"updatedAt" DATETIME NOT NULL

-- SQLite 使用 datetime('now')
datetime('now')
```

### MySQL 语法（新迁移文件）

```sql
-- MySQL 使用反引号或不用引号
ALTER TABLE `users` ADD COLUMN `role` VARCHAR(191) NOT NULL DEFAULT 'USER';

-- MySQL 使用 DATETIME(3)（毫秒精度）
`updatedAt` DATETIME(3) NOT NULL

-- MySQL 使用 NOW()
NOW()
```

---

## 📋 推荐操作

### 场景 1：新项目（无现有数据）

**推荐使用 `db push`**：
```bash
npx prisma db push
```

### 场景 2：需要版本控制和团队协作

**推荐重新创建迁移**：
```bash
# 备份旧迁移（如果需要参考）
mv prisma/migrations prisma/migrations.sqlite.backup

# 创建 MySQL 迁移
npx prisma migrate dev --name init
```

### 场景 3：从 SQLite 迁移数据到 MySQL

1. 使用 `db push` 创建 MySQL 表结构
2. 使用数据迁移脚本迁移数据
3. 稍后根据需要创建迁移历史

---

## ✅ 当前建议

由于项目已从 SQLite 切换到 MySQL，建议：

1. **忽略现有的 SQLite 迁移文件**
2. **使用 `npx prisma db push`** 快速创建表结构
3. 如需迁移历史，之后可以运行 `npx prisma migrate dev --name init`

---

**创建日期**：2024年12月14日
**状态**：SQLite 迁移文件已过时，等待用户执行 MySQL 迁移
