#!/bin/bash

echo "🚀 开始初始化数据库..."

# 1. 启动所有服务
echo "📦 启动Docker服务..."
docker-compose up -d

# 2. 等待MySQL启动
echo "⏳ 等待MySQL启动（30秒）..."
sleep 30

# 3. 检查MySQL是否健康
echo "🔍 检查MySQL状态..."
docker-compose ps mysql

# 4. 运行数据库迁移
echo "📊 运行Prisma迁移..."
docker-compose exec -T backend npx prisma db push

# 5. 验证表是否创建成功
echo "✅ 验证数据库表..."
docker exec -i letaicode-mysql mysql -u LetAiCode -p'Jianxin0520!' LetAiCode -e "SHOW TABLES;"

echo "🎉 数据库初始化完成！"
echo ""
echo "可以访问以下地址："
echo "  前端: http://localhost"
echo "  后端: http://localhost:4000"
echo ""
echo "查看日志: docker-compose logs -f"
