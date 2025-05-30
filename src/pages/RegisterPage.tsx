
import { useNavigate, Link } from 'react-router-dom';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  message, 
  Typography, 
  Divider 
} from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  LockOutlined,
  SafetyOutlined 
} from '@ant-design/icons';
import { useRegisterMutation } from '../features/auth/api';

const { Title, Text } = Typography;

const RegisterPage = () => {
  const [form] = Form.useForm();
  const [register, { isLoading }] = useRegisterMutation();
  const navigate = useNavigate();

  const onFinish = async (values: { 
    username: string; 
    email: string; 
    password: string;
    confirm: string;
  }) => {
    try {
      console.log(values);
      // 明确排除confirm字段
      const { confirm, ...registerData } = values;
      console.log(registerData);
      await register(registerData).unwrap();
      message.success('注册成功，请登录');
      navigate('/login');
    } catch (err) {
      message.error('注册失败，用户名或邮箱可能已被使用');
    }
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
            创建新账户
          </Title>
        }
        style={{ 
          width: 480,
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}
        bordered={false}
      >
        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          layout="vertical"
        >
        <>
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
              { max: 20, message: '用户名不能超过20个字符' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="设置用户名 (3-20个字符)" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="请输入常用邮箱" 
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 8, message: '密码至少8个字符' },
              { 
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[^]{8,}$/,
                message: '需包含大小写字母和数字'
              }
            ]}
            hasFeedback
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="设置密码 (至少8位)" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirm"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
            hasFeedback
          >
            <Input.Password 
              prefix={<SafetyOutlined />} 
              placeholder="确认密码" 
              size="large"
            />
          </Form.Item>
        </>

          <div style={{ marginTop: 24 }}>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={isLoading}
                block
              >
                完成注册
              </Button>
          </div>

          <Divider style={{ margin: '24px 0' }} />

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">已有账号? </Text>
            <Link to="/login">
              <Text strong style={{ color: '#1890ff' }}>立即登录</Text>
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default RegisterPage;