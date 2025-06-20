import React, { useMemo, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Container,
  useTheme,
} from '@mui/material';
import {
  Timeline,
  TrendingUp,
  TrendingDown,
  CalendarMonth,
  Assessment,
  ShowChart,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import {
  GlassmorphicLineChart,
  GlassmorphicAreaChart,
  GlassmorphicBarChart,
  GlassmorphicComposedChart,
} from './ChartComponents';

import { useAppContext } from '../context/AppContext';

const EnhancedMonthlyTrends: React.FC = () => {
  const { state } = useAppContext();
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar' | 'combined'>('line');
  const [metricView, setMetricView] = useState<'amount' | 'count' | 'average'>('amount');
  const theme = useTheme();

  const monthlyAnalytics = useMemo(() => {
    if (!state.data) return null;

    // Get monthly data from summary
    const monthlyData = Object.entries(state.data.summary.byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => {
        const monthDate = new Date(month + '-01');
        const monthName = monthDate.toLocaleDateString('en-US', { 
          month: 'short', 
          year: '2-digit' 
        });

        return {
          month,
          monthName,
          date: monthDate,
          spending: data.debit,
          income: data.credit,
          netAmount: data.credit - data.debit,
          transactionCount: data.count,
          avgTransactionAmount: data.debit / Math.max(1, data.count),
          savingsRate: data.credit > 0 ? ((data.credit - data.debit) / data.credit) * 100 : 0,
        };
      });

    // Calculate trends and insights
    const totalMonths = monthlyData.length;
    const avgMonthlySpending = monthlyData.reduce((sum, month) => sum + month.spending, 0) / totalMonths;
    const avgMonthlyIncome = monthlyData.reduce((sum, month) => sum + month.income, 0) / totalMonths;
    const avgMonthlySavings = monthlyData.reduce((sum, month) => sum + month.netAmount, 0) / totalMonths;

    // Calculate month-over-month growth rates
    const trendsData = monthlyData.map((month, index) => {
      const prevMonth = index > 0 ? monthlyData[index - 1] : null;
      
      return {
        ...month,
        spendingGrowth: prevMonth 
          ? ((month.spending - prevMonth.spending) / Math.max(1, prevMonth.spending)) * 100 
          : 0,
        incomeGrowth: prevMonth 
          ? ((month.income - prevMonth.income) / Math.max(1, prevMonth.income)) * 100 
          : 0,
        transactionGrowth: prevMonth 
          ? ((month.transactionCount - prevMonth.transactionCount) / Math.max(1, prevMonth.transactionCount)) * 100 
          : 0,
      };
    });

    // Find highest and lowest months
    const highestSpendingMonth = monthlyData.reduce((max, month) => 
      month.spending > max.spending ? month : max
    );
    const lowestSpendingMonth = monthlyData.reduce((min, month) => 
      month.spending < min.spending ? month : min
    );
    const bestSavingsMonth = monthlyData.reduce((max, month) => 
      month.netAmount > max.netAmount ? month : max
    );

    return {
      monthlyData,
      trendsData,
      totalMonths,
      avgMonthlySpending,
      avgMonthlyIncome,
      avgMonthlySavings,
      highestSpendingMonth,
      lowestSpendingMonth,
      bestSavingsMonth,
    };
  }, [state.data]);

  if (!monthlyAnalytics) {
    return (
      <Typography variant="h6" color="text.secondary" textAlign="center" py={4}>
        No monthly data available
      </Typography>
    );
  }

  const renderChart = () => {
    const data = monthlyAnalytics.trendsData;
    
    const formatter = (value: any, name: string) => {
      if (metricView === 'amount') {
        return [`${Number(value).toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}`, name];
      } else if (metricView === 'count') {
        return [`${value} transactions`, name];
      } else {
        return [`${Number(value).toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}`, name];
      }
    };

    switch (chartType) {
      case 'line':
        const lineData = metricView === 'amount' ? [
          { dataKey: 'spending', color: theme.palette.error.main, name: 'Spending' },
          { dataKey: 'income', color: theme.palette.success.main, name: 'Income' },
          { dataKey: 'netAmount', color: theme.palette.primary.main, name: 'Net Amount' },
        ] : metricView === 'count' ? [
          { dataKey: 'transactionCount', color: theme.palette.primary.main, name: 'Transaction Count' },
        ] : [
          { dataKey: 'avgTransactionAmount', color: theme.palette.secondary.main, name: 'Average Transaction' },
        ];
        
        return (
          <GlassmorphicLineChart
            data={data}
            lines={lineData}
            height={400}
            xAxisKey="monthName"
            formatter={formatter}
          />
        );

      case 'area':
        const areaData = metricView === 'amount' ? [
          { dataKey: 'spending', color: theme.palette.error.main, name: 'Spending' },
          { dataKey: 'income', color: theme.palette.success.main, name: 'Income' },
        ] : metricView === 'count' ? [
          { dataKey: 'transactionCount', color: theme.palette.primary.main, name: 'Transaction Count' },
        ] : [
          { dataKey: 'avgTransactionAmount', color: theme.palette.secondary.main, name: 'Average Transaction' },
        ];
        
        return (
          <GlassmorphicAreaChart
            data={data}
            areas={areaData}
            height={400}
            xAxisKey="monthName"
            formatter={formatter}
          />
        );

      case 'bar':
        const barData = metricView === 'amount' ? [
          { dataKey: 'spending', color: theme.palette.error.main, name: 'Spending' },
          { dataKey: 'income', color: theme.palette.success.main, name: 'Income' },
        ] : metricView === 'count' ? [
          { dataKey: 'transactionCount', color: theme.palette.primary.main, name: 'Transactions' },
        ] : [
          { dataKey: 'avgTransactionAmount', color: theme.palette.secondary.main, name: 'Average' },
        ];
        
        return (
          <GlassmorphicBarChart
            data={data}
            bars={barData}
            height={400}
            xAxisKey="monthName"
            formatter={formatter}
          />
        );

      case 'combined':
        return (
          <GlassmorphicComposedChart
            data={data}
            bars={[
              { dataKey: 'spending', color: theme.palette.error.main, name: 'Spending' },
              { dataKey: 'income', color: theme.palette.success.main, name: 'Income' },
            ]}
            lines={[
              { dataKey: 'netAmount', color: theme.palette.primary.main, name: 'Net Amount' },
            ]}
            height={400}
            xAxisKey="monthName"
            formatter={formatter}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      p: { xs: 1, sm: 2 },
      overflow: 'auto'
    }}>
      {/* Header Controls */}
      <Card sx={{ flexShrink: 0 }}>
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            alignItems={{ xs: 'stretch', sm: 'center' }} 
            justifyContent="space-between"
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Timeline color="primary" />
              <Typography variant="h5" fontWeight={600}>
                Monthly Trends
              </Typography>
              <Chip 
                label={`${monthlyAnalytics.totalMonths} months`}
                size="small"
                variant="outlined"
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 2 }}>
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 120 } }}>
                <InputLabel>Chart Type</InputLabel>
                <Select
                  value={chartType}
                  label="Chart Type"
                  onChange={(e) => setChartType(e.target.value as any)}
                >
                  <MenuItem value="line">Line Chart</MenuItem>
                  <MenuItem value="area">Area Chart</MenuItem>
                  <MenuItem value="bar">Bar Chart</MenuItem>
                  <MenuItem value="combined">Combined</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 120 } }}>
                <InputLabel>Metric</InputLabel>
                <Select
                  value={metricView}
                  label="Metric"
                  onChange={(e) => setMetricView(e.target.value as any)}
                >
                  <MenuItem value="amount">Amount</MenuItem>
                  <MenuItem value="count">Count</MenuItem>
                  <MenuItem value="average">Average</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Key Metrics Cards - Compact Row */}
      <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ flexShrink: 0 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 1, sm: 1.5 } }}>
              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary" fontWeight={600} noWrap>
                    Avg Spending
                  </Typography>
                  <TrendingDown sx={{ color: 'error.main', fontSize: '1rem' }} />
                </Stack>
                <Typography variant="h6" fontWeight={700} color="error.main">
                  {(monthlyAnalytics.avgMonthlySpending / 1000).toFixed(0)}k
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 1, sm: 1.5 } }}>
              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary" fontWeight={600} noWrap>
                    Avg Income
                  </Typography>
                  <TrendingUp sx={{ color: 'success.main', fontSize: '1rem' }} />
                </Stack>
                <Typography variant="h6" fontWeight={700} color="success.main">
                  {(monthlyAnalytics.avgMonthlyIncome / 1000).toFixed(0)}k
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 1, sm: 1.5 } }}>
              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary" fontWeight={600} noWrap>
                    Avg Savings
                  </Typography>
                  <Assessment sx={{ color: 'primary.main', fontSize: '1rem' }} />
                </Stack>
                <Typography 
                  variant="h6" 
                  fontWeight={700} 
                  color={monthlyAnalytics.avgMonthlySavings >= 0 ? 'success.main' : 'error.main'}
                >
                  {(monthlyAnalytics.avgMonthlySavings / 1000).toFixed(0)}k
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 1, sm: 1.5 } }}>
              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary" fontWeight={600} noWrap>
                    Best Month
                  </Typography>
                  <CalendarMonth sx={{ color: 'secondary.main', fontSize: '1rem' }} />
                </Stack>
                <Typography variant="h6" fontWeight={700} color="secondary.main" noWrap>
                  {monthlyAnalytics.bestSavingsMonth.monthName}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Chart - Full width, 35% height */}
      <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ flexShrink: 0 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                Monthly Trends - {metricView.charAt(0).toUpperCase() + metricView.slice(1)}
              </Typography>
              {renderChart()}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Monthly Highlights - Compact */}
      <Card sx={{ flexShrink: 0 }}>
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
            Monthly Highlights
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ p: 2, borderRadius: 2, background: 'rgba(255, 59, 48, 0.1)', border: '1px solid rgba(255, 59, 48, 0.2)' }}>
                <Typography variant="subtitle2" color="error.main" gutterBottom>
                  Highest Spending
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {monthlyAnalytics.highestSpendingMonth.monthName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {(monthlyAnalytics.highestSpendingMonth.spending / 1000).toFixed(0)}k AED
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Box sx={{ p: 2, borderRadius: 2, background: 'rgba(52, 199, 89, 0.1)', border: '1px solid rgba(52, 199, 89, 0.2)' }}>
                <Typography variant="subtitle2" color="success.main" gutterBottom>
                  Lowest Spending
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {monthlyAnalytics.lowestSpendingMonth.monthName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {(monthlyAnalytics.lowestSpendingMonth.spending / 1000).toFixed(0)}k AED
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Box sx={{ p: 2, borderRadius: 2, background: 'rgba(0, 122, 255, 0.1)', border: '1px solid rgba(0, 122, 255, 0.2)' }}>
                <Typography variant="subtitle2" color="primary.main" gutterBottom>
                  Dataset Coverage
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {monthlyAnalytics.totalMonths} Months
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Complete analysis
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EnhancedMonthlyTrends;