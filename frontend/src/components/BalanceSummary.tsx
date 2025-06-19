import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
} from '@mui/material';
import { TransactionSummary } from '../App';

interface BalanceSummaryProps {
  data: TransactionSummary;
}

const BalanceSummary: React.FC<BalanceSummaryProps> = ({ data }) => {
  const balanceInfo = data.balanceInfo;
  
  if (!balanceInfo) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" color="error">
            Balance information not available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'N/A';
    return `${amount.toLocaleString()} AED`;
  };

  const formatChange = (amount: number | null) => {
    if (amount === null) return 'N/A';
    const sign = amount >= 0 ? '+' : '';
    return `${sign}${amount.toLocaleString()} AED`;
  };

  return (
    <Box>
      {/* Overall Balance Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Account Balance Summary
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2" color="textSecondary">
                Opening Balance
              </Typography>
              <Typography variant="h4">
                {formatCurrency(balanceInfo.openingBalance)}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {balanceInfo.openingDate ? new Date(balanceInfo.openingDate).toLocaleDateString() : 'N/A'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2" color="textSecondary">
                Current Balance
              </Typography>
              <Typography variant="h4">
                {formatCurrency(balanceInfo.closingBalance)}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {balanceInfo.closingDate ? new Date(balanceInfo.closingDate).toLocaleDateString() : 'N/A'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2" color="textSecondary">
                Net Change
              </Typography>
              <Typography 
                variant="h4" 
                color={balanceInfo.netChange && balanceInfo.netChange >= 0 ? 'success.main' : 'error.main'}
              >
                {formatChange(balanceInfo.netChange)}
              </Typography>
              <Chip 
                label={balanceInfo.netChange && balanceInfo.netChange >= 0 ? 'Positive' : 'Negative'} 
                color={balanceInfo.netChange && balanceInfo.netChange >= 0 ? 'success' : 'error'}
                size="small"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Monthly Balance Progression */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Monthly Balance Progression
          </Typography>
          
          <Grid container spacing={2}>
            {Object.entries(balanceInfo.monthlyBalances)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([month, monthData]) => (
                <Grid item xs={12} sm={6} md={4} key={month}>
                  <Box 
                    sx={{ 
                      p: 2, 
                      border: 1, 
                      borderColor: 'divider', 
                      borderRadius: 1,
                      backgroundColor: 'background.paper'
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="bold">
                      {new Date(month + '-01').toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </Typography>
                    
                    <Box mt={1}>
                      <Typography variant="body2" color="textSecondary">
                        Opening: {formatCurrency(monthData.openingBalance)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Closing: {formatCurrency(monthData.closingBalance)}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight="bold"
                        color={monthData.netChange && monthData.netChange >= 0 ? 'success.main' : 'error.main'}
                      >
                        Change: {formatChange(monthData.netChange)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BalanceSummary; 