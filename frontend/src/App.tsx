import React, { useState, useEffect } from 'react';
import {
  Box,
  CssBaseline,
  ThemeProvider,
  createTheme,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Paper,
  Tab,
  Tabs,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  Button,
  Chip,
  Stack,
  Badge,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
} from '@mui/material';
import { 
  AccountBalance, 
  Category, 
  Search,
  FilterList,
  Refresh,
  Settings,
  MoreVert,
  Dashboard,
  Receipt,
  PieChart,
  BarChart,
  Timeline,
  Download,
  Share,
  Visibility,
  AttachMoney,
  Savings,
  TrendingDown,
} from '@mui/icons-material';
import OverviewDashboard from './components/OverviewDashboard';
import TransactionAnalytics from './components/TransactionAnalytics';
import CategoryAnalysis from './components/CategoryAnalysis';
import MonthlyTrends from './components/MonthlyTrends';
import TransactionTable from './components/TransactionTable';
import BalanceSummary from './components/BalanceSummary';
import JsonBrowser from './components/JsonBrowser';
import TimeframeFilter, { TimeFrame } from './components/TimeframeFilter';

// Types for our transaction data
export interface Transaction {
  date: string;
  amount: number;
  currency: string;
  description: string;
  merchant: string;
  category: string;
  type: 'Credit' | 'Debit';
  account: string;
  statementFile: string;
  originalText: string;
}

export interface BalanceInfo {
  openingBalance: number | null;
  closingBalance: number | null;
  openingDate: string | null;
  closingDate: string | null;
  netChange: number | null;
  monthlyBalances: Record<string, {
    openingBalance: number | null;
    closingBalance: number | null;
    openingDate: string | null;
    closingDate: string | null;
    netChange: number | null;
  }>;
}

export interface TransactionSummary {
  generatedAt: string;
  totalTransactions: number;
  transactions: Transaction[];
  summary: {
    byCategory: Record<string, { debit: number; credit: number; count: number }>;
    byMonth: Record<string, { debit: number; credit: number; count: number }>;
  };
  balanceInfo: BalanceInfo | null;
}

