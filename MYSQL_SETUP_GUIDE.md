# MySQL 数据库配置指南

> 本指南帮助您将 LetAiCode 项目从 SQLite 迁移到 MySQL

---

## 📋 前置要求

- MySQL 5.7+ 或 MySQL 8.0+
- Node.js 18+
- npm 或 pnpm

---

## 🔧 第一步：安装 MySQL

### Windows 用户

1. **下载 MySQL 安装包**
   - 访问：https://dev.mysql.com/downloads/mysql/
   - 选择 Windows 版本下载

2. **安装 MySQL**
   - 运行安装程序
   - 选择 "Developer Default" 或 "Server only"
   - 设置 root 密码（记住此密码，后续需要使用）
   - 默认端口：3306

3. **验证安装**
   ```bash
   mysql --version
   ```

### macOS 用户

使用 Homebrew 安装：
```bash
brew install mysql
brew services start mysql
mysql_secure_installation
```

### Linux 用户

Ubuntu/Debian:
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo mysql_secure_installation
```

CentOS/RHEL:
```bash
sudo yum install mysql-server
sudo systemctl start mysqld
sudo mysql_secure_installation
```

---

## 🗄️ 第二步：创建数据库

### 方法 1：使用命令行

```bash
# 登录 MySQL
mysql -u root -p

# 输入密码后，执行以下 SQL
CREATE DATABASE letaicode CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建专用用户（可选，推荐）
CREATE USER 'letaicode'@'localhost' IDENTIFIED BY 'your_password_here';
GRANT ALL PRIVILEGES ON letaicode.* TO 'letaicode'@'localhost';
FLUSH PRIVILEGES;

# 退出
EXIT;
```

### 方法 2：使用 MySQL Workbench

1. 打开 MySQL Workbench
2. 连接到本地 MySQL 实例
3. 点击 "Create Schema"
4. 输入数据库名：`letaicode`
5. 字符集选择：`utf8mb4`
6. 排序规则：`utf8mb4_unicode_ci`
7. 点击 Apply

---

## ⚙️ 第三步：配置项目

### 1. 复制环境变量文件

```bash
cd /mnt/c/jxProject/LetAiCodeWeb/backend
cp .env.example .env
```

### 2. 修改 .env 文件

打开 `.env` 文件，修改 `DATABASE_URL`：

**如果使用 root 用户：**
```bash
DATABASE_URL="mysql://root:your_password@localhost:3306/letaicode"
```

**如果创建了专用用户：**
```bash
DATABASE_URL="mysql://letaicode:your_password@localhost:3306/letaicode"
```

**连接字符串格式说明：**
```
mysql://[用户名]:[密码]@[主机地址]:[端口]/[数据库名]
```

### 3. 配置参数说明

| 参数 | 说明 | 示例 |
|------|------|------|
| 用户名 | MySQL 用户 | root 或 letaicode |
| 密码 | MySQL 密码 | 您设置的密码 |
| 主机地址 | 数据库服务器地址 | localhost 或 127.0.0.1 |
| 端口 | MySQL 端口 | 3306（默认） |
| 数据库名 | 数据库名称 | letaicode |

---

## 🔄 第四步：运行数据库迁移

### 1. 生成 Prisma Client

```bash
cd /mnt/c/jxProject/LetAiCodeWeb/backend
npx prisma generate
```

### 2. 推送数据库架构

**方式 A：使用 prisma db push（开发环境推荐）**
```bash
npx prisma db push
```

**方式 B：使用迁移（生产环境推荐）**
```bash
# 创建初始迁移
npx prisma migrate dev --name init

# 如果已有迁移文件，直接应用
npx prisma migrate deploy
```

### 3. 验证数据库表

```bash
# 使用 Prisma Studio 查看
npx prisma studio

# 或使用 MySQL 命令行
mysql -u root -p
USE letaicode;
SHOW TABLES;
```

---

## 🌱 第五步：初始化数据（可选）

### 创建超级管理员账户

```bash
# 登录 MySQL
mysql -u root -p

USE letaicode;

# 插入管理员用户（邮箱验证码登录，或后续手动设置）
# 注意：id 使用 UUID 格式
INSERT INTO users (id, email, name, role, status, createdAt, updatedAt)
VALUES (
  UUID(),
  'admin@letaicode.com',
  '超级管理员',
  'ROOT',
  1,
  NOW(),
  NOW()
);
```

### 创建默认套餐

```sql
INSERT INTO package_plans (id, name, price, creditAmount, bonusCredit, `desc`, sortOrder, active, createdAt, updatedAt)
VALUES
  (UUID(), '基础套餐', '10.00', 100000, 10000, '适合轻度使用', 1, true, NOW(), NOW()),
  (UUID(), '标准套餐', '30.00', 350000, 50000, '推荐套餐', 2, true, NOW(), NOW()),
  (UUID(), '专业套餐', '50.00', 600000, 100000, '高频使用', 3, true, NOW(), NOW()),
  (UUID(), '企业套餐', '100.00', 1300000, 300000, '企业级方案', 4, true, NOW(), NOW());
