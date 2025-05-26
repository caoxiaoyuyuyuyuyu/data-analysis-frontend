import { Outlet, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Layout, Menu, theme, Avatar, Dropdown, Space, Spin, message } from 'antd';
import {
  DashboardOutlined,
  UploadOutlined,
  LineChartOutlined,
  ExperimentOutlined,
  HistoryOutlined,
  UserOutlined,
  LogoutOutlined,
  HomeOutlined,
  ToolOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout, setCredentials } from '../features/auth/slice';
import { useEffect, useState } from 'react';
import { useVerifyTokenQuery, useLogoutMutation } from '../features/auth/api';

const { Header, Content, Sider } = Layout;

const MainLayout = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const location = useLocation();
  
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [logoutMutation] = useLogoutMutation();
  
  // 获取本地token
  const token = localStorage.getItem('token');
  
  // 只有在有token且未认证时才验证
  const shouldSkip = isAuthenticated || !token;
  const { data, error, isFetching } = useVerifyTokenQuery(undefined, {
    skip: shouldSkip,
  });

  useEffect(() => {
    if (shouldSkip) {
      setIsCheckingAuth(false);
      return;
    }

    if (data) {
      dispatch(setCredentials(data));
      setIsCheckingAuth(false);
    } else if (error) {
      // 验证失败时清除token
      localStorage.removeItem('token');
      setIsCheckingAuth(false);
    }
  }, [data, error, dispatch, shouldSkip]);

  const handleLogout = async () => {
    try {
      // 1. 调用后端注销接口
      await logoutMutation().unwrap();
      
      // 2. 清除本地存储
      localStorage.removeItem('token');
      
      // 3. 更新Redux状态
      dispatch(logout());
      
      // 4. 显示提示信息
      message.success('已成功退出登录');
      
      // 5. 跳转到登录页
      navigate('/login');
    } catch (err) {
      message.error('退出登录失败');
    }
  };

  // 允许访问的未认证路由
  const allowedPaths = ['/login', '/register', '/forgot-password'];

  // 如果正在验证身份，显示加载状态
  if (isCheckingAuth || isFetching) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  // 如果未认证且不在允许的路由，重定向到登录页
  if (!isAuthenticated && !allowedPaths.includes(location.pathname)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const items = [
    {
      key: 'index',
      icon: <HomeOutlined />,
      label: <Link to="/">首页</Link>,
    },
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">仪表盘</Link>,
    },
    {
      key: 'preprocessing',
      icon: <ToolOutlined />,
      label: '数据预处理',
      children: [
        {
          key: 'preprocessing-list',
          label: <Link to="/preprocessing">所有预处理任务</Link>,
        },
        {
          key: 'preprocessing-history',
          label: <Link to="/preprocessing/history">处理记录</Link>,
        }
      ]
    },
    {
      key: 'upload',
      icon: <UploadOutlined />,
      label: <Link to="/upload">数据上传</Link>,
    },
    {
      key: 'training',
      icon: <ExperimentOutlined />,
      label: <Link to="/training">模型训练</Link>,
    },
    {
      key: 'predictions',
      icon: <LineChartOutlined />,
      label: <Link to="/predictions">数据预测</Link>,
    },
    {
      key: 'history',
      icon: <HistoryOutlined />,
      label: <Link to="/history">历史记录</Link>,
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link to="/profile">个人中心</Link>,
    },
  ];

  // 根据当前路由动态设置选中的菜单项
  const getSelectedKeys = () => {
    const path = location.pathname;
    if (path === '/') return ['index'];
    if (path === '/dashboard') return ['dashboard'];
    if (path === '/upload') return ['upload'];
    if (path === '/training') return ['training'];
    if (path === '/predictions') return ['predictions'];
    if (path === '/history') return ['history'];
    if (path === '/profile') return ['profile'];
    if (path === '/preprocessing') return ['preprocessing-list'];
    if (path === '/preprocessing/history') return ['preprocessing-history'];
    return [];
  };

  const userMenuItems = [
    {
      key: 'profile',
      label: <Link to="/profile">个人中心</Link>,
      icon: <UserOutlined />,
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible>
        <div 
          className="logo" 
          style={{ 
            height: '32px',
            margin: '16px',
            background: 'rgba(255, 255, 255, 0.2)',
            textAlign: 'center',
            color: 'white',
            lineHeight: '32px'
          }} 
          onClick={() => navigate('/')}
        >
          数据分析平台
        </div>
        <Menu
          theme="dark"
          selectedKeys={getSelectedKeys()}
          mode="inline"
          items={items}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          padding: 0,
          background: colorBgContainer,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingRight: '24px'
        }}>
          <Dropdown menu={{ items: userMenuItems }}>
            <Space>
              <Avatar icon={<UserOutlined />} />
              <span>{user?.username}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: '16px' }}>
          <div style={{ 
            padding: 24,
            minHeight: 360,
            background: colorBgContainer,
          }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;