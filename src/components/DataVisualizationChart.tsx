import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList
} from 'recharts';
import { Select } from 'antd';
import ReactECharts from 'echarts-for-react';

const { Option } = Select;

// 更丰富、协调的颜色主题
const COLORS = ['#FF6B6B', '#6BCB77', '#4D96FF', '#FFD93D', '#BE8FED', '#FF7F50', '#9ACD32'];

interface DataVisualizationChartProps {
  dataSource: { [key: string]: any; key: number }[];
  columns: string[];
  chartType: string;
  xAxisColumn: string;
  yAxisColumn: string;
  onChartTypeChange: (value: string) => void;
  onXAxisColumnChange: (value: string) => void;
  onYAxisColumnChange: (value: string) => void;
}

const DataVisualizationChart: React.FC<DataVisualizationChartProps> = ({
  dataSource,
  columns,
  chartType,
  xAxisColumn,
  yAxisColumn,
  onChartTypeChange,
  onXAxisColumnChange,
  onYAxisColumnChange
}) => {
  // 使用useState来管理悬停状态
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  const renderChart = () => {
    if (!xAxisColumn || !yAxisColumn || dataSource.length === 0) return null;

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={dataSource}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
              <XAxis dataKey={xAxisColumn} tick={{ fill: '#333', fontSize: 14 }} />
              <YAxis tick={{ fill: '#333', fontSize: 14 }} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: 4 }} />
              <Bar
                dataKey={yAxisColumn}
                fill={hoveredIndex !== null ? '#FFD93D' : '#FF6B6B'}
                stroke="#FF6B6B"
                strokeWidth={2}
                onMouseEnter={(e: any) => setHoveredIndex(e.index)} // 类型断言
                onMouseLeave={() => setHoveredIndex(null)}
                animationDuration={800}
              >
                <LabelList dataKey={yAxisColumn} position="top" fill="#333" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={600}>
            <ScatterChart data={dataSource}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
              <XAxis dataKey={xAxisColumn} name={xAxisColumn} type="number" tick={{ fill: '#333', fontSize: 14 }} />
              <YAxis dataKey={yAxisColumn} name={yAxisColumn} type="number" tick={{ fill: '#333', fontSize: 14 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: 4 }} />
              <Scatter
                dataKey={yAxisColumn}
                fill={hoveredIndex !== null ? '#FFD93D' : '#4D96FF'}
                stroke="#4D96FF"
                strokeWidth={2}
                onMouseEnter={(e: any) => setHoveredIndex(e.index)} // 类型断言
                onMouseLeave={() => setHoveredIndex(null)}
                animationDuration={800}
              />
            </ScatterChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={500}>
            <LineChart data={dataSource}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
              <XAxis dataKey={xAxisColumn} tick={{ fill: '#333', fontSize: 14 }} />
              <YAxis tick={{ fill: '#333', fontSize: 14 }} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: 4 }} />
              <Line
                type="monotone"
                dataKey={yAxisColumn}
                stroke={hoveredIndex !== null ? '#FFD93D' : '#6BCB77'}
                strokeWidth={2}
                activeDot={{ r: 8 }}
                onMouseEnter={(e: any) => setHoveredIndex(e.index)} // 类型断言
                onMouseLeave={() => setHoveredIndex(null)}
                animationDuration={800}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        const pieData = dataSource.map(item => ({ name: item[xAxisColumn], value: item[yAxisColumn] }));
        const total = pieData.reduce((sum, d) => sum + d.value, 0);

        // 自定义标签线组件
        const CustomLabelLine: React.FC<React.SVGProps<SVGPathElement>> = (props) => {
          return (
            <path
              {...props}
              stroke="#ccc"
              strokeWidth={1}
              fill="none"
            />
          );
        };

        return (
          <ResponsiveContainer width="100%" height={600}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={160}
                fill="#BE8FED"
                labelLine={true}
                label={({ cx, cy, midAngle, outerRadius, percent, name }: {
                  cx: number;
                  cy: number;
                  midAngle: number;
                  outerRadius: number;
                  percent: number;
                  name: string;
                }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = outerRadius + 20;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);

                  return (
                    <text
                      x={x}
                      y={y}
                      fill="#333"
                      textAnchor={x > cx ? 'start' : 'end'}
                      dominantBaseline="middle"
                      fontSize={16}
                    >
                      {`${name}: ${(percent * 100).toFixed(2)}%`}
                    </text>
                  );
                }}
                isAnimationActive={true}
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
                <LabelList
                  dataKey="value"
                  position="outside"
                  content={<CustomLabelLine />}
                />
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: 4 }} />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'heatmap':
        const option = {
          tooltip: {
            position: 'top',
            backgroundColor: '#fff',
            borderColor: '#ccc',
            borderRadius: 4,
            textStyle: {
              color: '#333'
            }
          },
          animation: true,
          grid: {
            height: '60%',
            top: '0%'
          },
          xAxis: {
            type: 'category',
            data: dataSource.map(item => item[xAxisColumn]),
            splitArea: {
              show: true
            },
            axisLabel: {
              color: '#333',
              fontSize: 14
            }
          },
          yAxis: {
            type: 'category',
            data: dataSource.map(item => item[yAxisColumn]),
            splitArea: {
              show: true
            },
            axisLabel: {
              color: '#333',
              fontSize: 14
            }
          },
          visualMap: {
            min: 0,
            max: 100,
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: '15%',
            textStyle: {
              color: '#333'
            }
          },
          series: [
            {
              name: 'Punch Card',
              type: 'heatmap',
              data: dataSource.map(item => [item[xAxisColumn], item[yAxisColumn], item[yAxisColumn]]),
              label: {
                show: false
              },
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
              }
            }
          ]
        };

        return (
          <div style={{ height: 600 }}>
            <ReactECharts option={option} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center' }}>
        <Select
          value={chartType}
          onChange={onChartTypeChange}
          style={{ width: 120, marginRight: 16 }}
        >
          <Option value="bar">柱状图</Option>
          <Option value="scatter">散点图</Option>
          <Option value="line">折线图</Option>
          <Option value="pie">饼状图</Option>
          <Option value="heatmap">热力图</Option>
        </Select>
        <Select
          value={xAxisColumn}
          onChange={onXAxisColumnChange}
          placeholder="选择X轴列"
          style={{ width: 120, marginRight: 16 }}
        >
          {columns.map((col) => (
            <Option key={col} value={col}>
              {col}
            </Option>
          ))}
        </Select>
        <Select
          value={yAxisColumn}
          onChange={onYAxisColumnChange}
          placeholder="选择Y轴列"
          style={{ width: 120 }}
        >
          {columns.map((col) => (
            <Option key={col} value={col}>
              {col}
            </Option>
          ))}
        </Select>
      </div>
      {renderChart()}
    </div>
  );
};

export default DataVisualizationChart;