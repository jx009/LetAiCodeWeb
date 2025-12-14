/**
 * 格式化工具函数
 */
import dayjs from 'dayjs';
import { DATE_FORMATS } from './constants';

/**
 * 格式化日期
 */
export const formatDate = (date: string | Date, format: string = DATE_FORMATS.DATETIME) => {
  if (!date) return '-';
  return dayjs(date).format(format);
};

/**
 * 格式化相对时间
 */
export const formatRelativeTime = (date: string | Date) => {
  if (!date) return '-';
  const now = dayjs();
  const target = dayjs(date);
  const diff = now.diff(target, 'second');

  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} 天前`;
  return formatDate(date, DATE_FORMATS.DATE);
};

/**
 * 格式化数字（千分位）
 */
export const formatNumber = (num: number | string, decimals: number = 0) => {
  if (num === null || num === undefined) return '-';
  const number = typeof num === 'string' ? parseFloat(num) : num;
  return number.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * 格式化金额（保留两位小数）
 */
export const formatMoney = (amount: number | string) => {
  if (amount === null || amount === undefined) return '¥0.00';
  const number = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `¥${formatNumber(number, 2)}`;
};

/**
 * 格式化积分
 */
export const formatCredit = (credit: number) => {
  if (credit === null || credit === undefined) return '0';
  return formatNumber(credit);
};

/**
 * 格式化 Token 数量
 */
export const formatTokens = (tokens: number) => {
  if (tokens === null || tokens === undefined) return '0';
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
  return formatNumber(tokens);
};

/**
 * 脱敏邮箱
 */
export const maskEmail = (email: string) => {
  if (!email) return '';
  const [name, domain] = email.split('@');
  if (name.length <= 2) return email;
  return `${name.slice(0, 2)}***@${domain}`;
};

/**
 * 脱敏手机号
 */
export const maskPhone = (phone: string) => {
  if (!phone) return '';
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

/**
 * 复制到剪贴板
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      textArea.remove();
      return success;
    }
  } catch (error) {
    console.error('复制失败:', error);
    return false;
  }
};

/**
 * 下载文件
 */
export const downloadFile = (url: string, filename: string) => {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

/**
 * 生成随机颜色
 */
export const randomColor = () => {
  return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
};

/**
 * 截取字符串
 */
export const truncate = (str: string, length: number) => {
  if (!str) return '';
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
};
