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
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';
import { TransactionSummary } from '../App';

interface OverviewDashboardProps {
  data: TransactionSummary;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

const categoryIcons: Record<string, JSX.Element> = {
  'Food & Dining': <Restaurant />,
  'Transportation': <DirectionsCar />,
  'Shopping': <ShoppingCart />,
  'Banking': <AccountBalance />,
  'Travel': <TrendingUp />,
  'Home & Garden': <Home />,
  'Utilities': <AttachMoney />,
  'Default': <Category />,
};

const MetricCard: React.FC<{
  title: string;
  value: string;
  subtitle?: string;
  icon: JSX.Element;
  color: string;
  trend?: number;
}> = ({ title, value, subtitle, icon, color, trend }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" component="div">
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="textSecondary">
              {subtitle}
            </Typography>
          )}
          {trend !== undefined && (
            <Box display="flex" alignItems="center" mt={1}>
              {trend > 0 ? <TrendingUp color="success" /> : <TrendingDown color="error" />}
              <Typography variant="body2" color={trend > 0 ? 'success.main' : 'error.main'}>
                {Math.abs(trend).toFixed(1)}%
              </Typography>
            </Box>
          )}
        </Box>
        <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ data }) => {
  // Calculate summary metrics
  const totalDebits = Object.values(data.summary.byCategory).reduce((sum, cat) => sum + cat.debit, 0);
  const totalCredits = Object.values(data.summary.byCategory).reduce((sum, cat) => sum + cat.credit, 0);
  
  // Use actual balance information instead of transaction flow
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
  const avgTransactionAmount = totalDebits / data.transactions.filter(t => t.type === 'Debit').length;

  return (
    <Grid container spacing={3}>
      {/* Key Metrics Row */}
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Current Balance"
          value={`${currentBalance.toLocaleString()} AED`}
          subtitle={`${balanceChange >= 0 ? '+' : ''}${balanceChange.toLocaleString()} AED change`}
          icon={<AccountBalance />}
          color={balanceChange >= 0 ? '#4caf50' : '#f44336'}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Total Spent"
          value={`${totalDebits.toLocaleString()} AED`}
          subtitle={`${data.transactions.filter(t => t.type === 'Debit').length} transactions`}
          icon={<TrendingDown />}
          color="#f44336"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Total Received"
          value={`${totalCredits.toLocaleString()} AED`}
          subtitle={`${data.transactions.filter(t => t.type === 'Credit').length} transactions`}
          icon={<TrendingUp />}
          color="#4caf50"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Avg Monthly Spending"
          value={`${avgMonthlySpending.toLocaleString()} AED`}
          subtitle={`Avg ${avgTransactionAmount.toFixed(0)} AED per transaction`}
          icon={<AttachMoney />}
          color="#2196f3"
        />
      </Grid>

      {/* Charts Row */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Monthly Cash Flow
            </Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `${value.toLocaleString()} AED`,
                      name === 'debits' ? 'Spent' : name === 'credits' ? 'Received' : 'Net'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="credits" stackId="a" fill="#4caf50" name="Credits" />
                  <Bar dataKey="debits" stackId="a" fill="#f44336" name="Debits" />
                  <Line type="monotone" dataKey="net" stroke="#2196f3" name="Net" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Spending by Category
            </Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value.toLocaleString()} AED`, 'Total']} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Top Categories */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Top Spending Categories
            </Typography>
            <Grid container spacing={2}>
              {topSpendingCategories.map(([category, summary], index) => {
                const percentage = (summary.debit / totalDebits) * 100;
                return (
                  <Grid item xs={12} sm={6} md={4} lg={2.4} key={category}>
                    <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        {categoryIcons[category] || <Category />}
                        <Typography variant="subtitle2" sx={{ ml: 1 }}>
                          {category}
                        </Typography>
                      </Box>
                      <Typography variant="h6" color="primary">
                        {summary.debit.toLocaleString()} AED
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {summary.count} transactions
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={percentage}
                        sx={{ mt: 1, height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="caption" color="textSecondary">
                        {percentage.toFixed(1)}% of total spending
                      </Typography>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Transaction Volume Trend */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Transaction Volume Trend
            </Typography>
            <Box height={250}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="transactions" 
                    stroke="#8884d8" 
                    strokeWidth={3}
                    dot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default OverviewDashboard; 