/**
 * 积分配置
 */
export const creditConfig = {
  // 每1000 tokens 换算的积分数量
  tokenRatio: parseInt(process.env.CREDIT_TOKEN_RATIO || '1'),

  // 新用户免费积分额度
  freeQuota: parseInt(process.env.CREDIT_FREE_QUOTA || '10000'),
};
