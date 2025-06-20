import React, { useMemo } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  LinearProgress,
  Chip,
  Divider,
  Container,
  useTheme,
} from '@mui/material';
import {
  AccountBalance,
  TrendingUp,
  TrendingDown,
  CalendarMonth,
  Assessment,
  Timeline,
  AttachMoney,
  Savings,
} from '@mui/icons-material';
import {
  GlassmorphicLineChart,
  GlassmorphicAreaChart,
  GlassmorphicBarChart,
} from './ChartComponents';

import { useAppContext } from '../context/AppContext';

interface BalanceCardProps {
  title: string;
  amount: number;
  subtitle?: string;
  icon: JSX.Element;
  gradient: string;
  trend?: number;
  isPositive?: boolean;
}

const BalanceCard: React.FC<BalanceCardProps> = ({
  title,
  amount,
  subtitle,
  icon,
  gradient,
  trend,
  isPositive = true,
}) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: gradient,
        },
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              {title}
            </Typography>
            <Box
              sx={{
                p: { xs: 1, sm: 1.5 },
                borderRadius: 2,
                background: `${gradient}20`,
                color: theme.palette.primary.main,
              }}
            >
              {icon}
            </Box>
          </Stack>

          <Box>
            <Typography
              variant="h4"
              fontWeight={700}
              color={isPositive ? 'text.primary' : 'error.main'}
              sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' } }}
            >
              {amount.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>

          {trend !== undefined && (
            <Stack direction="row" alignItems="center" spacing={1}>
              {trend >= 0 ? (
                <TrendingUp sx={{ color: 'success.main', fontSize: '1rem' }} />
              ) : (
                <TrendingDown sx={{ color: 'error.main', fontSize: '1rem' }} />
              )}
              <Typography
                variant="caption"
                color={trend >= 0 ? 'success.main' : 'error.main'}
                fontWeight={600}
              >
                {Math.abs(trend).toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                vs last period
              </Typography>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

const EnhancedBalanceSummary: React.FC = () => {
  const { state } = useAppContext();
  const theme = useTheme();

  const balanceAnalytics = useMemo(() => {
    if (!state.data?.balanceInfo) return null;

    const { balanceInfo } = state.data;
    const monthlyBalances = balanceInfo.monthlyBalances || {};

    // Calculate trends
    const currentBalance = balanceInfo.closingBalance || 0;
    const openingBalance = balanceInfo.openingBalance || 0;
    const netChange = balanceInfo.netChange || 0;

    // Monthly balance trend data
    const monthlyData = Object.entries(monthlyBalances)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        opening: data.openingBalance || 0,
        closing: data.closingBalance || 0,
        change: (data.closingBalance || 0) - (data.openingBalance || 0),
        netChange: data.netChange || 0,
      }));

    // Balance distribution analysis
    const totalInflow = balanceInfo.actualMoneyInFlow || 0;
    const totalOutflow = balanceInfo.actualMoneyOutFlow || 0;
    const netFlow = balanceInfo.netMoneyFlow || 0;

    // Health metrics
    const balanceGrowthRate = openingBalance > 0 ? (netChange / openingBalance) * 100 : 0;
    const avgMonthlyChange = monthlyData.length > 0 
      ? monthlyData.reduce((sum, month) => sum + month.change, 0) / monthlyData.length 
      : 0;

    return {
      currentBalance,
      openingBalance,
      netChange,
      totalInflow,
      totalOutflow,
      netFlow,
      balanceGrowthRate,
      avgMonthlyChange,
      monthlyData,
      reconciled: Math.abs((balanceInfo.reconciledNetFlow || 0) - netFlow) < 100,
    };
  }, [state.data]);

  if (!balanceAnalytics) {
    return (
      <Typography variant="h6" color="text.secondary" textAlign="center" py={4}>
        No balance information available
      </Typography>
    );
  }

  return (
    <Box sx={{ 
      height: 'calc(100vh - 160px)', 
      p: 1,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Balance Overview Cards */}
      <Grid container spacing={2} sx={{ mb: 2, flexShrink: 0, height: '160px' }}>
        <Grid item xs={6} sm={6} lg={3}>
          <Box sx={{ height: '100%' }}>
            <BalanceCard
              title="Current Balance"
              amount={balanceAnalytics.currentBalance}
              subtitle={`${balanceAnalytics.netChange >= 0 ? 'Increased' : 'Decreased'} from opening`}
              icon={<AccountBalance />}
              gradient="linear-gradient(135deg, #007AFF 0%, #40A9FF 100%)"
              trend={balanceAnalytics.balanceGrowthRate}
              isPositive={balanceAnalytics.currentBalance >= 0}
            />
          </Box>
        </Grid>

        <Grid item xs={6} sm={6} lg={3}>
          <Box sx={{ height: '100%' }}>
            <BalanceCard
              title="Net Change"
              amount={balanceAnalytics.netChange}
              subtitle="Total period change"
              icon={<Assessment />}
              gradient={balanceAnalytics.netChange >= 0 
                ? "linear-gradient(135deg, #34C759 0%, #5ED17A 100%)"
                : "linear-gradient(135deg, #FF3B30 0%, #FF6482 100%)"
              }
              isPositive={balanceAnalytics.netChange >= 0}
            />
          </Box>
        </Grid>

        <Grid item xs={6} sm={6} lg={3}>
          <Box sx={{ height: '100%' }}>
            <BalanceCard
              title="Total Inflow"
              amount={balanceAnalytics.totalInflow}
              subtitle="Money received"
              icon={<TrendingUp />}
              gradient="linear-gradient(135deg, #34C759 0%, #5ED17A 100%)"
            />
          </Box>
        </Grid>

        <Grid item xs={6} sm={6} lg={3}>
          <Box sx={{ height: '100%' }}>
            <BalanceCard
              title="Total Outflow"
              amount={balanceAnalytics.totalOutflow}
              subtitle="Money spent"
              icon={<TrendingDown />}
              gradient="linear-gradient(135deg, #FF3B30 0%, #FF6482 100%)"
            />
          </Box>
        </Grid>
      </Grid>

      {/* Main Charts Row */}
      <Grid container spacing={2} sx={{ flex: 1, minHeight: 0, mb: 2 }}>
        {/* Balance Trend Chart */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: { xs: 1, sm: 1.5, md: 2 } }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' } }}>
                  Balance Trend Over Time
                </Typography>
                <Chip
                  label={balanceAnalytics.reconciled ? 'Reconciled' : 'Needs Review'}
                  color={balanceAnalytics.reconciled ? 'success' : 'warning'}
                  size="small"
                  variant="outlined"
                />
              </Stack>
              
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <GlassmorphicAreaChart
                  data={balanceAnalytics.monthlyData}
                  areas={[
                    {
                      dataKey: 'closing',
                      color: theme.palette.primary.main,
                      name: 'Closing Balance',
                    },
                    {
                      dataKey: 'opening',
                      color: theme.palette.secondary.main,
                      name: 'Opening Balance',
                    },
                  ]}
                  height="100%"
                  xAxisKey="month"
                  formatter={(value: any, name) => [
                    `${Number(value).toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}`,
                    name
                  ]}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Changes */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: { xs: 1, sm: 1.5, md: 2 } }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: { xs: 0.5, sm: 1 }, fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' } }}>
                Monthly Changes
              </Typography>
              
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <GlassmorphicBarChart
                  data={balanceAnalytics.monthlyData}
                  bars={[
                    {
                      dataKey: 'change',
                      color: theme.palette.primary.main,
                      name: 'Net Change',
                    },
                  ]}
                  height="100%"
                  xAxisKey="month"
                  layout="vertical"
                  formatter={(value: any) => [
                    `${Number(value).toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}`,
                    'Net Change'
                  ]}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Financial Health Metrics */}
      <Card sx={{ flexShrink: 0 }}>
        <CardContent sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: { xs: 1, md: 2 }, fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' } }}>
            Financial Health Metrics
          </Typography>

          <Grid container spacing={{ xs: 1, sm: 1.5, md: 2 }}>
            <Grid item xs={12} sm={4}>
              <Box
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  borderRadius: 2,
                  background: 'rgba(52, 199, 89, 0.1)',
                  border: '1px solid rgba(52, 199, 89, 0.2)',
                  textAlign: 'center',
                }}
              >
                <Typography variant="subtitle2" color="success.main" gutterBottom>
                  Growth Rate
                </Typography>
                <Typography variant="h5" fontWeight={700} color="success.main">
                  {balanceAnalytics.balanceGrowthRate.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Overall period growth
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Box
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  borderRadius: 2,
                  background: 'rgba(0, 122, 255, 0.1)',
                  border: '1px solid rgba(0, 122, 255, 0.2)',
                  textAlign: 'center',
                }}
              >
                <Typography variant="subtitle2" color="primary.main" gutterBottom>
                  Avg Monthly Change
                </Typography>
                <Typography variant="h5" fontWeight={700} color="primary.main">
                  {(balanceAnalytics.avgMonthlyChange / 1000).toFixed(0)}k
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average monthly trend
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Box
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  borderRadius: 2,
                  background: balanceAnalytics.reconciled 
                    ? 'rgba(52, 199, 89, 0.1)' 
                    : 'rgba(255, 149, 0, 0.1)',
                  border: balanceAnalytics.reconciled 
                    ? '1px solid rgba(52, 199, 89, 0.2)' 
                    : '1px solid rgba(255, 149, 0, 0.2)',
                  textAlign: 'center',
                }}
              >
                <Typography 
                  variant="subtitle2" 
                  color={balanceAnalytics.reconciled ? 'success.main' : 'warning.main'} 
                  gutterBottom
                >
                  Reconciliation
                </Typography>
                <Typography 
                  variant="h6" 
                  fontWeight={700} 
                  color={balanceAnalytics.reconciled ? 'success.main' : 'warning.main'}
                >
                  {balanceAnalytics.reconciled ? 'Balanced' : 'Review'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Transaction accuracy
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EnhancedBalanceSummary;