```

---

## ✅ 第六步：测试连接

### 1. 启动后端服务

```bash
cd /mnt/c/jxProject/LetAiCodeWeb/backend
npm run dev
```

### 2. 检查日志

如果看到以下信息，说明连接成功：
```
Server is running on http://localhost:4000
Database connected successfully
```

### 3. 测试 API

```bash
# 测试健康检查接口
curl http://localhost:4000/api/health

# 应返回：
{"status":"ok","database":"connected"}
```

---

## 🔍 常见问题排查

### 问题 1：连接被拒绝

**错误信息：**
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**解决方案：**
1. 检查 MySQL 服务是否启动
   ```bash
   # Windows
   net start mysql

   # Linux/macOS
   sudo systemctl status mysql
   ```

2. 检查防火墙设置
3. 确认端口 3306 未被占用

### 问题 2：认证失败

**错误信息：**
```
Error: Access denied for user 'root'@'localhost'
```

**解决方案：**
1. 确认密码正确
2. 检查用户权限
   ```sql
   SHOW GRANTS FOR 'root'@'localhost';
   ```

### 问题 3：数据库不存在

**错误信息：**
```
Error: Unknown database 'letaicode'
```

**解决方案：**
```sql
CREATE DATABASE letaicode CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 问题 4：字符集问题

**解决方案：**
```sql
ALTER DATABASE letaicode CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 问题 5：Prisma 迁移失败

**错误信息：**
```
Error: P3009 - migrate found failed migrations
```

**解决方案：**
```bash
# 重置迁移历史
npx prisma migrate reset

# 重新创建迁移
npx prisma migrate dev --name init
```

---

## 📊 性能优化建议

### 1. 连接池配置

在 `schema.prisma` 中添加：
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
}
```

在 `.env` 中添加连接池参数：
```bash
DATABASE_URL="mysql://root:password@localhost:3306/letaicode?connection_limit=10&pool_timeout=10"
```

### 2. MySQL 配置优化

编辑 MySQL 配置文件（my.cnf 或 my.ini）：
```ini
[mysqld]
max_connections = 200
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
query_cache_size = 32M
```

### 3. 添加索引（已在 schema 中定义）

Prisma 已自动为以下字段创建索引：
- 用户邮箱（唯一索引）
- API Key 的 userId 和 remoteKeyId
- 使用记录的 apiKeyId 和 timestamp
- 订单的 userId、orderNo

---

## 🔐 安全建议

1. **使用强密码**
   - MySQL root 密码应包含大小写字母、数字、特殊字符
   - 最少 12 位

2. **创建专用用户**
   - 不要在生产环境使用 root 用户
   - 为应用创建专用的 MySQL 用户，仅授予必要权限

3. **限制远程访问**
   ```sql
   -- 仅允许本地连接
   CREATE USER 'letaicode'@'localhost' IDENTIFIED BY 'password';

   -- 如需远程连接，指定特定 IP
   CREATE USER 'letaicode'@'192.168.1.100' IDENTIFIED BY 'password';
   ```

4. **启用 SSL 连接**（生产环境）
   ```bash
   DATABASE_URL="mysql://user:password@localhost:3306/letaicode?sslmode=require"
   ```

---

## 🚀 生产环境部署

### 1. 备份策略

```bash
# 每日自动备份
mysqldump -u root -p letaicode > backup_$(date +%Y%m%d).sql

# 定时任务（crontab）
0 2 * * * mysqldump -u root -p'password' letaicode > /backups/letaicode_$(date +\%Y\%m\%d).sql
```

### 2. 监控

- 使用 MySQL Enterprise Monitor 或 Percona Monitoring
- 监控慢查询日志
- 设置连接数告警

### 3. 高可用

- 主从复制
- MySQL Group Replication
- 使用云服务（AWS RDS、阿里云 RDS）

---

## 📚 参考资料

- [Prisma MySQL 文档](https://www.prisma.io/docs/concepts/database-connectors/mysql)
- [MySQL 官方文档](https://dev.mysql.com/doc/)
- [MySQL 性能优化指南](https://dev.mysql.com/doc/refman/8.0/en/optimization.html)

---

**日期**：2024年12月14日
**作者**：Claude (Anthropic)
**版本**：1.0
