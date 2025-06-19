import React from 'react';
import { Grid, Card, CardContent, Typography } from '@mui/material';

interface TransactionTableProps {
  data: any;
}

const TransactionTable: React.FC<TransactionTableProps> = ({ data }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h5" gutterBottom>
          Transaction Details
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6">
              Detailed transaction table coming soon...
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default TransactionTable; 