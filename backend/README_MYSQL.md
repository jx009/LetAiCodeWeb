# MySQL 数据库快速开始指南

> 5 分钟完成 MySQL 数据库配置

---

## 🚀 快速开始（5 步）

### 1️⃣ 安装 MySQL

**已安装？跳过此步。**

```bash
# macOS
brew install mysql && brew services start mysql

# Ubuntu/Debian
sudo apt install mysql-server && sudo systemctl start mysql

# Windows
# 下载安装：https://dev.mysql.com/downloads/mysql/
```

---

### 2️⃣ 创建数据库

```bash
mysql -u root -p
```

输入密码后，执行：

```sql
CREATE DATABASE letaicode CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

---

### 3️⃣ 配置连接

```bash
# 复制配置文件
cp .env.example .env

# 编辑 .env 文件
# 修改 DATABASE_URL 为：
DATABASE_URL="mysql://root:你的密码@localhost:3306/letaicode"
```

---

### 4️⃣ 初始化数据库

```bash
# 推送表结构到数据库
npx prisma db push

# 查看结果
npx prisma studio
```

---

### 5️⃣ 测试 & 启动

```bash
# 测试连接
node test-mysql-connection.js

# 启动服务
npm run dev
```

✅ **完成！** 访问 http://localhost:4000

---

## 📊 初始化数据（可选）

### 创建管理员账户

```sql
mysql -u root -p letaicode

INSERT INTO users (id, email, name, role, status, createdAt, updatedAt)
VALUES (UUID(), 'admin@letaicode.com', '超级管理员', 'ROOT', 1, NOW(), NOW());
```

### 创建套餐

```sql
INSERT INTO package_plans (id, name, price, creditAmount, bonusCredit, `desc`, sortOrder, active, createdAt, updatedAt)
VALUES
  (UUID(), '基础套餐', '10.00', 100000, 10000, '适合轻度使用', 1, true, NOW(), NOW()),
  (UUID(), '标准套餐', '30.00', 350000, 50000, '推荐套餐', 2, true, NOW(), NOW()),
  (UUID(), '专业套餐', '50.00', 600000, 100000, '高频使用', 3, true, NOW(), NOW()),
  (UUID(), '企业套餐', '100.00', 1300000, 300000, '企业级方案', 4, true, NOW(), NOW());
```

---

## 🔧 常用命令

```bash
# 查看 Prisma 客户端
npx prisma generate

# 推送 schema 变更
npx prisma db push

# 打开数据库管理界面
npx prisma studio

# 查看数据库状态
npx prisma db pull

# 测试连接
node test-mysql-connection.js

# 启动开发服务器
npm run dev
```

---

## ❓ 遇到问题？

### 连接被拒绝

```bash
# 检查 MySQL 是否运行
# macOS/Linux
sudo systemctl status mysql

# Windows
net start mysql
```

### 数据库不存在

```sql
CREATE DATABASE letaicode CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 密码错误

确保 `.env` 中的密码正确：
```
DATABASE_URL="mysql://root:正确的密码@localhost:3306/letaicode"
```

### 表不存在

```bash
npx prisma db push
```

---

## 📚 详细文档

- **MYSQL_SETUP_GUIDE.md** - 完整安装配置指南
- **MYSQL_MIGRATION_SUMMARY.md** - 迁移技术细节
- **DATABASE_MIGRATION_COMPLETED.md** - 迁移完成报告
- **test-mysql-connection.js** - 连接测试脚本

---

## 🎯 验证成功

运行测试脚本，看到以下输出表示成功：

```
🎉 所有测试通过！MySQL 配置正确！
```

---

**需要帮助？** 查看详细文档或运行 `node test-mysql-connection.js` 获取诊断信息。