// iOS 26 Liquid Glass themed design
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#007AFF',
      light: '#40A9FF',
      dark: '#0056CC',
    },
    secondary: {
      main: '#FF9500',
      light: '#FFB340',
      dark: '#CC7700',
    },
    background: {
      default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      paper: 'rgba(255, 255, 255, 0.08)',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
    success: {
      main: '#34C759',
    },
    error: {
      main: '#FF3B30',
    },
    warning: {
      main: '#FF9500',
    },
    info: {
      main: '#007AFF',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.125rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
            background: 'rgba(255, 255, 255, 0.15)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: 'none',
          borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          textTransform: 'none',
          fontWeight: 500,
          padding: '8px 16px',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          transition: 'all 0.2s ease-in-out',
        },
        contained: {
          background: 'rgba(0, 122, 255, 0.8)',
          border: '1px solid rgba(0, 122, 255, 0.3)',
          '&:hover': {
            background: 'rgba(0, 122, 255, 0.9)',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(0, 122, 255, 0.4)',
          },
        },
        outlined: {
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.15)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.95rem',
          minHeight: '48px',
          borderRadius: '12px',
          margin: '0 4px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.1)',
          },
          '&.Mui-selected': {
            background: 'rgba(0, 122, 255, 0.2)',
            color: '#007AFF',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '4px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        indicator: {
          display: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: 'white',
          fontWeight: 500,
        },
      },
    },
  },
});

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function App() {
  const [data, setData] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame | null>(null);
  
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    loadTransactionData();
  }, []);

  const loadTransactionData = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      // Try to load the transaction data from the parent directory
      const response = await fetch('/transaction_summary.json');
      if (!response.ok) {
        throw new Error('Failed to load transaction data');
      }
      const transactionData: TransactionSummary = await response.json();
      setData(transactionData);
      setError(null);
    } catch (err) {
      console.error('Error loading transaction data:', err);
      setError('Unable to load transaction data. Please ensure the parser has been run and transaction_summary.json exists.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRefresh = () => {
    loadTransactionData();
  };

  const getFilteredTransactions = () => {
    if (!data) return [];
    
    let filtered = data.transactions;
    
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(t => selectedCategories.includes(t.category));
    }
    
    // Use selectedTimeframe for date filtering
    if (selectedTimeframe) {
      filtered = filtered.filter(t => {
        const transDate = new Date(t.date);
        return transDate >= selectedTimeframe.start && transDate <= selectedTimeframe.end;
      });
    }
    
    return filtered;
  };

  const getCategories = () => {
    if (!data) return [];
    return [...new Set(data.transactions.map(t => t.category))].sort();
  };

  const getAvailableMonths = () => {
    if (!data) return [];
    const months = new Set(data.transactions.map(t => {
      const date = new Date(t.date);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }));
    return Array.from(months).sort();
  };

  const getInsights = () => {
    if (!data) return null;
    
    const filtered = getFilteredTransactions();
    const totalSpent = filtered.filter(t => t.type === 'Debit').reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = filtered.filter(t => t.type === 'Credit').reduce((sum, t) => sum + t.amount, 0);
    const topCategory = Object.entries(data.summary.byCategory).sort((a, b) => b[1].debit - a[1].debit)[0];
    
    return {
      totalTransactions: filtered.length,
      totalSpent,
      totalIncome,
      netAmount: totalIncome - totalSpent,
      topSpendingCategory: topCategory ? topCategory[0] : 'N/A',
      avgTransactionAmount: filtered.length > 0 ? totalSpent / filtered.length : 0,
    };
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Loading Financial Dashboard...
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Typography variant="body1">
            To resolve this issue:
            <br />
            1. Run the statement parser: <code>bun statement_parser.js</code>
            <br />
            2. Ensure transaction_summary.json is generated in the root directory
            <br />
            3. Copy the file to the frontend/public directory
          </Typography>
        </Container>
      </ThemeProvider>
    );
  }

  const insights = getInsights();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, minHeight: '100vh' }}>
        <AppBar position="sticky" elevation={0}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ 
                bgcolor: 'primary.main', 
                background: 'linear-gradient(135deg, #007AFF 0%, #40A9FF 100%)' 
              }}>
                <AccountBalance />
              </Avatar>
              <Box>
                <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                  FAB Analytics
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Financial Intelligence Dashboard
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1}>
              <Badge badgeContent={insights?.totalTransactions || 0} color="primary" max={9999}>
                <Chip 
                  icon={<Receipt />} 
                  label={`${data?.totalTransactions || 0} Total`}
                  size="small"
                  variant="outlined"
                />
              </Badge>
              
              <IconButton 
                onClick={handleRefresh}
                disabled={refreshing}
                sx={{ color: 'white' }}
              >
                {refreshing ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
              </IconButton>
              
              <IconButton onClick={handleMenuClick} sx={{ color: 'white' }}>
                <MoreVert />
              </IconButton>
              
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }
                }}
              >
                <MenuItem onClick={handleMenuClose}>
                  <Download sx={{ mr: 1 }} />
                  Export Data
                </MenuItem>
                <MenuItem onClick={handleMenuClose}>
                  <Share sx={{ mr: 1 }} />
                  Share Report
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleMenuClose}>
                  <Settings sx={{ mr: 1 }} />
                  Settings
                </MenuItem>
              </Menu>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Enhanced Search and Filter Bar */}
        <Container maxWidth={false} sx={{ mt: 2, mb: 2, px: { xs: 1, sm: 2, md: 3 } }}>
          <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, mb: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search transactions, merchants, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                  }
                }}
              />
              
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {getCategories().slice(0, 4).map((category) => (
                    <Chip
                      key={category}
                      label={category}
                      clickable
                      variant={selectedCategories.includes(category) ? 'filled' : 'outlined'}
                      onClick={() => {
                        setSelectedCategories(prev => 
                          prev.includes(category)
                            ? prev.filter(c => c !== category)
                            : [...prev, category]
                        );
                      }}
                      size="small"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    />
                  ))}
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  size="small"
                  onClick={() => {}}
                  sx={{ minWidth: 'fit-content' }}
                >
                  More Filters
                </Button>
              </Stack>
            </Stack>

            {/* Quick Insights Bar */}
            {insights && (
              <Box sx={{ mt: 2 }}>
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={2} 
                  divider={<Divider orientation="vertical" flexItem />}
                  sx={{ 
                    '& > :not(:last-child)': { 
                      pb: { xs: 2, sm: 0 },
                      pr: { xs: 0, sm: 2 } 
                    }
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <AttachMoney sx={{ color: 'success.main' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Total Income</Typography>
                      <Typography variant="h6" color="success.main">
                        {insights.totalIncome.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}
                      </Typography>
                    </Box>
                  </Stack>
                  
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <TrendingDown sx={{ color: 'error.main' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Total Spent</Typography>
                      <Typography variant="h6" color="error.main">
                        {insights.totalSpent.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}
                      </Typography>
                    </Box>
                  </Stack>
                  
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Savings sx={{ color: insights.netAmount >= 0 ? 'success.main' : 'error.main' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Net Amount</Typography>
                      <Typography variant="h6" color={insights.netAmount >= 0 ? 'success.main' : 'error.main'}>
                        {insights.netAmount.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}
                      </Typography>
                    </Box>
                  </Stack>
                  
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Category sx={{ color: 'primary.main' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Top Category</Typography>
                      <Typography variant="body1" color="primary.main">
                        {insights.topSpendingCategory}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </Box>
            )}
          </Paper>

          {/* Timeframe Filter */}
          <TimeframeFilter
            onTimeframeChange={setSelectedTimeframe}
            selectedTimeframe={selectedTimeframe}
            availableMonths={getAvailableMonths()}
            compact={isMobile}
          />

          {/* Enhanced Tab Navigation */}
          <Box sx={{ mb: 3 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
            >
              <Tab icon={<Dashboard />} iconPosition="start" label="Dashboard" />
              <Tab icon={<AccountBalance />} iconPosition="start" label="Balance Summary" />
              <Tab icon={<PieChart />} iconPosition="start" label="Category Analysis" />
              <Tab icon={<Timeline />} iconPosition="start" label="Monthly Trends" />
              <Tab icon={<BarChart />} iconPosition="start" label="Analytics" />
              <Tab icon={<Receipt />} iconPosition="start" label="Transactions" />
              <Tab icon={<Visibility />} iconPosition="start" label="JSON Browser" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <OverviewDashboard data={data!} filteredTransactions={getFilteredTransactions()} />
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <BalanceSummary data={data!} />
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <CategoryAnalysis data={data!} filteredTransactions={getFilteredTransactions()} />
          </TabPanel>
          
          <TabPanel value={tabValue} index={3}>
            <MonthlyTrends data={data!} filteredTransactions={getFilteredTransactions()} />
          </TabPanel>
          
          <TabPanel value={tabValue} index={4}>
            <TransactionAnalytics data={data!} filteredTransactions={getFilteredTransactions()} />
          </TabPanel>
          
          <TabPanel value={tabValue} index={5}>
            <TransactionTable data={data!} filteredTransactions={getFilteredTransactions()} searchQuery={searchQuery} />
          </TabPanel>
          
          <TabPanel value={tabValue} index={6}>
            <JsonBrowser data={data!} />
          </TabPanel>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App; 