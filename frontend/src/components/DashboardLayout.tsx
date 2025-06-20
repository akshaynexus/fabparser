import React from 'react';
import { Box, Fade, Alert } from '@mui/material';
import { useAppContext } from '../context/AppContext';

// Import all dashboard components
import EnhancedOverviewDashboard from './EnhancedOverviewDashboard';
import EnhancedBalanceSummary from './EnhancedBalanceSummary';
import EnhancedCategoryAnalysis from './EnhancedCategoryAnalysis';
import EnhancedMonthlyTrends from './EnhancedMonthlyTrends';
import TransactionAnalytics from './TransactionAnalytics';
import EnhancedTransactionTable from './EnhancedTransactionTable';
import JsonBrowser from './JsonBrowser';

const DashboardLayout: React.FC = () => {
  const { state } = useAppContext();

  if (!state.data) {
    return (
      <Alert severity="info">
        No data available. Please load transaction data first.
      </Alert>
    );
  }

  const renderContent = () => {
    switch (state.currentTab) {
      case 0:
        return <EnhancedOverviewDashboard />;
      case 1:
        return <EnhancedBalanceSummary />;
      case 2:
        return <EnhancedCategoryAnalysis />;
      case 3:
        return <EnhancedMonthlyTrends />;
      case 4:
        return <TransactionAnalytics data={state.data} filteredTransactions={state.filteredTransactions} />;
      case 5:
        return <EnhancedTransactionTable />;
      case 6:
        return <JsonBrowser data={state.data} />;
      default:
        return <EnhancedOverviewDashboard />;
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
      <Fade 
        in 
        timeout={500}
        key={state.currentTab} // This ensures fade animation when switching tabs
      >
        <Box sx={{ height: '100%', flex: 1, minHeight: 0 }}>
          {renderContent()}
        </Box>
      </Fade>
    </Box>
  );
};

export default DashboardLayout;