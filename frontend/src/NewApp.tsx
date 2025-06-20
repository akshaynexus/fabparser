import React, { useEffect } from 'react';
import {
  Box,
  CssBaseline,
  ThemeProvider,
  Container,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Stack,
  Avatar,
  Fade,
  CircularProgress,
  Alert,
  useMediaQuery,
} from '@mui/material';
import {
  AccountBalance,
  DarkMode,
  LightMode,
  Menu as MenuIcon,
  Refresh,
  Settings,
  CompressOutlined,
  UnfoldMoreOutlined,
} from '@mui/icons-material';

import { AppProvider, useAppContext, appActions } from './context/AppContext';
import { createGlassmorphicTheme } from './theme/glassmorphicTheme';
import FilterBar from './components/FilterBar';
import NavigationTabs from './components/NavigationTabs';
import DashboardLayout from './components/DashboardLayout';
import { TransactionSummary } from './App';

// Main App Content Component
const AppContent: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const theme = createGlassmorphicTheme(state.darkMode);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    loadTransactionData();
  }, []);

  const loadTransactionData = async () => {
    try {
      dispatch(appActions.setLoading(true));
      const response = await fetch('/transaction_summary.json');
      if (!response.ok) {
        throw new Error('Failed to load transaction data');
      }
      const transactionData: TransactionSummary = await response.json();
      dispatch(appActions.setData(transactionData));
    } catch (err) {
      console.error('Error loading transaction data:', err);
      dispatch(appActions.setError('Unable to load transaction data. Please ensure the parser has been run and transaction_summary.json exists.'));
    }
  };

  const handleRefresh = () => {
    loadTransactionData();
  };

  const handleToggleDarkMode = () => {
    dispatch(appActions.toggleDarkMode());
  };

  const handleToggleCompactNumbers = () => {
    dispatch(appActions.toggleCompactNumbers());
  };

  const handleToggleSidebar = () => {
    dispatch(appActions.setSidebarOpen(!state.sidebarOpen));
  };

  if (state.loading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        sx={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #1a1a2e 100%)',
        }}
      >
        <CircularProgress size={60} sx={{ mb: 3 }} />
        <Typography variant="h6" color="white" sx={{ opacity: 0.8 }}>
          Loading Financial Dashboard...
        </Typography>
        <Typography variant="body2" color="white" sx={{ opacity: 0.6, mt: 1 }}>
          Preparing your financial insights
        </Typography>
      </Box>
    );
  }

  if (state.error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2,
            background: 'rgba(255, 59, 48, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 59, 48, 0.2)',
          }}
        >
          {state.error}
        </Alert>
        <Typography variant="body1" color="text.secondary">
          To resolve this issue:
          <br />
          1. Run the statement parser: <code>bun statement_parser.js</code>
          <br />
          2. Ensure transaction_summary.json is generated in the root directory
          <br />
          3. Copy the file to the frontend/public directory
        </Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh' }}>
      {/* Enhanced App Bar */}
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            {isMobile && (
              <IconButton
                edge="start"
                color="inherit"
                onClick={handleToggleSidebar}
                sx={{ mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Avatar 
              sx={{ 
                width: 40,
                height: 40,
                background: 'linear-gradient(135deg, #007AFF 0%, #40A9FF 100%)',
                boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)',
              }}
            >
              <AccountBalance />
            </Avatar>
            <Box>
              <Typography variant="h6" component="div" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                FAB Analytics Pro
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.75rem' }}>
                Advanced Financial Intelligence
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1}>
            {/* Data Stats */}
            <Box sx={{ 
              px: 2, 
              py: 0.5, 
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: { xs: 'none', sm: 'block' }
            }}>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {state.filteredTransactions.length} / {state.data?.totalTransactions || 0} transactions
              </Typography>
            </Box>

            {/* Controls */}
            <IconButton 
              onClick={handleRefresh}
              disabled={state.loading}
              sx={{ 
                color: 'white',
                background: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.2)',
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              {state.loading ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
            </IconButton>
            
            <IconButton 
              onClick={handleToggleCompactNumbers}
              sx={{ 
                color: 'white',
                background: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.2)',
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease',
              }}
              title={state.compactNumbers ? 'Show full numbers' : 'Show compact numbers (K format)'}
            >
              {state.compactNumbers ? <UnfoldMoreOutlined /> : <CompressOutlined />}
            </IconButton>

            <IconButton 
              onClick={handleToggleDarkMode}
              sx={{ 
                color: 'white',
                background: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.2)',
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              {state.darkMode ? <LightMode /> : <DarkMode />}
            </IconButton>

            <IconButton 
              sx={{ 
                color: 'white',
                background: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.2)',
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <Settings />
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 64px)', // Subtract AppBar height
        width: '100%',
        px: 1,
        py: 0.5,
      }}>
        {/* Enhanced Filter Bar */}
        <Fade in timeout={500}>
          <Box sx={{ flexShrink: 0, mb: 0.5 }}>
            <FilterBar />
          </Box>
        </Fade>

        {/* Navigation Tabs */}
        <Fade in timeout={700}>
          <Box sx={{ flexShrink: 0, mb: 1 }}>
            <NavigationTabs />
          </Box>
        </Fade>

        {/* Dashboard Content */}
        <Fade in timeout={900}>
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <DashboardLayout />
          </Box>
        </Fade>
      </Box>
    </Box>
  );
};

// Main App Component with Theme Provider
const NewApp: React.FC = () => {
  return (
    <AppProvider>
      <AppWithTheme />
    </AppProvider>
  );
};

// Theme wrapper component
const AppWithTheme: React.FC = () => {
  const { state } = useAppContext();
  const theme = createGlassmorphicTheme(state.darkMode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppContent />
    </ThemeProvider>
  );
};

export default NewApp;