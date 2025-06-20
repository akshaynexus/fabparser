import React, { useState, useMemo } from 'react';
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
  Alert,
  LinearProgress,
  Paper,
  Divider,
  Container,
  useTheme,
} from '@mui/material';
import {
  GlassmorphicBarChart,
  GlassmorphicPieChart,
  GlassmorphicLineChart,
  GlassmorphicAreaChart,
} from './ChartComponents';
import {
  TrendingUp,
  TrendingDown,
  Analytics,
  Schedule,
  AttachMoney,
  Receipt,
  Category,
  Timeline,
} from '@mui/icons-material';
import { Transaction, TransactionSummary } from '../App';

interface TransactionAnalyticsProps {
  data: TransactionSummary;
  filteredTransactions: Transaction[];
}

const TransactionAnalytics: React.FC<TransactionAnalyticsProps> = ({ 
  data, 
  filteredTransactions 
}) => {
  const [analysisType, setAnalysisType] = useState('overview');
  const theme = useTheme();
  

  const analytics = useMemo(() => {
    const transactions = filteredTransactions.length > 0 ? filteredTransactions : data.transactions;
    
    if (!transactions || transactions.length === 0) {
      return null;
    }

    // Daily spending pattern
    const dailySpending = transactions.reduce((acc, t) => {
      if (t.type === 'Debit') {
        const day = new Date(t.date).toLocaleDateString();
        acc[day] = (acc[day] || 0) + t.amount;
      }
      return acc;
    }, {} as Record<string, number>);

    const dailyData = Object.entries(dailySpending)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, amount]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount,
        fullDate: date,
      }));

    // Category distribution with percentages
    const categoryTotals = transactions.reduce((acc, t) => {
      if (t.type === 'Debit') {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
      }
      return acc;
    }, {} as Record<string, number>);

    const totalSpent = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
    const categoryData = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalSpent) * 100,
        count: transactions.filter(t => t.category === category && t.type === 'Debit').length,
      }));

    // Transaction size distribution
    const sizeDistribution = [
      { range: '< 50', min: 0, max: 50, count: 0, total: 0 },
      { range: '50-200', min: 50, max: 200, count: 0, total: 0 },
      { range: '200-500', min: 200, max: 500, count: 0, total: 0 },
      { range: '500-1000', min: 500, max: 1000, count: 0, total: 0 },
      { range: '1000+', min: 1000, max: Infinity, count: 0, total: 0 },
    ];

    transactions.forEach(t => {
      if (t.type === 'Debit') {
        const bucket = sizeDistribution.find(s => t.amount >= s.min && t.amount < s.max);
        if (bucket) {
          bucket.count++;
          bucket.total += t.amount;
        }
      }
    });

    // Monthly trends
    const monthlyTrends = transactions.reduce((acc, t) => {
      const month = new Date(t.date).toISOString().substring(0, 7);
      if (!acc[month]) {
        acc[month] = { month, debits: 0, credits: 0, transactions: 0 };
      }
      if (t.type === 'Debit') {
        acc[month].debits += t.amount;
      } else {
        acc[month].credits += t.amount;
      }
      acc[month].transactions++;
      return acc;
    }, {} as Record<string, any>);

    const trendData = Object.values(monthlyTrends).sort((a: any, b: any) => 
      a.month.localeCompare(b.month)
    );

    // Merchant analysis
    const merchantSpending = transactions.reduce((acc, t) => {
      if (t.type === 'Debit') {
        acc[t.merchant] = (acc[t.merchant] || 0) + t.amount;
      }
      return acc;
    }, {} as Record<string, number>);

    const topMerchants = Object.entries(merchantSpending)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([merchant, amount]) => ({
        merchant,
        amount,
        transactions: transactions.filter(t => t.merchant === merchant && t.type === 'Debit').length,
      }));

    return {
      dailyData,
      categoryData,
      sizeDistribution,
      trendData,
      topMerchants,
      totalSpent,
      avgDailySpending: totalSpent / Math.max(1, dailyData.length),
      avgTransactionSize: totalSpent / Math.max(1, transactions.filter(t => t.type === 'Debit').length),
    };
  }, [data, filteredTransactions]);

  if (!analytics) {
    return (
      <Alert severity="info">
        No transaction data available for analysis.
      </Alert>
    );
  }

  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
  ];

  const StatCard = ({ icon, title, value, subtitle, trend, color }: any) => (
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ 
            p: 1, 
            borderRadius: 2, 
            backgroundColor: `${color}20`,
            color: color,
          }}>
            {icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" color={color}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {trend && (
            <Box sx={{ textAlign: 'center' }}>
              {trend > 0 ? (
                <TrendingUp color="success" />
              ) : (
                <TrendingDown color="error" />
              )}
              <Typography variant="caption" color={trend > 0 ? 'success.main' : 'error.main'}>
                {Math.abs(trend).toFixed(1)}%
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      p: { xs: 1, sm: 2 },
      overflow: 'auto'
    }}>
      {/* Header */}
      <Card sx={{ flexShrink: 0 }}>
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            justifyContent="space-between" 
            alignItems={{ xs: 'stretch', sm: 'center' }} 
            spacing={2}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Analytics color="primary" />
              <Typography variant="h5" fontWeight={600}>
                Analytics
              </Typography>
            </Stack>
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
              <InputLabel>Analysis Type</InputLabel>
              <Select
                value={analysisType}
                label="Analysis Type"
                onChange={(e) => setAnalysisType(e.target.value)}
              >
                <MenuItem value="overview">Overview</MenuItem>
                <MenuItem value="trends">Trends & Patterns</MenuItem>
                <MenuItem value="categories">Category Deep Dive</MenuItem>
                <MenuItem value="merchants">Merchant Analysis</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {/* Content Area */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {analysisType === 'overview' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
            {/* Key Metrics Row - Compact */}
            <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ flexShrink: 0 }}>
              <Grid item xs={6} sm={3}>
                <StatCard
                  icon={<AttachMoney />}
                  title="Total Spent"
                  value={`${(analytics.totalSpent / 1000).toFixed(0)}k AED`}
                  subtitle={`${filteredTransactions.filter(t => t.type === 'Debit').length} txns`}
                  color={theme.palette.error.main}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <StatCard
                  icon={<Schedule />}
                  title="Daily Avg"
                  value={`${(analytics.avgDailySpending / 1000).toFixed(1)}k AED`}
                  subtitle="Active days"
                  color={theme.palette.warning.main}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <StatCard
                  icon={<Receipt />}
                  title="Avg Transaction"
                  value={`${(analytics.avgTransactionSize / 1000).toFixed(1)}k AED`}
                  subtitle="Per transaction"
                  color={theme.palette.info.main}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <StatCard
                  icon={<Category />}
                  title="Top Category"
                  value={analytics.categoryData[0]?.category.split(' ')[0] || 'N/A'}
                  subtitle={`${analytics.categoryData[0]?.percentage.toFixed(1)}%`}
                  color={theme.palette.success.main}
                />
              </Grid>
            </Grid>

            {/* Smart Responsive Chart */}
            <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ flexShrink: 0 }}>
              <Grid item xs={12}>
                <Card sx={{ height: 'fit-content' }}>
                  <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                      Daily Spending Pattern
                    </Typography>
                    <GlassmorphicAreaChart
                      data={analytics.dailyData}
                      areas={[{
                        dataKey: 'amount',
                        color: theme.palette.primary.main,
                        name: 'Daily Spending',
                      }]}
                      height={400}
                      xAxisKey="date"
                      formatter={(value: any) => [
                        `${Number(value).toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}`,
                        'Amount'
                      ]}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Size Distribution - Compact */}
            <Card sx={{ flexShrink: 0 }}>
              <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                  Transaction Size Distribution
                </Typography>
                <Stack spacing={2}>
                  {analytics.sizeDistribution.map((bucket, index) => (
                    <Box key={bucket.range}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">{bucket.range} AED</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {bucket.count}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={(bucket.count / Math.max(...analytics.sizeDistribution.map(s => s.count))) * 100}
                        sx={{ 
                          height: 6, 
                          borderRadius: 3,
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: colors[index % colors.length],
                          }
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Box>
        )}

        {analysisType === 'trends' && (
          <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ flexShrink: 0 }}>
            <Grid item xs={12}>
              <Card sx={{ height: 'fit-content' }}>
                <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                    Monthly Spending Trends
                  </Typography>
                  <GlassmorphicLineChart
                    data={analytics.trendData}
                    lines={[
                      {
                        dataKey: 'debits',
                        color: theme.palette.error.main,
                        name: 'Expenses',
                      },
                      {
                        dataKey: 'credits',
                        color: theme.palette.success.main,
                        name: 'Income',
                      },
                    ]}
                    height={400}
                    xAxisKey="month"
                    formatter={(value: any, name) => [
                      `${Number(value).toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}`,
                      name
                    ]}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {analysisType === 'categories' && (
          <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ flexShrink: 0 }}>
            <Grid item xs={12} lg={6}>
              <Card sx={{ height: 'fit-content' }}>
                <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                    Category Distribution
                  </Typography>
                  <GlassmorphicPieChart
                    data={analytics.categoryData.slice(0, 6)}
                    dataKey="amount"
                    nameKey="category"
                    colors={colors}
                    height={400}
                    formatter={(value: any) => [
                      `${Number(value).toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}`,
                      'Amount'
                    ]}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} lg={6}>
              <Card sx={{ height: 'fit-content' }}>
                <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                    Category Breakdown
                  </Typography>
                  <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                    <Stack spacing={2}>
                      {analytics.categoryData.slice(0, 8).map((category, index) => (
                        <Box key={category.category}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2">{category.category}</Typography>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="body2" color="text.secondary">
                                {category.percentage.toFixed(1)}%
                              </Typography>
                              <Typography variant="body2">
                                {(category.amount / 1000).toFixed(0)}k
                              </Typography>
                            </Stack>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={category.percentage}
                            sx={{ 
                              height: 6, 
                              borderRadius: 3,
                              backgroundColor: 'rgba(0,0,0,0.1)',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: colors[index % colors.length],
                              }
                            }}
                          />
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {analysisType === 'merchants' && (
          <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ flexShrink: 0 }}>
            <Grid item xs={12}>
              <Card sx={{ height: 'fit-content' }}>
                <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                    Top Merchants by Spending
                  </Typography>
                  <GlassmorphicBarChart
                    data={analytics.topMerchants}
                    bars={[
                      {
                        dataKey: 'amount',
                        color: theme.palette.primary.main,
                        name: 'Total Spent',
                      },
                    ]}
                    height={400}
                    xAxisKey="merchant"
                    layout="horizontal"
                    formatter={(value: any) => [
                      `${Number(value).toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}`,
                      'Total Spent'
                    ]}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default TransactionAnalytics;