import React, { useMemo, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  TableSortLabel,
  Container,
  useTheme,
} from '@mui/material';
import {
  Receipt,
  Search,
  FilterList,
  Download,
  Visibility,
  TrendingUp,
  TrendingDown,
  Category,
  ShoppingCart,
  Restaurant,
  DirectionsCar,
  Home,
  LocalGasStation,
  AttachMoney,
} from '@mui/icons-material';

import { useAppContext } from '../context/AppContext';
import { Transaction } from '../App';

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

type SortKey = keyof Transaction;
type SortOrder = 'asc' | 'desc';

const EnhancedTransactionTable: React.FC = () => {
  const { state } = useAppContext();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [localSearch, setLocalSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Credit' | 'Debit'>('all');
  const [amountFilter, setAmountFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const theme = useTheme();

  const processedTransactions = useMemo(() => {
    let transactions = [...state.filteredTransactions];

    // Apply local search filter
    if (localSearch) {
      const searchLower = localSearch.toLowerCase();
      transactions = transactions.filter(t =>
        t.description.toLowerCase().includes(searchLower) ||
        t.merchant.toLowerCase().includes(searchLower) ||
        t.category.toLowerCase().includes(searchLower) ||
        t.amount.toString().includes(searchLower)
      );
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      transactions = transactions.filter(t => t.type === typeFilter);
    }

    // Apply amount filter
    if (amountFilter !== 'all') {
      const sortedByAmount = [...transactions].sort((a, b) => b.amount - a.amount);
      const total = sortedByAmount.length;
      
      if (amountFilter === 'high') {
        transactions = sortedByAmount.slice(0, Math.ceil(total * 0.2)); // Top 20%
      } else if (amountFilter === 'medium') {
        transactions = sortedByAmount.slice(
          Math.ceil(total * 0.2),
          Math.ceil(total * 0.8)
        ); // Middle 60%
      } else if (amountFilter === 'low') {
        transactions = sortedByAmount.slice(Math.ceil(total * 0.8)); // Bottom 20%
      }
    }

    // Apply sorting
    transactions.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      
      let comparison = 0;
      
      if (sortKey === 'date') {
        comparison = new Date(aVal as string).getTime() - new Date(bVal as string).getTime();
      } else if (sortKey === 'amount') {
        comparison = (aVal as number) - (bVal as number);
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return transactions;
  }, [state.filteredTransactions, localSearch, typeFilter, amountFilter, sortKey, sortOrder]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Description', 'Merchant', 'Category', 'Type', 'Amount', 'Account'];
    const csvContent = [
      headers.join(','),
      ...processedTransactions.map(t =>
        [
          t.date,
          `"${t.description}"`,
          `"${t.merchant}"`,
          t.category,
          t.type,
          t.amount,
          `"${t.account}"`
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const paginatedTransactions = processedTransactions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getSummaryStats = () => {
    const totalAmount = processedTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalDebits = processedTransactions.filter(t => t.type === 'Debit').reduce((sum, t) => sum + t.amount, 0);
    const totalCredits = processedTransactions.filter(t => t.type === 'Credit').reduce((sum, t) => sum + t.amount, 0);
    const avgAmount = totalAmount / Math.max(1, processedTransactions.length);

    return {
      totalTransactions: processedTransactions.length,
      totalAmount,
      totalDebits,
      totalCredits,
      netAmount: totalCredits - totalDebits,
      avgAmount,
    };
  };

  const stats = getSummaryStats();

  return (
    <Box sx={{ 
      height: '100%', 
      p: 2,
      overflow: 'auto',
    }}>
        {/* Header and Stats Row */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {/* Header */}
          <Grid item xs={12}>
          <Card>
            <CardContent sx={{ py: 1.5, px: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Receipt color="primary" />
                  <Typography variant="h5" fontWeight={600}>
                    Transaction Details
                  </Typography>
                  <Chip 
                    label={`${stats.totalTransactions} transactions`}
                    size="small"
                    variant="outlined"
                  />
                </Stack>

                <Stack direction="row" spacing={1}>
                  <Tooltip title="Export CSV">
                    <IconButton onClick={handleExportCSV}>
                      <Download />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Summary Stats */}
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ py: 1.5, px: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={2.4}>
                  <Box textAlign="center">
                    <Typography variant="h6" fontWeight={600}>
                      {stats.totalTransactions}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total Transactions
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={2.4}>
                  <Box textAlign="center">
                    <Typography variant="h6" fontWeight={600} color="error.main">
                      {(stats.totalDebits / 1000).toFixed(0)}k AED
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total Debits
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={2.4}>
                  <Box textAlign="center">
                    <Typography variant="h6" fontWeight={600} color="success.main">
                      {(stats.totalCredits / 1000).toFixed(0)}k AED
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total Credits
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={2.4}>
                  <Box textAlign="center">
                    <Typography 
                      variant="h6" 
                      fontWeight={600} 
                      color={stats.netAmount >= 0 ? 'success.main' : 'error.main'}
                    >
                      {(stats.netAmount / 1000).toFixed(0)}k AED
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Net Amount
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={2.4}>
                  <Box textAlign="center">
                    <Typography variant="h6" fontWeight={600}>
                      {(stats.avgAmount / 1000).toFixed(1)}k AED
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Average Amount
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Filters */}
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ py: 1.5, px: 2 }}>
              <Stack direction="row" spacing={2}>
                <TextField
                  size="small"
                  placeholder="Search transactions..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ flex: 1 }}
                />

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={typeFilter}
                    label="Type"
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="Credit">Credit</MenuItem>
                    <MenuItem value="Debit">Debit</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Amount Range</InputLabel>
                  <Select
                    value={amountFilter}
                    label="Amount Range"
                    onChange={(e) => setAmountFilter(e.target.value as any)}
                  >
                    <MenuItem value="all">All Amounts</MenuItem>
                    <MenuItem value="high">High (Top 20%)</MenuItem>
                    <MenuItem value="medium">Medium (60%)</MenuItem>
                    <MenuItem value="low">Low (Bottom 20%)</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Transaction Table */}
      <Card sx={{ height: '600px' }}>
        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 0 }}>
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <TableContainer sx={{ height: '100%' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={sortKey === 'date'}
                        direction={sortKey === 'date' ? sortOrder : 'asc'}
                        onClick={() => handleSort('date')}
                      >
                        Date
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Transaction</TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortKey === 'category'}
                        direction={sortKey === 'category' ? sortOrder : 'asc'}
                        onClick={() => handleSort('category')}
                      >
                        Category
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortKey === 'type'}
                        direction={sortKey === 'type' ? sortOrder : 'asc'}
                        onClick={() => handleSort('type')}
                      >
                        Type
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={sortKey === 'amount'}
                        direction={sortKey === 'amount' ? sortOrder : 'asc'}
                        onClick={() => handleSort('amount')}
                      >
                        Amount
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Account</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedTransactions.map((transaction, index) => (
                    <TableRow 
                      key={index}
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: 'rgba(255, 255, 255, 0.05)' 
                        }
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {new Date(transaction.date).toLocaleDateString('en-AE', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              background: `linear-gradient(135deg, ${
                                theme.palette.primary.main
                              }, ${theme.palette.secondary.main})`,
                            }}
                          >
                            {categoryIcons[transaction.category] || categoryIcons.Default}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={500} noWrap>
                              {transaction.merchant}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {transaction.description.length > 40 
                                ? `${transaction.description.substring(0, 40)}...` 
                                : transaction.description
                              }
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      
                      <TableCell>
                        <Chip 
                          label={transaction.category}
                          size="small"
                          variant="outlined"
                          sx={{ maxWidth: 120 }}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          icon={transaction.type === 'Credit' ? <TrendingUp /> : <TrendingDown />}
                          label={transaction.type}
                          size="small"
                          color={transaction.type === 'Credit' ? 'success' : 'error'}
                          variant="outlined"
                        />
                      </TableCell>
                      
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color={transaction.type === 'Credit' ? 'success.main' : 'error.main'}
                        >
                          {transaction.type === 'Credit' ? '+' : '-'}
                          {(transaction.amount / 1000).toFixed(1)}k
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {transaction.account}
                        </Typography>
                      </TableCell>
                      
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          
          {/* Pagination - Fixed at bottom */}
          <Box sx={{ flexShrink: 0, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <TablePagination
              component="div"
              count={processedTransactions.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[25, 50, 100]}
              sx={{ border: 'none' }}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EnhancedTransactionTable;