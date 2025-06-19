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
  Grid,
  Paper,
  Card,
  CardContent,
  Tab,
  Tabs,
  Alert,
  CircularProgress
} from '@mui/material';
import { AccountBalance, TrendingUp, Category, DateRange } from '@mui/icons-material';
import OverviewDashboard from './components/OverviewDashboard';
import TransactionAnalytics from './components/TransactionAnalytics';
import CategoryAnalysis from './components/CategoryAnalysis';
import MonthlyTrends from './components/MonthlyTrends';
import TransactionTable from './components/TransactionTable';
import BalanceSummary from './components/BalanceSummary';

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

// Create a banking-themed dark theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#0a0e1a',
      paper: '#1a1f36',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b3b3b3',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(145deg, #1a1f36 0%, #242b4a 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(90deg, #1976d2 0%, #1565c0 100%)',
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

  useEffect(() => {
    loadTransactionData();
  }, []);

  const loadTransactionData = async () => {
    try {
      setLoading(true);
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
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <AccountBalance sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              FAB Statement Analytics Dashboard
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {data?.totalTransactions} Transactions | Generated: {data?.generatedAt ? new Date(data.generatedAt).toLocaleDateString() : 'Unknown'}
            </Typography>
          </Toolbar>
        </AppBar>

        <Container 
          maxWidth={false} 
          sx={{ 
            mt: { xs: 2, sm: 4 }, 
            mb: 4, 
            px: { xs: 1, sm: 2, md: 3 },
            maxWidth: '100vw',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                '& .MuiTab-root': {
                  color: 'text.secondary',
                  minWidth: { xs: 120, sm: 160 },
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  '&.Mui-selected': {
                    color: 'primary.main',
                  },
                },
              }}
            >
              <Tab icon={<AccountBalance />} label="Balance Summary" />
              <Tab icon={<TrendingUp />} label="Overview" />
              <Tab icon={<Category />} label="Category Analysis" />
              <Tab icon={<DateRange />} label="Monthly Trends" />
              <Tab label="Transaction Analytics" />
              <Tab label="Transaction Details" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <BalanceSummary data={data!} />
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <OverviewDashboard data={data!} />
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <CategoryAnalysis data={data!} />
          </TabPanel>
          
          <TabPanel value={tabValue} index={3}>
            <MonthlyTrends data={data!} />
          </TabPanel>
          
          <TabPanel value={tabValue} index={4}>
            <TransactionAnalytics data={data!} />
          </TabPanel>
          
          <TabPanel value={tabValue} index={5}>
            <TransactionTable data={data!} />
          </TabPanel>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App; 