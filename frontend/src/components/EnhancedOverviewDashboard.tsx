import React, { useMemo } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  LinearProgress,
  Avatar,
  Tooltip,
  useTheme,
  Container,
} from '@mui/material';
import {
  AccountBalance,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Restaurant,
  DirectionsCar,
  Home,
  Category,
  AttachMoney,
  Receipt,
  Assessment,
  Timeline,
} from '@mui/icons-material';
import {
  GlassmorphicAreaChart,
  GlassmorphicPieChart,
} from './ChartComponents';

import { useAppContext } from '../context/AppContext';
import { formatCurrency } from '../utils/formatters';

// Icon mapping for categories
const categoryIcons: Record<string, JSX.Element> = {
  'Food & Dining': <Restaurant />,
  'Groceries': <ShoppingCart />,
  'Transportation': <DirectionsCar />,
  'Shopping': <ShoppingCart />,
  'Banking': <AccountBalance />,
  'Home & Garden': <Home />,
  'Utilities': <AttachMoney />,
  'Default': <Category />,
};

// Enhanced Metric Card Component
interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: JSX.Element;
  gradient: string;
  trend?: number;
  trendLabel?: string;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  gradient,
  trend,
  trendLabel,
  onClick,
}) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': onClick ? {
          transform: 'translateY(-4px) scale(1.02)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
        } : {},
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: gradient,
          borderRadius: '20px 20px 0 0',
        },
        position: 'relative',
        overflow: 'visible',
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }}>
              {title}
            </Typography>
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{
                background: gradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem' } }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar
            sx={{
              background: gradient,
              width: { xs: 32, sm: 36, md: 40 },
              height: { xs: 32, sm: 36, md: 40 },
              '& svg': { fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' } },
            }}
          >
            {icon}
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
};

const EnhancedOverviewDashboard: React.FC = () => {
  const { state } = useAppContext();
  const theme = useTheme();

  const analytics = useMemo(() => {
    if (!state.data || !state.filteredTransactions.length) return null;

    const transactions = state.filteredTransactions;
    const totalDebits = transactions.filter(t => t.type === 'Debit').reduce((sum, t) => sum + t.amount, 0);
    const totalCredits = transactions.filter(t => t.type === 'Credit').reduce((sum, t) => sum + t.amount, 0);

    // Balance information
    const currentBalance = state.data.balanceInfo?.closingBalance || 0;
    const openingBalance = state.data.balanceInfo?.openingBalance || 0;
    const balanceChange = currentBalance - openingBalance;

    // Daily spending pattern (last 30 days)
    const dailyData = transactions
      .filter(t => t.type === 'Debit')
      .reduce((acc, t) => {
        const date = new Date(t.date).toLocaleDateString();
        acc[date] = (acc[date] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const chartData = Object.entries(dailyData)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .slice(-30) // Last 30 days
      .map(([date, amount]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount,
      }));

    // Category breakdown
    const categoryData = Object.entries(state.data.summary.byCategory)
      .filter(([category, data]) => data.debit > 0)
      .sort(([, a], [, b]) => b.debit - a.debit)
      .slice(0, 6)
      .map(([category, data]) => ({
        name: category,
        value: data.debit,
        percentage: (data.debit / totalDebits) * 100,
      }));

    // Recent transactions
    const recentTransactions = transactions
      .slice(0, 5)
      .map(t => ({
        ...t,
        icon: categoryIcons[t.category] || categoryIcons.Default,
      }));

    return {
      totalDebits,
      totalCredits,
      netAmount: totalCredits - totalDebits,
      currentBalance,
      balanceChange,
      avgTransaction: totalDebits / Math.max(1, transactions.filter(t => t.type === 'Debit').length),
      chartData,
      categoryData,
      recentTransactions,
      totalTransactions: transactions.length,
    };
  }, [state.data, state.filteredTransactions]);

  if (!analytics || !state.data) {
    return (
      <Box sx={{ 
        height: 'calc(100vh - 160px)', 
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography variant="h6" color="text.secondary" textAlign="center">
          {!state.data ? 'Loading financial data...' : 'No transaction data available'}
        </Typography>
      </Box>
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
      <Box sx={{ flexShrink: 0 }}>
        <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 700 }}>
          Financial Overview
        </Typography>
      </Box>
      
      {/* Key Metrics Row - Compact */}
      <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ flexShrink: 0 }}>
        <Grid item xs={6} sm={3}>
          <MetricCard
            title="Balance"
            value={formatCurrency(analytics.currentBalance, { compactNumbers: state.compactNumbers })}
            subtitle={`${analytics.balanceChange >= 0 ? '+' : ''}${formatCurrency(analytics.balanceChange, { compactNumbers: state.compactNumbers })}`}
            icon={<AccountBalance />}
            gradient="linear-gradient(135deg, #007AFF 0%, #40A9FF 100%)"
          />
        </Grid>

        <Grid item xs={6} sm={3}>
          <MetricCard
            title="Spent"
            value={formatCurrency(analytics.totalDebits, { compactNumbers: state.compactNumbers })}
            subtitle={`${state.filteredTransactions.filter(t => t.type === 'Debit').length} txns`}
            icon={<TrendingDown />}
            gradient="linear-gradient(135deg, #FF3B30 0%, #FF6482 100%)"
          />
        </Grid>

        <Grid item xs={6} sm={3}>
          <MetricCard
            title="Income"
            value={formatCurrency(analytics.totalCredits, { compactNumbers: state.compactNumbers })}
            subtitle={`${state.filteredTransactions.filter(t => t.type === 'Credit').length} txns`}
            icon={<TrendingUp />}
            gradient="linear-gradient(135deg, #34C759 0%, #5ED17A 100%)"
          />
        </Grid>

        <Grid item xs={6} sm={3}>
          <MetricCard
            title="Avg"
            value={formatCurrency(analytics.avgTransaction, { compactNumbers: state.compactNumbers })}
            subtitle="per transaction"
            icon={<Receipt />}
            gradient="linear-gradient(135deg, #FF9500 0%, #FFB340 100%)"
          />
        </Grid>
      </Grid>

      {/* FIXED: Proper Grid Layout with Stack Overflow Solutions */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {/* Daily Spending Chart */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Daily Spending Trend
              </Typography>
              <GlassmorphicAreaChart
                data={analytics.chartData}
                areas={[{
                  dataKey: 'amount',
                  color: theme.palette.primary.main,
                  name: 'Daily Spending',
                }]}
                height={500}
                xAxisKey="date"
                formatter={(value: any) => [
                  formatCurrency(Number(value), { compactNumbers: state.compactNumbers }),
                  'Amount'
                ]}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Category Pie Chart */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Top Categories
              </Typography>
              <GlassmorphicPieChart
                data={analytics.categoryData}
                dataKey="value"
                nameKey="name"
                colors={colors}
                height={500}
                formatter={(value: any, name) => [
                  formatCurrency(Number(value), { compactNumbers: state.compactNumbers }),
                  name
                ]}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Transactions - Compact */}
      <Card sx={{ flexShrink: 0 }}>
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
            Recent Transactions
          </Typography>
          <Stack spacing={1}>
            {analytics.recentTransactions.slice(0, 3).map((transaction, index) => (
              <Stack
                key={index}
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ p: 1, borderRadius: 1, bgcolor: 'action.hover' }}
              >
                <Avatar sx={{ 
                  width: 32, 
                  height: 32,
                  background: `linear-gradient(135deg, ${colors[index % colors.length]}, ${colors[(index + 1) % colors.length]})`,
                }}>
                  {transaction.icon}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={500} noWrap>
                    {transaction.merchant}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {transaction.category}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color={transaction.type === 'Credit' ? 'success.main' : 'error.main'}
                >
                  {transaction.type === 'Credit' ? '+' : ''}
                  {formatCurrency(transaction.amount, { compactNumbers: state.compactNumbers })}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EnhancedOverviewDashboard;