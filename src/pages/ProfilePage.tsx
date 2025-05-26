import { Card, Form, Input, Button, message } from 'antd';
import { useAppSelector } from '../store/hooks';
import { useUpdateProfileMutation } from '../features/auth/api';
import { useGetMeQuery } from '../features/auth/api';
import { useEffect } from 'react';

const ProfilePage = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const { refetch } = useGetMeQuery();

  useEffect(() => {
    refetch();
  }, []);


  const onFinish = async (values: any) => {
    try {
      await updateProfile(values).unwrap();
      message.success('个人信息更新成功');
    } catch (err) {
      message.error('更新失败');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card title="个人中心">
        <Form
          initialValues={{
            username: user?.username,
            email: user?.email
          }}
          onFinish={onFinish}
          layout="vertical"
          style={{ maxWidth: 600 }}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[{ required: true, message: '请输入邮箱' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="currentPassword"
            label="当前密码"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[{ min: 6, message: '密码至少6个字符' }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isLoading}>
              更新信息
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ProfilePage;