import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  LinearProgress,
  Paper,
  Stack,
  Chip,
  Divider,
  useTheme,
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
  Speed,
  Timeline,
  Assessment,
  LocalMall,
  Restaurant as RestaurantIcon,
  LocalGasStation,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, AreaChart, Area } from 'recharts';
import { TransactionSummary, Transaction } from '../App';

interface OverviewDashboardProps {
  data: TransactionSummary;
  filteredTransactions: Transaction[];
}

const COLORS = [
  '#007AFF', '#FF9500', '#34C759', '#FF3B30', '#AF52DE', '#00C7BE', '#FFD60A', '#FF6482'
];

const categoryIcons: Record<string, JSX.Element> = {
  'Food & Dining': <RestaurantIcon />,
  'Groceries': <LocalMall />,
  'Transportation': <DirectionsCar />,
  'Shopping': <ShoppingCart />,
  'Banking': <AccountBalance />,
  'Travel': <TrendingUp />,
  'Home & Garden': <Home />,
  'Utilities': <AttachMoney />,
  'Fuel': <LocalGasStation />,
  'Default': <Category />,
};

const GlassCard: React.FC<{
  title: string;
  value: string;
  subtitle?: string;
  icon: JSX.Element;
  gradient: string;
  trend?: number;
  change?: string;
}> = ({ title, value, subtitle, icon, gradient, trend, change }) => {
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
        }
      }}
    >
      <CardContent sx={{ pb: 2 }}>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              {title}
            </Typography>
            <Avatar 
              sx={{ 
                background: gradient,
                width: 40, 
                height: 40,
                '& svg': { fontSize: '1.2rem' }
              }}
            >
              {icon}
            </Avatar>
          </Stack>
          
          <Stack spacing={0.5}>
            <Typography variant="h4" fontWeight={700} sx={{ lineHeight: 1.2 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Stack>
          
          {(trend !== undefined || change) && (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              {trend !== undefined && (
                <>
                  {trend > 0 ? 
                    <TrendingUp sx={{ color: 'success.main', fontSize: '1rem' }} /> : 
                    <TrendingDown sx={{ color: 'error.main', fontSize: '1rem' }} />
                  }
                  <Typography 
                    variant="caption" 
                    color={trend > 0 ? 'success.main' : 'error.main'}
                    fontWeight={600}
                  >
                    {Math.abs(trend).toFixed(1)}%
                  </Typography>
                </>
              )}
              {change && (
                <Chip 
                  label={change} 
                  size="small" 
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              )}
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ data, filteredTransactions }) => {
  const theme = useTheme();
  
  // Calculate metrics based on filtered transactions
  const totalDebits = filteredTransactions.filter(t => t.type === 'Debit').reduce((sum, t) => sum + t.amount, 0);
  const totalCredits = filteredTransactions.filter(t => t.type === 'Credit').reduce((sum, t) => sum + t.amount, 0);
  const netAmount = totalCredits - totalDebits;
  
  // Use actual balance information
  const currentBalance = data.balanceInfo?.closingBalance || 0;
  const balanceChange = data.balanceInfo?.netChange || 0;
  const openingBalance = data.balanceInfo?.openingBalance || 0;

  // Get monthly data for trends - use balance info instead of transaction flow
  const monthlyData = Object.entries(data.summary.byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, summary]) => {
      const balanceInfo = data.balanceInfo?.monthlyBalances?.[month];
      return {
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        debits: summary.debit,
        credits: summary.credit,
        net: balanceInfo?.netChange || (summary.credit - summary.debit),
        openingBalance: balanceInfo?.openingBalance || 0,
        closingBalance: balanceInfo?.closingBalance || 0,
        transactions: summary.count,
      };
    });

  // Get category data for pie chart
  const categoryData = Object.entries(data.summary.byCategory)
    .filter(([category]) => category !== 'Tax') // Exclude small tax transactions
    .sort(([, a], [, b]) => (b.debit + b.credit) - (a.debit + a.credit))
    .slice(0, 8) // Top 8 categories
    .map(([category, summary]) => ({
      name: category,
      value: summary.debit + summary.credit,
      debit: summary.debit,
      credit: summary.credit,
      transactions: summary.count,
    }));

  // Get top spending categories
  const topSpendingCategories = Object.entries(data.summary.byCategory)
    .filter(([category]) => category !== 'Tax')
    .sort(([, a], [, b]) => b.debit - a.debit)
    .slice(0, 5);

  const avgMonthlySpending = totalDebits / Object.keys(data.summary.byMonth).length;

  // Get filtered category data
  const filteredCategoryData = filteredTransactions.reduce((acc, transaction) => {
    if (!acc[transaction.category]) {
      acc[transaction.category] = { debit: 0, credit: 0, count: 0 };
    }
    if (transaction.type === 'Debit') {
      acc[transaction.category].debit += transaction.amount;
    } else {
      acc[transaction.category].credit += transaction.amount;
    }
    acc[transaction.category].count += 1;
    return acc;
  }, {} as Record<string, { debit: number; credit: number; count: number }>);

  // Top spending categories from filtered data
  const filteredTopSpendingCategories = Object.entries(filteredCategoryData)
    .filter(([category]) => category !== 'Tax')
    .sort(([, a], [, b]) => b.debit - a.debit)
    .slice(0, 6);

  // Calculate insights
  const filteredAvgTransactionAmount = filteredTransactions.length > 0 ? totalDebits / filteredTransactions.filter(t => t.type === 'Debit').length : 0;
  const largestTransaction = Math.max(...filteredTransactions.map(t => t.amount));
  const totalTransactions = filteredTransactions.length;

  // Recent transactions (last 7 days)
  const recentTransactions = filteredTransactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <Grid container spacing={3}>
      {/* Enhanced Metrics Row */}
      <Grid item xs={12} sm={6} lg={3}>
        <GlassCard
          title="Account Balance"
          value={`${currentBalance.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}`}
          subtitle={`${balanceChange >= 0 ? '+' : ''}${balanceChange.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })} change`}
          icon={<AccountBalance />}
          gradient={balanceChange >= 0 ? 'linear-gradient(135deg, #34C759, #30D158)' : 'linear-gradient(135deg, #FF3B30, #FF6D70)'}
          trend={openingBalance > 0 ? ((balanceChange / openingBalance) * 100) : 0}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} lg={3}>
        <GlassCard
          title="Total Spent"
          value={`${totalDebits.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}`}
          subtitle={`${filteredTransactions.filter(t => t.type === 'Debit').length} transactions`}
          icon={<TrendingDown />}
          gradient="linear-gradient(135deg, #FF3B30, #FF6482)"
          change={`Avg ${filteredAvgTransactionAmount.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}`}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} lg={3}>
        <GlassCard
          title="Total Income"
          value={`${totalCredits.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}`}
          subtitle={`${filteredTransactions.filter(t => t.type === 'Credit').length} transactions`}
          icon={<TrendingUp />}
          gradient="linear-gradient(135deg, #34C759, #30D158)"
          change={`${totalCredits > 0 ? '+' : ''}${((totalCredits / (totalCredits + totalDebits)) * 100).toFixed(1)}%`}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} lg={3}>
        <GlassCard
          title="Net Flow"
          value={`${netAmount.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}`}
          subtitle={`${totalTransactions} total transactions`}
          icon={netAmount >= 0 ? <TrendingUp /> : <TrendingDown />}
          gradient={netAmount >= 0 ? 'linear-gradient(135deg, #007AFF, #40A9FF)' : 'linear-gradient(135deg, #FF9500, #FFB340)'}
          change={`Largest: ${largestTransaction.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}`}
        />
      </Grid>

      {/* Enhanced Charts Row */}
      <Grid item xs={12} lg={8}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Timeline sx={{ color: 'primary.main' }} />
                <Typography variant="h6" fontWeight={600}>
                  Monthly Cash Flow
                </Typography>
              </Stack>
              <Chip 
                label={`${monthlyData.length} months`} 
                size="small" 
                variant="outlined"
              />
            </Stack>
            <Box height={320}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34C759" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#34C759" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF3B30" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#FF3B30" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip 
                    contentStyle={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      color: 'white'
                    }}
                    formatter={(value: number, name: string) => [
                      `${value.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}`,
                      name === 'credits' ? 'Income' : name === 'debits' ? 'Expenses' : name
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="credits" 
                    stackId="1"
                    stroke="#34C759" 
                    fill="url(#colorIncome)"
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="debits" 
                    stackId="2"
                    stroke="#FF3B30" 
                    fill="url(#colorExpense)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} lg={4}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Assessment sx={{ color: 'primary.main' }} />
                <Typography variant="h6" fontWeight={600}>
                  Category Breakdown
                </Typography>
              </Stack>
              <Chip 
                label={`${filteredTopSpendingCategories.length} categories`} 
                size="small" 
                variant="outlined"
              />
            </Stack>
            <Box height={320}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={filteredTopSpendingCategories.map(([name, data]) => ({
                      name,
                      value: data.debit,
                      count: data.count
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {filteredTopSpendingCategories.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      color: 'white'
                    }}
                    formatter={(value: number, name: string, props: any) => [
                      `${value.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}`,
                      `${props.payload.count} transactions`
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Enhanced Categories Grid */}
      <Grid item xs={12} lg={8}>
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <PieChart sx={{ color: 'primary.main' }} />
                <Typography variant="h6" fontWeight={600}>
                  Top Spending Categories
                </Typography>
              </Stack>
              <Chip 
                label={`${totalDebits.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })} total`} 
                color="primary"
                variant="outlined"
              />
            </Stack>
            
            <Stack spacing={2}>
              {filteredTopSpendingCategories.map(([category, summary], index) => {
                const percentage = totalDebits > 0 ? (summary.debit / totalDebits) * 100 : 0;
                const icon = categoryIcons[category] || categoryIcons['Default'];
                
                return (
                  <Paper 
                    key={category}
                    sx={{ 
                      p: 2, 
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.08)',
                        transform: 'translateY(-2px)',
                      }
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar 
                        sx={{ 
                          background: `linear-gradient(135deg, ${COLORS[index % COLORS.length]}, ${COLORS[(index + 1) % COLORS.length]})`,
                          width: 48,
                          height: 48
                        }}
                      >
                        {icon}
                      </Avatar>
                      
                      <Box flex={1}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {category}
                          </Typography>
                          <Typography variant="h6" color="primary.main" fontWeight={700}>
                            {summary.debit.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}
                          </Typography>
                        </Stack>
                        
                        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                          <Typography variant="body2" color="text.secondary">
                            {summary.count} transactions
                          </Typography>
                          <Typography variant="body2" color="text.secondary" fontWeight={500}>
                            {percentage.toFixed(1)}% of total
                          </Typography>
                        </Stack>
                        
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            '& .MuiLinearProgress-bar': {
                              background: `linear-gradient(90deg, ${COLORS[index % COLORS.length]}, ${COLORS[(index + 1) % COLORS.length]})`,
                              borderRadius: 4,
                            }
                          }}
                        />
                      </Box>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Recent Transactions */}
      <Grid item xs={12} lg={4}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Speed sx={{ color: 'primary.main' }} />
                <Typography variant="h6" fontWeight={600}>
                  Recent Activity
                </Typography>
              </Stack>
              <Chip 
                label="Latest" 
                size="small" 
                color="secondary"
                variant="outlined"
              />
            </Stack>
            
            <Stack spacing={2}>
              {recentTransactions.map((transaction, index) => (
                <Paper 
                  key={index}
                  sx={{ 
                    p: 2, 
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar 
                      sx={{ 
                        background: transaction.type === 'Credit' 
                          ? 'linear-gradient(135deg, #34C759, #30D158)'
                          : 'linear-gradient(135deg, #FF3B30, #FF6482)',
                        width: 36,
                        height: 36
                      }}
                    >
                      {transaction.type === 'Credit' ? <TrendingUp /> : <TrendingDown />}
                    </Avatar>
                    
                    <Box flex={1} sx={{ minWidth: 0 }}>
                      <Typography 
                        variant="subtitle2" 
                        fontWeight={600}
                        sx={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {transaction.merchant}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(transaction.date).toLocaleDateString('en-AE')} • {transaction.category}
                      </Typography>
                    </Box>
                    
                    <Typography 
                      variant="body2" 
                      fontWeight={600}
                      color={transaction.type === 'Credit' ? 'success.main' : 'error.main'}
                    >
                      {transaction.type === 'Credit' ? '+' : '-'}
                      {transaction.amount.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}
                    </Typography>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default OverviewDashboard; 