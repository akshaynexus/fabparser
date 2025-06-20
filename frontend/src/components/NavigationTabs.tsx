import React from 'react';
import {
  Box,
  Tabs,
  Tab,
  Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard,
  AccountBalance,
  PieChart,
  Timeline,
  BarChart,
  Receipt,
  DataObject,
  TrendingUp,
} from '@mui/icons-material';

import { useAppContext, appActions } from '../context/AppContext';

const NavigationTabs: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const tabs = [
    {
      label: 'Overview',
      icon: <Dashboard />,
      value: 0,
      badge: null,
    },
    {
      label: 'Balance',
      icon: <AccountBalance />,
      value: 1,
      badge: null,
    },
    {
      label: 'Categories',
      icon: <PieChart />,
      value: 2,
      badge: state.data ? Object.keys(state.data.summary.byCategory).length : 0,
    },
    {
      label: 'Trends',
      icon: <Timeline />,
      value: 3,
      badge: state.data ? Object.keys(state.data.summary.byMonth).length : 0,
    },
    {
      label: 'Analytics',
      icon: <BarChart />,
      value: 4,
      badge: null,
    },
    {
      label: 'Transactions',
      icon: <Receipt />,
      value: 5,
      badge: state.filteredTransactions.length,
    },
    {
      label: 'Data Explorer',
      icon: <DataObject />,
      value: 6,
      badge: null,
    },
  ];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    dispatch(appActions.setCurrentTab(newValue));
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Tabs
        value={state.currentTab}
        onChange={handleTabChange}
        variant={isMobile ? 'scrollable' : 'fullWidth'}
        scrollButtons={isMobile ? 'auto' : false}
        allowScrollButtonsMobile
        sx={{
          minHeight: 40,
          '& .MuiTabs-flexContainer': {
            gap: 0.5,
          },
          '& .MuiTab-root': {
            minHeight: 40,
            fontSize: '0.8rem',
            padding: '4px 8px',
          },
        }}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.value}
            icon={
              tab.badge !== null && tab.badge > 0 ? (
                <Badge
                  badgeContent={tab.badge}
                  color="primary"
                  max={9999}
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.65rem',
                      minWidth: '16px',
                      height: '16px',
                      background: 'linear-gradient(135deg, #007AFF 0%, #40A9FF 100%)',
                    },
                  }}
                >
                  {tab.icon}
                </Badge>
              ) : (
                tab.icon
              )
            }
            iconPosition="start"
            label={isMobile ? '' : tab.label}
            sx={{
              minHeight: 60,
              fontWeight: 500,
              fontSize: '0.9rem',
              px: isMobile ? 1 : 3,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-2px)',
                '& .MuiTab-iconWrapper': {
                  transform: 'scale(1.1)',
                },
              },
              '&.Mui-selected': {
                fontWeight: 600,
                '& .MuiTab-iconWrapper': {
                  transform: 'scale(1.05)',
                },
              },
              '& .MuiTab-iconWrapper': {
                transition: 'transform 0.2s ease',
                marginBottom: isMobile ? 0 : 0.5,
                marginRight: isMobile ? 0 : 1,
              },
            }}
          />
        ))}
      </Tabs>
    </Box>
  );
};

export default NavigationTabs;