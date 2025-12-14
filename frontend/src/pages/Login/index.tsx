/**
 * 登录页面
 * 完全复刻 MiniMAXI 登录页面设计
 */
import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import authAPI from '@/api/auth';
import './styles.less';

interface LoginFormValues {
  email: string;
  code: string;
  agree: boolean;
}

const Login: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  /**
   * 发送验证码
   */
  const handleSendCode = async () => {
    try {
      const email = form.getFieldValue('email');
      if (!email) {
        message.error('请输入邮箱地址');
        return;
      }

      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        message.error('请输入有效的邮箱地址');
        return;
      }

      setSendingCode(true);
      await authAPI.sendEmailCode(email);
      message.success('验证码已发送，请查收邮件');

      // 开始倒计时
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      message.error(error.message || '发送验证码失败');
    } finally {
      setSendingCode(false);
    }
  };

  /**
   * 提交登录表单
   */
  const handleSubmit = async (values: LoginFormValues) => {
    try {
      if (!values.agree) {
        message.error('请同意用户协议和隐私政策');
        return;
      }

      setLoading(true);
      const response = await authAPI.login(values.email, values.code);

      // 保存登录状态
      if (response.data) {
        setAuth(response.data.user, response.data.token);
      }
      message.success('登录成功');

      // 跳转到首页
      navigate('/coding-plan');
    } catch (error: any) {
      message.error(error.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Logo */}
        <div className="login-logo">
          <span className="logo-text">LetAiCode</span>
        </div>

        {/* 标题 */}
        <div className="login-title">
          <h1>欢迎使用 LetAiCode</h1>
          <p className="login-subtitle">使用邮箱验证码登录</p>
        </div>

        {/* 登录表单 */}
        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          autoComplete="off"
          className="login-form"
        >
          {/* 邮箱输入 */}
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input
              size="large"
              placeholder="请输入邮箱地址"
              className="login-input"
            />
          </Form.Item>

          {/* 验证码输入 */}
          <Form.Item
            name="code"
            rules={[{ required: true, message: '请输入验证码' }]}
          >
            <div className="code-input-wrapper">
              <Input
                size="large"
                placeholder="请输入6位验证码"
                maxLength={6}
                className="login-input code-input"
              />
              <Button
                type="default"
                className="send-code-btn"
                onClick={handleSendCode}
                disabled={countdown > 0 || sendingCode}
                loading={sendingCode}
              >
                {countdown > 0 ? `${countdown}s后重新发送` : '发送验证码'}
              </Button>
            </div>
          </Form.Item>

          {/* 用户协议 */}
          <Form.Item name="agree" valuePropName="checked">
            <Checkbox className="login-checkbox">
              我已阅读并同意
              <a href="/terms" target="_blank" rel="noopener noreferrer">
                《用户协议》
              </a>
              和
              <a href="/privacy" target="_blank" rel="noopener noreferrer">
                《隐私政策》
              </a>
            </Checkbox>
          </Form.Item>

          {/* 登录按钮 */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              className="login-button"
              block
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        {/* 页脚提示 */}
        <div className="login-footer">
          <p>登录即表示您同意我们的服务条款和隐私政策</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
