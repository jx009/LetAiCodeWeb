# LetAiCode Docker 部署指南

## 📋 快速开始

### 前提条件
- Docker (20.10+)
- Docker Compose (2.0+)

### 第一步：配置 GitHub Secrets

1. 访问 [Docker Hub](https://hub.docker.com) 创建 Access Token
2. 在 GitHub 仓库设置中添加 Secrets：
   - `DOCKER_USERNAME` = `jxthdy`
   - `DOCKER_PASSWORD` = 你的 Docker Hub Access Token

### 第二步：推送代码触发构建

```bash
git add .
git commit -m "Add Docker configuration"
git push origin master
```

GitHub Actions 会自动构建并推送两个镜像：
- `jxthdy/letaicode-backend:latest`
- `jxthdy/letaicode-frontend:latest`

### 第三步：在服务器上部署

```bash
# 1. 克隆仓库
git clone https://github.com/your-username/LetAiCodeWeb.git
cd LetAiCodeWeb

# 2. 创建配置文件
cp .env.example .env

# 3. 编辑配置文件，修改所有密码
vim .env

# 4. 启动服务
docker-compose up -d

# 5. 查看日志
docker-compose logs -f

# 6. 查看状态
docker-compose ps
```

### 访问服务

- 前端：http://localhost
- 后端 API：http://localhost:4000
- MySQL：localhost:3306
- Redis：localhost:6379

## 📝 常用命令

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f

# 只查看后端日志
docker-compose logs -f backend

# 更新到最新版本
docker-compose pull
docker-compose up -d

# 进入容器
docker exec -it letaicode-backend sh
docker exec -it letaicode-frontend sh
```

## 🔧 配置说明

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `MYSQL_ROOT_PASSWORD` | MySQL root 密码 | - |
| `MYSQL_DATABASE` | 数据库名 | letaicode |
| `MYSQL_USER` | 数据库用户 | letaicode |
| `MYSQL_PASSWORD` | 数据库密码 | - |
| `REDIS_PASSWORD` | Redis 密码 | - |
| `JWT_SECRET` | JWT 密钥 | - |
| `JWT_REFRESH_SECRET` | Refresh Token 密钥 | - |

### 端口映射

| 服务 | 容器端口 | 主机端口 |
|------|---------|---------|
| Frontend | 80 | 80 |
| Backend | 4000 | 4000 |
| MySQL | 3306 | 3306 |
| Redis | 6379 | 6379 |

## 🔒 安全建议

1. 修改 `.env` 中的所有默认密码
2. 使用强密码（至少 32 字符）
3. 不要将 `.env` 提交到 Git
4. 使用防火墙限制端口访问
5. 生成强密码：`openssl rand -base64 32`

## 🐛 故障排查

### 后端无法连接数据库

检查：
1. MySQL 容器是否正常运行：`docker-compose ps`
2. 数据库配置是否正确：`cat .env`
3. 查看后端日志：`docker-compose logs backend`

### 前端无法访问后端

检查：
1. 后端是否正常运行：`curl http://localhost:4000/api/health`
2. nginx 配置是否正确
3. 网络配置是否正确

## 📊 健康检查

所有服务都配置了健康检查：

```bash
# 查看所有容器健康状态
docker ps

# 查看特定容器健康状态
docker inspect --format='{{.State.Health.Status}}' letaicode-backend
```

## 🔄 更新部署

```bash
# 拉取最新镜像
docker-compose pull

# 重启服务
docker-compose up -d

# 查看日志确认
docker-compose logs -f
```

## 💾 数据备份

```bash
# 备份 MySQL
docker exec letaicode-mysql mysqldump -u root -p letaicode > backup.sql

# 备份 Redis
docker exec letaicode-redis redis-cli --rdb /data/dump.rdb
docker cp letaicode-redis:/data/dump.rdb ./backup/

# 恢复 MySQL
docker exec -i letaicode-mysql mysql -u root -p letaicode < backup.sql
```
