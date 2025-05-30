import { Card, Button, Space, Typography, Grid } from 'antd';
import { Link } from 'react-router-dom';
import { UploadOutlined, DashboardOutlined, ExperimentOutlined, RocketOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const { useBreakpoint } = Grid;
const { Title, Text } = Typography;

// 使用styled-components添加一些自定义样式
const StyledContainer = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const StyledHeader = styled.div`
  text-align: center;
  margin-bottom: 40px;
  
  h1 {
    font-size: 2.5rem;
    margin-bottom: 16px;
    color: #1890ff;
    font-weight: 600;
  }
  
  p {
    font-size: 1.1rem;
    color: #666;
    max-width: 800px;
    margin: 0 auto;
  }
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 16px;
`;

const StyledFeatureCard = styled(Card)`
  transition: all 0.3s ease;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  }
  
  .ant-card-head {
    border-bottom: none;
    padding: 0 16px;
  }
  
  .ant-card-head-title {
    font-weight: 500;
    color: #1890ff;
  }
  
  .ant-card-body {
    padding: 16px;
    color: #666;
  }
`;

const QuickStartCard = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
  
  .ant-card-head {
    border-bottom: none;
  }
  
  .ant-card-head-title {
    font-weight: 500;
    color: #1890ff;
  }
`;

const StyledButton = styled(Button)`
  height: 60px;
  width: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-weight: 500;
  
  a {
    color: inherit;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const HomePage = () => {
  const screens = useBreakpoint();
  
  return (
    <StyledContainer>
      <StyledHeader>
        <Title level={1}>欢迎使用数据分析平台</Title>
        <Text type="secondary">
          一个强大的数据分析和机器学习平台，帮助您从数据中发现洞察、构建模型并做出数据驱动的决策
        </Text>
      </StyledHeader>
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <QuickStartCard title="快速开始">
          <Space 
            size="middle" 
            wrap 
            style={{ 
              justifyContent: screens.md ? 'center' : 'flex-start',
              width: '100%',
              padding: '16px 0'
            }}
          >
            <StyledButton type="primary" icon={<UploadOutlined />} size="large">
              <Link to="/upload">上传数据</Link>
            </StyledButton>
            <StyledButton type="primary" ghost icon={<ExperimentOutlined />} size="large">
              <Link to="/training">模型训练</Link>
            </StyledButton>
            <StyledButton type="primary" ghost icon={<DashboardOutlined />} size="large">
              <Link to="/dashboard">查看仪表盘</Link>
            </StyledButton>
          </Space>
        </QuickStartCard>

        <QuickStartCard title="平台功能">
          <FeatureGrid>
            {[
              { 
                title: '数据上传', 
                desc: '支持CSV、Excel等多种格式，简单拖拽即可完成上传',
                icon: <UploadOutlined style={{ color: '#1890ff', fontSize: '20px' }} />
              },
              { 
                title: '数据预处理', 
                desc: '缺失值处理、特征缩放、编码转换，一键完成数据清洗',
                icon: <ExperimentOutlined style={{ color: '#1890ff', fontSize: '20px' }} />
              },
              { 
                title: '可视化分析', 
                desc: '多种图表展示数据分布和关系，直观理解数据特征',
                icon: <DashboardOutlined style={{ color: '#1890ff', fontSize: '20px' }} />
              },
              { 
                title: '模型训练', 
                desc: '多种机器学习算法一键训练，轻松构建预测模型',
                icon: <RocketOutlined style={{ color: '#1890ff', fontSize: '20px' }} />
              },
              { 
                title: '模型评估', 
                desc: '详细的评估指标和可视化，全面了解模型性能',
                icon: <ExperimentOutlined style={{ color: '#1890ff', fontSize: '20px' }} />
              },
              { 
                title: '预测分析', 
                desc: '使用训练好的模型进行预测，快速获得分析结果',
                icon: <DashboardOutlined style={{ color: '#1890ff', fontSize: '20px' }} />
              },
            ].map((item) => (
              <StyledFeatureCard 
                key={item.title} 
                size="small" 
                title={
                  <Space>
                    {item.icon}
                    {item.title}
                  </Space>
                }
              >
                {item.desc}
              </StyledFeatureCard>
            ))}
          </FeatureGrid>
        </QuickStartCard>
      </Space>
    </StyledContainer>
  );
};

export default HomePage;