# 🚀 LetAiCode 快速启动指南

## ⚡ 5 分钟快速开始

### 第 1 步：启动 Redis（必须）

```bash
# Windows (WSL2)
sudo service redis-server start

# 验证 Redis 是否启动
redis-cli ping
# 应该返回：PONG
```

### 第 2 步：配置邮件服务

编辑后端环境变量文件：

```bash
cd /mnt/c/jxProject/LetAiCodeWeb/backend
```

创建或编辑 `.env` 文件，添加邮件配置：

```env
# 使用 Gmail 示例
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password  # 不是你的 Gmail 密码！
EMAIL_FROM="LetAiCode <your-email@gmail.com>"
```

**如何获取 Gmail 应用密码：**
1. 开启两步验证：https://myaccount.google.com/security
2. 生成应用密码：https://myaccount.google.com/apppasswords
3. 复制密码到 `EMAIL_PASS`

### 第 3 步：安装依赖和初始化数据库

```bash
# 后端
cd /mnt/c/jxProject/LetAiCodeWeb/backend
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed

# 前端
cd /mnt/c/jxProject/LetAiCodeWeb/frontend
pnpm install
```

### 第 4 步：启动服务

**打开两个终端：**

**终端 1 - 后端：**
```bash
cd /mnt/c/jxProject/LetAiCodeWeb/backend
pnpm dev
```

**终端 2 - 前端：**
```bash
cd /mnt/c/jxProject/LetAiCodeWeb/frontend
pnpm dev
```

### 第 5 步：测试登录

1. 打开浏览器：http://localhost:5173
2. 输入你的邮箱地址
3. 点击"发送验证码"
4. 检查邮箱，复制验证码
5. 输入验证码，勾选用户协议
6. 点击"登录"按钮
7. 登录成功！🎉

---

## ✅ 检查清单

在启动之前，请确认：

- [ ] Redis 已启动（`redis-cli ping` 返回 PONG）
- [ ] 邮件服务已配置（Gmail 应用密码或其他 SMTP）
- [ ] 后端依赖已安装（`pnpm install`）
- [ ] 前端依赖已安装（`pnpm install`）
- [ ] 数据库已初始化（`pnpm prisma:migrate`）
- [ ] 后端已启动（http://localhost:4000）
- [ ] 前端已启动（http://localhost:5173）

---

## 🐛 常见问题

### 问题 1：Redis 连接失败
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**解决方案：**
```bash
sudo service redis-server start
redis-cli ping  # 验证
```

### 问题 2：邮件发送失败
```
Error: Invalid login
```

**解决方案：**
- 确认使用的是 Gmail 应用密码，不是账户密码
- 生成新的应用密码：https://myaccount.google.com/apppasswords

### 问题 3：端口被占用
```
Error: listen EADDRINUSE: address already in use :::4000
```

**解决方案：**
```bash
# 查找占用端口的进程
lsof -i :4000
# 或
netstat -tuln | grep 4000

# 杀死进程
kill -9 <PID>
```

### 问题 4：Prisma Client 未生成
```
Error: @prisma/client did not initialize yet
```

**解决方案：**
```bash
cd /mnt/c/jxProject/LetAiCodeWeb/backend
pnpm prisma:generate
```

---

## 📖 完整文档

- **详细开发方案**: [DETAILED_DEVELOPMENT_PLAN.md](./DETAILED_DEVELOPMENT_PLAN.md)
- **阶段 2 完成报告**: [PHASE2_COMPLETION.md](./PHASE2_COMPLETION.md)
- **项目 README**: [README.md](./README.md)

---

## 🎯 下一步

登录成功后，你可以：
- 查看套餐页面（Coding Plan）
- 探索其他功能（开发中）
- 继续开发下一个模块

准备好继续开发了吗？ 🚀
