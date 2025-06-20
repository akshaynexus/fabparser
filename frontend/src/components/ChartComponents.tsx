import React from 'react';
import { useTheme } from '@mui/material';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  ReferenceLine,
} from 'recharts';

// Enhanced glassmorphic tooltip
export const GlassmorphicTooltip = ({ active, payload, label, formatter }: any) => {
  const theme = useTheme();
  
  if (!active || !payload || !payload.length) return null;

  return (
    <div
      style={{
        background: theme.palette.mode === 'dark' 
          ? 'rgba(0, 0, 0, 0.85)' 
          : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${theme.palette.mode === 'dark' 
          ? 'rgba(255, 255, 255, 0.2)' 
          : 'rgba(0, 0, 0, 0.1)'}`,
        borderRadius: '16px',
        padding: '12px 16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        minWidth: '200px',
      }}
    >
      {label && (
        <div style={{ 
          color: theme.palette.text.primary, 
          fontWeight: 600, 
          marginBottom: '8px',
          fontSize: '14px',
        }}>
          {label}
        </div>
      )}
      {payload.map((item: any, index: number) => (
        <div key={index} style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '4px',
          fontSize: '13px',
        }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              backgroundColor: item.color,
              borderRadius: '50%',
              marginRight: '8px',
              boxShadow: `0 0 0 2px ${item.color}40`,
            }}
          />
          <span style={{ 
            color: theme.palette.text.secondary, 
            marginRight: '8px',
            flex: 1,
          }}>
            {item.name}:
          </span>
          <span style={{ 
            color: theme.palette.text.primary, 
            fontWeight: 600,
          }}>
            {formatter ? formatter(item.value, item.name) : item.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// Properly responsive chart container with CSS Grid and Flexbox
interface ChartContainerProps {
  children: React.ReactNode;
  title?: string;
  height?: number | string;
  minHeight?: number;
  aspectRatio?: string;
}

export const GlassmorphicChartContainer: React.FC<ChartContainerProps> = ({ 
  children, 
  title,
  height = '35vh',
  minHeight = 300,
  aspectRatio = '16/9'
}) => {
  const theme = useTheme();
  
  return (
    <div
      style={{
        width: '100%',
        height: typeof height === 'string' ? height : `${height}px`,
        minHeight: `${minHeight}px`,
        aspectRatio: aspectRatio,
        background: theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.02)'
          : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${theme.palette.mode === 'dark' 
          ? 'rgba(255, 255, 255, 0.08)' 
          : 'rgba(0, 0, 0, 0.05)'}`,
        borderRadius: '16px',
        padding: '16px',
        boxShadow: theme.palette.mode === 'dark'
          ? '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          : '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {title && (
        <div style={{ 
          marginBottom: '12px',
          fontSize: '16px',
          fontWeight: 600,
          color: theme.palette.text.primary,
          flexShrink: 0,
        }}>
          {title}
        </div>
      )}
      {/* Responsive chart area using CSS Grid for perfect sizing */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplate: '1fr / 1fr',
        minHeight: 0, // Important for flex child with overflow
        width: '100%',
      }}>
        <div style={{
          gridArea: '1 / 1',
          width: '100%',
          height: '100%',
          minHeight: 0,
        }}>
          {children}
        </div>
      </div>
    </div>
  );
};

// Responsive Line Chart
export const GlassmorphicLineChart: React.FC<{
  data: any[];
  lines: Array<{
    dataKey: string;
    color: string;
    name: string;
    strokeWidth?: number;
  }>;
  height?: number | string;
  minHeight?: number;
  xAxisKey?: string;
  formatter?: (value: any, name: string) => [string, string];
}> = ({ data, lines, height = '35vh', minHeight = 300, xAxisKey = 'name', formatter }) => {
  const theme = useTheme();

  return (
    <GlassmorphicChartContainer height={height} minHeight={minHeight}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <defs>
            {lines.map((line, index) => (
              <linearGradient key={index} id={`gradient-${line.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={line.color} stopOpacity={0.8} />
                <stop offset="100%" stopColor={line.color} stopOpacity={0.1} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} 
          />
          <XAxis 
            dataKey={xAxisKey}
            stroke={theme.palette.text.secondary}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke={theme.palette.text.secondary}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip 
            content={<GlassmorphicTooltip formatter={formatter} />}
          />
          {lines.map((line, index) => (
            <Line
              key={index}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.color}
              strokeWidth={line.strokeWidth || 3}
              dot={{ 
                r: 6, 
                fill: line.color,
                strokeWidth: 2,
                stroke: theme.palette.background.paper,
              }}
              activeDot={{ 
                r: 8, 
                fill: line.color,
                strokeWidth: 3,
                stroke: theme.palette.background.paper,
              }}
              name={line.name}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </GlassmorphicChartContainer>
  );
};

// Responsive Area Chart
export const GlassmorphicAreaChart: React.FC<{
  data: any[];
  areas?: Array<{
    dataKey: string;
    color: string;
    name: string;
  }>;
  height?: number | string;
  minHeight?: number;
  xAxisKey?: string;
  formatter?: (value: any, name: string) => [string, string];
}> = ({ data, areas = [], height = '35vh', minHeight = 300, xAxisKey = 'name', formatter }) => {
  const theme = useTheme();

  // Default area if none provided
  const defaultAreas = areas.length > 0 ? areas : [
    { dataKey: 'amount', color: theme.palette.primary.main, name: 'Amount' }
  ];

  return (
    <GlassmorphicChartContainer height={height} minHeight={minHeight}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <defs>
            {defaultAreas.map((area, index) => (
              <linearGradient key={index} id={`areaGradient-${area.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={area.color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={area.color} stopOpacity={0.05} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} 
          />
          <XAxis 
            dataKey={xAxisKey}
            stroke={theme.palette.text.secondary}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke={theme.palette.text.secondary}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip 
            content={<GlassmorphicTooltip formatter={formatter} />}
          />
          {defaultAreas.map((area, index) => (
            <Area
              key={index}
              type="monotone"
              dataKey={area.dataKey}
              stroke={area.color}
              strokeWidth={2}
              fill={`url(#areaGradient-${area.dataKey})`}
              name={area.name}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </GlassmorphicChartContainer>
  );
};

// Responsive Bar Chart
export const GlassmorphicBarChart: React.FC<{
  data: any[];
  bars: Array<{
    dataKey: string;
    color: string;
    name: string;
  }>;
  height?: number | string;
  minHeight?: number;
  xAxisKey?: string;
  layout?: 'horizontal' | 'vertical';
  formatter?: (value: any, name: string) => [string, string];
}> = ({ data, bars, height = '35vh', minHeight = 300, xAxisKey = 'name', layout = 'vertical', formatter }) => {
  const theme = useTheme();

  return (
    <GlassmorphicChartContainer height={height} minHeight={minHeight}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={data} 
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          layout={layout}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} 
          />
          <XAxis 
            dataKey={layout === 'vertical' ? xAxisKey : undefined}
            type={layout === 'vertical' ? 'category' : 'number'}
            stroke={theme.palette.text.secondary}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            angle={layout === 'vertical' ? -45 : 0}
            textAnchor={layout === 'vertical' ? 'end' : 'middle'}
            height={layout === 'vertical' ? 80 : undefined}
          />
          <YAxis 
            dataKey={layout === 'horizontal' ? xAxisKey : undefined}
            type={layout === 'horizontal' ? 'category' : 'number'}
            stroke={theme.palette.text.secondary}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={layout === 'vertical' ? (value) => `${(value / 1000).toFixed(0)}k` : undefined}
            width={layout === 'horizontal' ? 120 : undefined}
          />
          <Tooltip 
            content={<GlassmorphicTooltip formatter={formatter} />}
          />
          {bars.map((bar, index) => (
            <Bar
              key={index}
              dataKey={bar.dataKey}
              fill={bar.color}
              radius={layout === 'vertical' ? [4, 4, 0, 0] : [0, 4, 4, 0]}
              name={bar.name}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </GlassmorphicChartContainer>
  );
};

// Responsive Pie Chart with better sizing
export const GlassmorphicPieChart: React.FC<{
  data: any[];
  dataKey: string;
  nameKey: string;
  colors: string[];
  height?: number | string;
  minHeight?: number;
  innerRadius?: number | string;
  outerRadius?: number | string;
  formatter?: (value: any, name: string) => [string, string];
}> = ({ 
  data, 
  dataKey, 
  colors, 
  height = '35vh', 
  minHeight = 300,
  innerRadius = '20%', 
  outerRadius = '80%',
  formatter 
}) => {
  return (
    <GlassmorphicChartContainer height={height} minHeight={minHeight} aspectRatio="1/1">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={3}
            dataKey={dataKey}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
                stroke={colors[index % colors.length]}
                strokeWidth={3}
                style={{
                  filter: 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.3))',
                }}
              />
            ))}
          </Pie>
          <Tooltip 
            content={<GlassmorphicTooltip formatter={formatter} />}
          />
        </PieChart>
      </ResponsiveContainer>
    </GlassmorphicChartContainer>
  );
};

// Responsive Composed Chart
export const GlassmorphicComposedChart: React.FC<{
  data: any[];
  bars?: Array<{
    dataKey: string;
    color: string;
    name: string;
  }>;
  lines?: Array<{
    dataKey: string;
    color: string;
    name: string;
    strokeWidth?: number;
  }>;
  height?: number | string;
  minHeight?: number;
  xAxisKey?: string;
  formatter?: (value: any, name: string) => [string, string];
}> = ({ data, bars = [], lines = [], height = '35vh', minHeight = 300, xAxisKey = 'name', formatter }) => {
  const theme = useTheme();

  return (
    <GlassmorphicChartContainer height={height} minHeight={minHeight}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} 
          />
          <XAxis 
            dataKey={xAxisKey}
            stroke={theme.palette.text.secondary}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke={theme.palette.text.secondary}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip 
            content={<GlassmorphicTooltip formatter={formatter} />}
          />
          <ReferenceLine 
            y={0} 
            stroke={theme.palette.text.secondary} 
            strokeDasharray="2 2" 
            opacity={0.6}
          />
          
          {bars.map((bar, index) => (
            <Bar
              key={index}
              dataKey={bar.dataKey}
              fill={bar.color}
              radius={[4, 4, 0, 0]}
              name={bar.name}
            />
          ))}
          
          {lines.map((line, index) => (
            <Line
              key={index}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.color}
              strokeWidth={line.strokeWidth || 3}
              dot={{ 
                r: 6, 
                fill: line.color,
                strokeWidth: 2,
                stroke: theme.palette.background.paper,
              }}
              name={line.name}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </GlassmorphicChartContainer>
  );
};

export default {
  GlassmorphicTooltip,
  GlassmorphicChartContainer,
  GlassmorphicLineChart,
  GlassmorphicAreaChart,
  GlassmorphicBarChart,
  GlassmorphicPieChart,
  GlassmorphicComposedChart,
};