/**
 * 加密/解密工具（用于加密 API Key）
 */
import CryptoJS from 'crypto-js';

const AES_SECRET_KEY = process.env.AES_SECRET_KEY || 'default_aes_key_32_chars_long!!!';

/**
 * AES 加密
 */
export const encrypt = (text: string): string => {
  return CryptoJS.AES.encrypt(text, AES_SECRET_KEY).toString();
};

/**
 * AES 解密
 */
export const decrypt = (encryptedText: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedText, AES_SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

/**
 * 生成随机字符串
 */
export const generateRandomString = (length: number = 32): string => {
  return CryptoJS.lib.WordArray.random(length / 2).toString();
};

/**
 * 生成6位数字验证码
 */
export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
