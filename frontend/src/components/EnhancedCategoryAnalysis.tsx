import React, { useMemo, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  LinearProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  PieChart,
  TrendingUp,
  TrendingDown,
  Category,
  ShoppingCart,
  Restaurant,
  DirectionsCar,
  Home,
  LocalGasStation,
  AttachMoney,
  Assessment,
} from '@mui/icons-material';
import {
  GlassmorphicPieChart,
  GlassmorphicBarChart,
} from './ChartComponents';

import { useAppContext } from '../context/AppContext';

// Category icons mapping
const categoryIcons: Record<string, JSX.Element> = {
  'Food & Dining': <Restaurant />,
  'Groceries': <ShoppingCart />,
  'Transportation': <DirectionsCar />,
  'Shopping': <ShoppingCart />,
  'Home & Garden': <Home />,
  'Utilities': <AttachMoney />,
  'Fuel': <LocalGasStation />,
  'Banking': <AttachMoney />,
  'Default': <Category />,
};

interface CategoryData {
  name: string;
  spending: number;
  income: number;
  netAmount: number;
  percentage: number;
  transactionCount: number;
  avgTransaction: number;
  trend: number;
  icon: JSX.Element;
}

const EnhancedCategoryAnalysis: React.FC = () => {
  const { state } = useAppContext();
  const [viewMode, setViewMode] = useState<'spending' | 'income' | 'net'>('spending');
  const [sortBy, setSortBy] = useState<'amount' | 'count' | 'avg'>('amount');
  const theme = useTheme();

  const categoryAnalytics = useMemo(() => {
    if (!state.data || !state.filteredTransactions.length) return null;

    const transactions = state.filteredTransactions;
    const totalSpending = transactions.filter(t => t.type === 'Debit').reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = transactions.filter(t => t.type === 'Credit').reduce((sum, t) => sum + t.amount, 0);

    // Calculate category statistics
    const categoryStats = new Map<string, {
      spending: number;
      income: number;
      count: number;
      transactions: typeof transactions;
    }>();

    transactions.forEach(transaction => {
      const category = transaction.category;
      if (!categoryStats.has(category)) {
        categoryStats.set(category, { spending: 0, income: 0, count: 0, transactions: [] });
      }
      
      const stats = categoryStats.get(category)!;
      if (transaction.type === 'Debit') {
        stats.spending += transaction.amount;
      } else {
        stats.income += transaction.amount;
      }
      stats.count++;
      stats.transactions.push(transaction);
    });

    // Convert to array and add derived metrics
    const categoryData: CategoryData[] = Array.from(categoryStats.entries()).map(([name, stats]) => {
      const netAmount = stats.income - stats.spending;
      const percentage = viewMode === 'spending' 
        ? (stats.spending / totalSpending) * 100
        : viewMode === 'income'
        ? (stats.income / totalIncome) * 100
        : Math.abs(netAmount) / (totalSpending + totalIncome) * 100;

      const avgTransaction = viewMode === 'spending'
        ? stats.spending / Math.max(1, stats.transactions.filter(t => t.type === 'Debit').length)
        : viewMode === 'income'
        ? stats.income / Math.max(1, stats.transactions.filter(t => t.type === 'Credit').length)
        : (stats.spending + stats.income) / stats.count;

      return {
        name,
        spending: stats.spending,
        income: stats.income,
        netAmount,
        percentage,
        transactionCount: stats.count,
        avgTransaction,
        trend: 0, // Would need historical data to calculate
        icon: categoryIcons[name] || categoryIcons.Default,
      };
    });

    // Sort categories
    const sortedCategories = categoryData.sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return viewMode === 'spending' ? b.spending - a.spending :
                 viewMode === 'income' ? b.income - a.income :
                 Math.abs(b.netAmount) - Math.abs(a.netAmount);
        case 'count':
          return b.transactionCount - a.transactionCount;
        case 'avg':
          return b.avgTransaction - a.avgTransaction;
        default:
          return b.spending - a.spending;
      }
    });

    // Prepare chart data
    const chartData = sortedCategories.slice(0, 8).map((category, index) => ({
      ...category,
      value: viewMode === 'spending' ? category.spending :
             viewMode === 'income' ? category.income :
             Math.abs(category.netAmount),
      color: theme.palette.mode === 'dark' 
        ? `hsl(${(index * 45) % 360}, 70%, 60%)`
        : `hsl(${(index * 45) % 360}, 60%, 50%)`,
    }));

    return {
      categoryData: sortedCategories,
      chartData,
      totalSpending,
      totalIncome,
      totalCategories: categoryData.length,
    };
  }, [state.data, state.filteredTransactions, viewMode, sortBy, theme.palette.mode]);

  if (!categoryAnalytics) {
    return (
      <Typography variant="h6" color="text.secondary" textAlign="center" py={4}>
        No category data available
      </Typography>
    );
  }

  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
    '#9C27B0',
    '#FF5722',
  ];

  return (
    <Box sx={{ height: 'calc(100vh - 160px)', p: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Header Controls */}
      <Card sx={{ mb: 2, flexShrink: 0, minHeight: '80px' }}>
        <CardContent sx={{ py: { xs: 1, sm: 1.5 }, px: { xs: 1, sm: 2 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Assessment color="primary" />
              <Typography variant="h5" fontWeight={600} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                Category Analysis
              </Typography>
              <Chip 
                label={`${categoryAnalytics.totalCategories} categories`}
                size="small"
                variant="outlined"
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 2 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>View Mode</InputLabel>
                <Select
                  value={viewMode}
                  label="View Mode"
                  onChange={(e) => setViewMode(e.target.value as any)}
                >
                  <MenuItem value="spending">Spending</MenuItem>
                  <MenuItem value="income">Income</MenuItem>
                  <MenuItem value="net">Net Amount</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <MenuItem value="amount">Amount</MenuItem>
                  <MenuItem value="count">Count</MenuItem>
                  <MenuItem value="avg">Average</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Grid container spacing={2} sx={{ flex: 1, minHeight: 0 }}>
        {/* Charts Section */}
        <Grid item xs={12} lg={8}>
          <Stack spacing={2}>
            {/* Top Charts Row */}
            <Grid container spacing={2} sx={{ height: '500px' }}>
              {/* Category Distribution Chart */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: { xs: 1, sm: 1.5, md: 2 } }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: { xs: 0.5, sm: 1 }, fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' } }}>
                      Distribution ({viewMode})
                    </Typography>
                    
                    <Box sx={{ flex: 1, minHeight: 0 }}>
                      <GlassmorphicPieChart
                        data={categoryAnalytics.chartData}
                        dataKey="value"
                        nameKey="name"
                        colors={colors}
                        height="100%"
                        innerRadius={80}
                        outerRadius={180}
                        formatter={(value: any, name) => [
                          `${Number(value).toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}`,
                          viewMode.charAt(0).toUpperCase() + viewMode.slice(1)
                        ]}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Top Categories Bar Chart */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: { xs: 1, sm: 1.5, md: 2 } }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: { xs: 0.5, sm: 1 }, fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' } }}>
                      Top Categories
                    </Typography>
                    
                    <Box sx={{ flex: 1, minHeight: 0 }}>
                      <GlassmorphicBarChart
                        data={categoryAnalytics.chartData.slice(0, 6)}
                        bars={[
                          {
                            dataKey: 'value',
                            color: theme.palette.primary.main,
                            name: viewMode.charAt(0).toUpperCase() + viewMode.slice(1),
                          },
                        ]}
                        height="100%"
                        xAxisKey="name"
                        layout="horizontal"
                        formatter={(value: any) => [
                          `${Number(value).toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}`,
                          viewMode.charAt(0).toUpperCase() + viewMode.slice(1)
                        ]}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Category Comparison Chart */}
            <Card sx={{ height: '300px' }}>
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                  Spending vs Income Comparison
                </Typography>
                
                <Box sx={{ flex: 1, minHeight: 0 }}>
                  <GlassmorphicBarChart
                    data={categoryAnalytics.categoryData.slice(0, 8)}
                    bars={[
                      {
                        dataKey: 'spending',
                        color: theme.palette.error.main,
                        name: 'Spending',
                      },
                      {
                        dataKey: 'income',
                        color: theme.palette.success.main,
                        name: 'Income',
                      },
                    ]}
                    height="100%"
                    xAxisKey="name"
                    layout="vertical"
                    formatter={(value: any, name) => [
                    `${Number(value).toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}`,
                    name
                  ]}
                />
              </Box>
            </CardContent>
          </Card>
          </Stack>
        </Grid>

        {/* Category Table Section */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '300px' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1, flexShrink: 0 }}>
                Category Breakdown
              </Typography>
              
              <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                <TableContainer sx={{ height: '100%' }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Category</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="right">%</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {categoryAnalytics.categoryData.slice(0, 8).map((category, index) => (
                        <TableRow 
                          key={category.name}
                          sx={{ 
                            '&:hover': { 
                              backgroundColor: 'rgba(255, 255, 255, 0.05)' 
                            }
                          }}
                        >
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Avatar
                                sx={{
                                  width: 20,
                                  height: 20,
                                  background: `linear-gradient(135deg, ${colors[index % colors.length]}, ${colors[(index + 1) % colors.length]})`,
                                  '& svg': { fontSize: '0.75rem' },
                                }}
                              >
                                {category.icon}
                              </Avatar>
                              <Typography variant="body2" fontWeight={500} noWrap sx={{ fontSize: '0.875rem' }}>
                                {category.name.length > 12 ? category.name.substring(0, 12) + '...' : category.name}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="right">
                            <Typography 
                              variant="body2" 
                              color={viewMode === 'spending' ? 'error.main' : viewMode === 'income' ? 'success.main' : category.netAmount >= 0 ? 'success.main' : 'error.main'}
                              sx={{ fontSize: '0.875rem' }}
                            >
                              {((viewMode === 'spending' ? category.spending : viewMode === 'income' ? category.income : Math.abs(category.netAmount)) / 1000).toFixed(0)}k
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Stack alignItems="flex-end" spacing={0.5}>
                              <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.875rem' }}>
                                {category.percentage.toFixed(1)}%
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(category.percentage, 100)}
                                sx={{
                                  width: 30,
                                  height: 3,
                                  borderRadius: 2,
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: colors[index % colors.length],
                                  },
                                }}
                              />
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EnhancedCategoryAnalysis;