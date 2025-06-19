import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
} from '@mui/material';
import {
  Restaurant,
  DirectionsCar,
  ShoppingCart,
  AccountBalance,
  Home,
  LocalHospital,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { Treemap, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { TransactionSummary } from '../App';

interface CategoryAnalysisProps {
  data: TransactionSummary;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C', '#8dd1e1', '#d084d0'];

const categoryIcons: Record<string, JSX.Element> = {
  'Food & Dining': <Restaurant />,
  'Transportation': <DirectionsCar />,
  'Shopping': <ShoppingCart />,
  'Banking': <AccountBalance />,
  'Travel': <Restaurant />,
  'Home & Garden': <Home />,
  'Healthcare': <LocalHospital />,
  'Default': <CategoryIcon />,
};

const CategoryAnalysis: React.FC<CategoryAnalysisProps> = ({ data }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Prepare category data
  const categoryData = Object.entries(data.summary.byCategory)
    .filter(([category]) => category !== 'Tax') // Exclude small tax entries
    .map(([category, summary]) => ({
      category,
      totalSpent: summary.debit,
      totalReceived: summary.credit,
      totalAmount: summary.debit + summary.credit,
      transactionCount: summary.count,
      avgTransaction: summary.count > 0 ? summary.debit / summary.count : 0,
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent);

  // Get merchant data for selected category
  const getMerchantData = (category: string) => {
    const merchants: Record<string, { spent: number; count: number; transactions: any[] }> = {};
    
    data.transactions
      .filter(t => category === 'all' || t.category === category)
      .filter(t => t.type === 'Debit')
      .forEach(transaction => {
        if (!merchants[transaction.merchant]) {
          merchants[transaction.merchant] = { spent: 0, count: 0, transactions: [] };
        }
        merchants[transaction.merchant].spent += transaction.amount;
        merchants[transaction.merchant].count += 1;
        merchants[transaction.merchant].transactions.push(transaction);
      });

    return Object.entries(merchants)
      .map(([merchant, data]) => ({
        merchant,
        spent: data.spent,
        count: data.count,
        avgAmount: data.spent / data.count,
        transactions: data.transactions,
      }))
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 20); // Top 20 merchants
  };

  const merchantData = getMerchantData(selectedCategory);

  // Prepare TreeMap data
  const treeMapData = categoryData.map((item, index) => ({
    name: item.category,
    size: item.totalSpent,
    fill: COLORS[index % COLORS.length],
  }));

  // Monthly spending by category
  const monthlySpendingByCategory = () => {
    const monthlyData: Record<string, Record<string, number>> = {};
    
    data.transactions
      .filter(t => t.type === 'Debit')
      .forEach(transaction => {
        const month = new Date(transaction.date).toISOString().substring(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = {};
        }
        if (!monthlyData[month][transaction.category]) {
          monthlyData[month][transaction.category] = 0;
        }
        monthlyData[month][transaction.category] += transaction.amount;
      });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, categories]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        ...categories,
      }));
  };

  const monthlyTrendData = monthlySpendingByCategory();
  const topCategories = categoryData.slice(0, 6).map(c => c.category);

  return (
    <Grid container spacing={3}>
      {/* Category Overview Cards */}
      <Grid item xs={12}>
        <Typography variant="h5" gutterBottom>
          Category Analysis
        </Typography>
      </Grid>

      {/* Category Summary Cards */}
      <Grid item xs={12}>
        <Grid container spacing={2}>
          {categoryData.slice(0, 6).map((category, index) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={category.category}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Avatar sx={{ bgcolor: COLORS[index % COLORS.length], mr: 1, width: 32, height: 32 }}>
                      {categoryIcons[category.category] || <CategoryIcon />}
                    </Avatar>
                    <Typography variant="subtitle2" noWrap>
                      {category.category}
                    </Typography>
                  </Box>
                  <Typography variant="h6" color="primary">
                    {category.totalSpent.toLocaleString()} AED
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {category.transactionCount} transactions
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Avg: {category.avgTransaction.toFixed(0)} AED
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Grid>

      {/* TreeMap Visualization */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Category Spending Distribution
            </Typography>
            <Box height={400}>
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={treeMapData}
                  dataKey="size"
                  aspectRatio={4/3}
                  stroke="#fff"
                  fill="#8884d8"
                />
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Category Performance Metrics */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Category Performance
            </Typography>
            <Box height={400}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData.slice(0, 8)}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="totalSpent"
                    label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.slice(0, 8).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value.toLocaleString()} AED`, 'Spent']} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Monthly Trends by Category */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Monthly Spending Trends by Category
            </Typography>
            <Box height={400}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`${value?.toLocaleString()} AED`, 'Spent']} />
                  <Legend />
                  {topCategories.map((category, index) => (
                    <Bar
                      key={category}
                      dataKey={category}
                      stackId="a"
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Merchant Analysis */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6">
                Top Merchants
              </Typography>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Category Filter</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Category Filter"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {categoryData.map(category => (
                    <MenuItem key={category.category} value={category.category}>
                      {category.category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Merchant</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Total Spent</TableCell>
                    <TableCell align="right">Transactions</TableCell>
                    <TableCell align="right">Avg Amount</TableCell>
                    <TableCell align="right">Last Transaction</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {merchantData.map((merchant) => {
                    const lastTransaction = merchant.transactions[merchant.transactions.length - 1];
                    const category = lastTransaction?.category || 'Unknown';
                    
                    return (
                      <TableRow key={merchant.merchant} hover>
                        <TableCell component="th" scope="row">
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {merchant.merchant}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={category}
                            size="small"
                            sx={{
                              bgcolor: COLORS[categoryData.findIndex(c => c.category === category) % COLORS.length] + '20',
                              color: COLORS[categoryData.findIndex(c => c.category === category) % COLORS.length],
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold">
                            {merchant.spent.toLocaleString()} AED
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {merchant.count}
                        </TableCell>
                        <TableCell align="right">
                          {merchant.avgAmount.toFixed(0)} AED
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="caption">
                            {new Date(lastTransaction?.date).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default CategoryAnalysis; 