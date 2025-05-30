import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, message, Divider, Typography, Space } from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined,
  GoogleOutlined,
  GithubOutlined,
  FacebookOutlined 
} from '@ant-design/icons';
import { useLoginMutation } from '../features/auth/api';
import { setCredentials } from '../features/auth/slice';
import { useAppDispatch } from '../store/hooks';

const { Title, Text } = Typography;

const LoginPage = () => {
  const [form] = Form.useForm();
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isHovering, setIsHovering] = useState(false);

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      const userData = await login(values).unwrap();
      dispatch(setCredentials(userData));
      message.success('登录成功');
      navigate('/');
    } catch (err) {
      message.error('登录失败，请检查邮箱和密码');
    }
  };

  const socialLoginStyles = {
    width: '100%',
    marginBottom: 12,
    transition: 'all 0.3s',
    transform: isHovering ? 'scale(1.02)' : 'scale(1)'
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      <Card 
        title={
          <Title level={3} style={{ textAlign: 'center', marginBottom: 0 }}>
            欢迎登录
          </Title>
        }
        style={{ 
          width: 420,
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}
        bordered={false}
      >
        <Form
          form={form}
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="请输入邮箱" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="请输入密码" 
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={isLoading}
              block
              size="large"
              style={{ marginTop: 8 }}
            >
              登录
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'right', marginBottom: 16 }}>
            <Link to="/forgot-password">
              <Text type="secondary" style={{ cursor: 'pointer' }}>
                忘记密码?
              </Text>
            </Link>
          </div>

          <Divider plain>或通过以下方式登录</Divider>

          <Space direction="vertical" style={{ width: '100%' }}>
            <Button 
              icon={<GoogleOutlined />} 
              style={socialLoginStyles}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              使用 Google 登录
            </Button>
            <Button 
              icon={<GithubOutlined />} 
              style={socialLoginStyles}
            >
              使用 GitHub 登录
            </Button>
            <Button 
              icon={<FacebookOutlined />} 
              style={socialLoginStyles}
            >
              使用 Facebook 登录
            </Button>
          </Space>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Text type="secondary">还没有账号? </Text>
            <Link to="/register">
              <Text strong style={{ color: '#1890ff' }}>立即注册</Text>
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;