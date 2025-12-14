/**
 * Prisma 数据填充脚本
 * 初始化基础数据（套餐计划等）
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始填充数据...');

  // 创建套餐计划
  const plans = [
    {
      name: '入门套餐',
      price: '49.00',
      creditAmount: 50000,
      bonusCredit: 5000,
      desc: '适合个人开发者，体验 AI 编程助手',
      sortOrder: 1,
      active: true,
    },
    {
      name: '标准套餐',
      price: '99.00',
      creditAmount: 110000,
      bonusCredit: 11000,
      desc: '适合小团队，充足的积分配额',
      sortOrder: 2,
      active: true,
    },
    {
      name: '专业套餐',
      price: '199.00',
      creditAmount: 250000,
      bonusCredit: 25000,
      desc: '适合专业开发者，高频使用',
      sortOrder: 3,
      active: true,
    },
    {
      name: '企业套餐',
      price: '499.00',
      creditAmount: 700000,
      bonusCredit: 70000,
      desc: '适合企业团队，无限制使用',
      sortOrder: 4,
      active: true,
    },
  ];

  for (const plan of plans) {
    await prisma.packagePlan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
  }

  console.log('套餐计划创建完成');

  // 创建系统配置
  const configs = [
    {
      key: 'CREDIT_TOKEN_RATIO',
      value: '1',
      desc: '每1000 tokens 换算的积分数量',
    },
    {
      key: 'CREDIT_FREE_QUOTA',
      value: '10000',
      desc: '新用户免费积分额度',
    },
    {
      key: 'VERIFICATION_CODE_EXPIRES',
      value: '300',
      desc: '验证码有效期（秒）',
    },
  ];

  for (const config of configs) {
    await prisma.config.upsert({
      where: { key: config.key },
      update: { value: config.value, desc: config.desc },
      create: config,
    });
  }

  console.log('系统配置创建完成');
  console.log('数据填充完成！');
}

main()
  .catch((e) => {
    console.error('数据填充失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
