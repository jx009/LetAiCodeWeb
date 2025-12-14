/**
 * MySQL 连接测试脚本
 * 用于验证 Prisma + MySQL 配置是否正确
 *
 * 使用方法：
 * 1. 确保已安装 MySQL 并创建了 letaicode 数据库
 * 2. 配置好 .env 文件中的 DATABASE_URL
 * 3. 运行：node test-mysql-connection.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  console.log('🔍 开始测试 MySQL 连接...\n');

  try {
    // 测试 1：连接数据库
    console.log('📌 测试 1: 连接数据库');
    await prisma.$connect();
    console.log('✅ 数据库连接成功\n');

    // 测试 2：查询数据库版本
    console.log('📌 测试 2: 查询数据库信息');
    const result = await prisma.$queryRaw`SELECT VERSION() as version`;
    console.log('✅ MySQL 版本:', result[0].version);
    console.log('✅ 数据库查询正常\n');

    // 测试 3：检查表是否存在
    console.log('📌 测试 3: 检查数据库表');
    const tables = await prisma.$queryRaw`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
    `;

    if (tables.length === 0) {
      console.log('⚠️  警告: 数据库中没有表');
      console.log('💡 提示: 请运行 "npx prisma db push" 或 "npx prisma migrate dev"\n');
    } else {
      console.log(`✅ 找到 ${tables.length} 个表:`);
      tables.forEach((table) => {
        console.log(`   - ${table.TABLE_NAME}`);
      });
      console.log('');
    }

    // 测试 4：测试 Prisma 模型
    console.log('📌 测试 4: 测试 Prisma 模型');
    const userCount = await prisma.user.count();
    console.log(`✅ 用户表查询成功，当前用户数: ${userCount}\n`);

    const packageCount = await prisma.packagePlan.count();
    console.log(`✅ 套餐表查询成功，当前套餐数: ${packageCount}\n`);

    // 测试 5：测试事务
    console.log('📌 测试 5: 测试事务功能');
    await prisma.$transaction(async (tx) => {
      const users = await tx.user.findMany({ take: 1 });
      console.log('✅ 事务查询成功\n');
    });

    // 所有测试通过
    console.log('🎉 所有测试通过！MySQL 配置正确！\n');
    console.log('📋 下一步操作：');
    console.log('   1. 如果数据库为空，运行初始化脚本');
    console.log('   2. 启动后端服务: npm run dev');
    console.log('   3. 访问 Prisma Studio: npx prisma studio\n');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('\n🔧 排查建议：');

    if (error.message.includes('Unknown database')) {
      console.error('   1. 数据库不存在，请创建数据库:');
      console.error('      CREATE DATABASE letaicode CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
    } else if (error.message.includes('Access denied')) {
      console.error('   1. 检查 .env 文件中的 DATABASE_URL');
      console.error('   2. 确认 MySQL 用户名和密码正确');
      console.error('   3. 确认用户有访问数据库的权限');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('   1. 检查 MySQL 服务是否启动');
      console.error('   2. 检查端口 3306 是否正确');
      console.error('   3. 检查防火墙设置');
    } else if (error.message.includes('relation') || error.message.includes('table')) {
      console.error('   1. 数据库表不存在，请运行迁移:');
      console.error('      npx prisma db push');
      console.error('      或');
      console.error('      npx prisma migrate dev --name init');
    } else {
      console.error('   1. 查看完整错误信息');
      console.error('   2. 参考 MYSQL_SETUP_GUIDE.md');
      console.error('   3. 检查 DATABASE_URL 格式是否正确');
    }
    console.error('\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行测试
testConnection();
