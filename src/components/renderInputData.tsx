import React, { ReactNode } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

// 定义特征重要性数据的类型
interface FeatureImportanceData {
  features: string[];
  importance: number[];
}

// 定义分布数据的类型
interface DistributionData {
  predicted?: Record<string | number, number>;
  actual?: Record<string | number, number>;
}

// 定义基本指标数据的类型
interface BasicMetricsData {
  [key: string]: number;
}

// 定义可视化数据的类型
interface VisualizationData {
  model_type?: string;
  feature_importance?: FeatureImportanceData;
  basic_metrics?: BasicMetricsData;
  distribution?: DistributionData;
  cluster_visualization?: any;
  [key: string]: any;
}

// 饼图颜色方案
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const renderInputData = (data: any): ReactNode => {
  if (!data) return <span>无输入数据</span>;

  // 处理非对象类型数据
  if (typeof data !== 'object' || data === null) {
    return (
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold', width: '30%' }}>Value</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{String(data)}</td>
          </tr>
        </tbody>
      </table>
    );
  }

  // 类型断言确保 data 是 VisualizationData 类型
  const vizData = data as VisualizationData;
  
  // 特殊处理 feature_importance 数据
  let featureImportanceChart: ReactNode = null;
  if (vizData.feature_importance) {
    const { features, importance } = vizData.feature_importance;
    
    // 创建柱状图数据
    const chartData = features.map((feature, index) => ({
      feature,
      importance: importance[index],
    }));
    
    // 按重要性排序
    chartData.sort((a, b) => b.importance - a.importance);
    
    // 只显示前20个最重要的特征
    const topFeatures = chartData.slice(0, 20);
    
    featureImportanceChart = (
      <div style={{ margin: '20px 0' }}>
        <h3 style={{ marginBottom: '15px' }}>特征重要性</h3>
        <div style={{ height: '400px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topFeatures}
              margin={{ top: 20, right: 30, left: 100, bottom: 70 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" label={{ value: '重要性', position: 'insideBottom', offset: -5 }} />
              <YAxis 
                dataKey="feature" 
                type="category" 
                tick={{ fontSize: 12 }}
                width={80}
                tickFormatter={(value: string) => value.length > 30 ? `${value.substring(0, 30)}...` : value}
              />
              <Tooltip 
                formatter={(value: number) => [`${Number(value).toFixed(4)}`, '重要性']}
                labelFormatter={(label: string) => `特征: ${label}`}
              />
              <Legend />
              <Bar 
                dataKey="importance" 
                name="特征重要性" 
                fill="#8884d8" 
                animationDuration={1500}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ marginTop: '10px', fontStyle: 'italic', color: '#666' }}>
          显示前 {topFeatures.length} 个重要特征（共 {features.length} 个）
        </div>
      </div>
    );
  }

  // 处理数组和对象数据
  const entries = Array.isArray(vizData)
    ? vizData.map((item, index) => [String(index), item])
    : Object.entries(vizData);

  return (
    <div>
      {/* 渲染特征重要性图表 */}
      {featureImportanceChart}
      
      {/* 渲染其他数据 */}
      <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: '20px' }}>
        <tbody>
          {entries.map(([key, value]) => {
            // 跳过已经单独渲染的特征重要性
            if (key === 'feature_importance') return null;
            
            // 特殊处理分布数据 - 使用饼图展示预测值分布
            if (key === 'distribution' && value && typeof value === 'object') {
              const distribution = value as DistributionData;
              
              // 准备饼图数据
              const pieData = distribution.predicted 
                ? Object.entries(distribution.predicted).map(([name, value]) => ({ name, value }))
                : [];
              
              // 按值排序，最大的在最前面
              pieData.sort((a, b) => b.value - a.value);
              if (pieData.length > 10) {
                pieData.splice(10);
                pieData.push({ name: '其他', value: pieData.reduce((acc, cur) => acc + cur.value, 0) });
              }
              
              return (
                <tr key={key}>
                  <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold', width: '30%' }}>{key}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    <div style={{ margin: '10px 0' }}>
                      <h4>预测结果分布</h4>
                      
                      {/* 预测值分布饼图 */}
                      {distribution.predicted && (
                        <div>
                          <h5>预测值分布</h5>
                          <div style={{ height: '300px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={pieData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={true}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                  nameKey="name"
                                  label={({ name, percent }) => `${(percent * 100).toFixed(1)}%`}
                                >
                                  {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  formatter={(value, name, props) => [
                                    value, 
                                    name,
                                    // `占比: ${(props.payload.percent * 100).toFixed(1)}%`
                                  ]}
                                />
                                {/* <Legend 
                                  layout="vertical" 
                                  verticalAlign="middle" 
                                  align="right"
                                  formatter={(value, entry, index) => (
                                    <span>{value} ({entry.payload?.value})</span>
                                  )}
                                /> */}
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                      
                      {/* 实际值分布 */}
                      {distribution.actual && (
                        <div style={{ marginTop: '20px' }}>
                          <h5>实际值分布</h5>
                          <div style={{ height: '300px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={Object.entries(distribution.actual).map(([name, value]) => ({ name, value }))}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={true}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                  nameKey="name"
                                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                                >
                                  {Object.entries(distribution.actual).map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  formatter={(value, name, props) => [
                                    value, 
                                    `占比: ${(props.payload.percent * 100).toFixed(1)}%`
                                  ]}
                                />
                                <Legend 
                                  layout="vertical" 
                                  verticalAlign="middle" 
                                  align="right"
                                  formatter={(value, entry, index) => (
                                    <span>{value} ({entry.payload?.value})</span>
                                  )}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            }
            
            // 特殊处理基本指标
            if (key === 'basic_metrics' && value && typeof value === 'object') {
              const metrics = value as BasicMetricsData;
              return (
                <tr key={key}>
                  <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold', width: '30%' }}>{key}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    <div style={{ margin: '10px 0' }}>
                      <h4>模型性能指标</h4>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          {Object.entries(metrics).map(([metric, score]) => (
                            <tr key={metric}>
                              <td style={{ border: '1px solid #eee', padding: '5px', width: '40%', fontWeight: 'bold' }}>
                                {metric}
                              </td>
                              <td style={{ border: '1px solid #eee', padding: '5px' }}>
                                {typeof score === 'number' ? score.toFixed(4) : String(score)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              );
            }
            
            // 默认渲染方式
            return (
              <tr key={key}>
                <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold', width: '30%' }}>{key}</td>
                {value && typeof value === 'object' && value !== null ? (
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {renderInputData(value)}
                  </td>
                ) : (
                  <td style={{ border: '1px solid #ddd', padding: '8px', color: 'blue' }}>
                    {String(value)}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default renderInputData;