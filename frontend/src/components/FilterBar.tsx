import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Stack,
  Chip,
  Button,
  Typography,
  Collapse,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Tooltip,
  Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Search,
  FilterList,
  Clear,
  ExpandMore,
  ExpandLess,
  TuneOutlined,
  CategoryOutlined,
  DateRangeOutlined,
  AttachMoney,
  TrendingUp,
  AutoAwesome,
} from '@mui/icons-material';

import { useAppContext, appActions } from '../context/AppContext';
import TimeframeFilter from './TimeframeFilter';

const FilterBar: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const [quickFilterMode, setQuickFilterMode] = useState<'all' | 'expenses' | 'income'>('all');
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Get available categories from data
  const getCategories = () => {
    if (!state.data) return [];
    return [...new Set(state.data.transactions.map(t => t.category))].sort();
  };

  // Get insights for quick stats
  const getQuickInsights = () => {
    if (!state.filteredTransactions.length) return null;
    
    const totalSpent = state.filteredTransactions
      .filter(t => t.type === 'Debit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalIncome = state.filteredTransactions
      .filter(t => t.type === 'Credit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const topCategory = state.data?.summary.byCategory 
      ? Object.entries(state.data.summary.byCategory)
          .sort(([,a], [,b]) => b.debit - a.debit)[0]
      : null;

    return {
      totalTransactions: state.filteredTransactions.length,
      totalSpent,
      totalIncome,
      netAmount: totalIncome - totalSpent,
      topCategory: topCategory ? topCategory[0] : 'N/A',
    };
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(appActions.setSearchQuery(event.target.value));
  };

  const handleCategoryToggle = (category: string) => {
    const isSelected = state.selectedCategories.includes(category);
    const newCategories = isSelected
      ? state.selectedCategories.filter(c => c !== category)
      : [...state.selectedCategories, category];
    
    dispatch(appActions.setSelectedCategories(newCategories));
  };

  const handleQuickFilter = (mode: 'all' | 'expenses' | 'income') => {
    setQuickFilterMode(mode);
    // Could implement additional logic here for quick filtering
  };

  const handleClearFilters = () => {
    dispatch(appActions.clearFilters());
    setQuickFilterMode('all');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (state.searchQuery) count++;
    if (state.selectedCategories.length > 0) count++;
    if (state.selectedTimeframe) count++;
    return count;
  };

  const insights = getQuickInsights();
  const categories = getCategories();
  const activeFilterCount = getActiveFilterCount();

  return (
    <Card sx={{ overflow: 'visible' }}>
      <CardContent sx={{ pb: '8px !important', p: 1.5 }}>
        {/* Main Filter Row */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          {/* Search Field */}
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search transactions, merchants, categories, amounts..."
            value={state.searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: state.searchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => dispatch(appActions.setSearchQuery(''))}
                  >
                    <Clear />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ 
              maxWidth: { md: 400 },
              '& .MuiOutlinedInput-root': {
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0, 122, 255, 0.15)',
                },
              }
            }}
          />

          {/* Quick Filter Buttons */}
          <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', sm: 'flex' } }}>
            <Button
              variant={quickFilterMode === 'all' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handleQuickFilter('all')}
              startIcon={<AutoAwesome />}
            >
              All
            </Button>
            <Button
              variant={quickFilterMode === 'expenses' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handleQuickFilter('expenses')}
              startIcon={<TrendingUp sx={{ transform: 'rotate(180deg)' }} />}
              color="error"
            >
              Expenses
            </Button>
            <Button
              variant={quickFilterMode === 'income' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handleQuickFilter('income')}
              startIcon={<TrendingUp />}
              color="success"
            >
              Income
            </Button>
          </Stack>

          {/* Filter Controls */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <Badge badgeContent={activeFilterCount} color="primary">
              <Tooltip title="Advanced Filters">
                <IconButton
                  onClick={() => setIsExpanded(!isExpanded)}
                  sx={{
                    background: isExpanded ? 'rgba(0, 122, 255, 0.1)' : 'transparent',
                    '&:hover': {
                      background: 'rgba(0, 122, 255, 0.15)',
                      transform: 'scale(1.05)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <TuneOutlined />
                </IconButton>
              </Tooltip>
            </Badge>

            {activeFilterCount > 0 && (
              <Tooltip title="Clear All Filters">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleClearFilters}
                  startIcon={<Clear />}
                >
                  Clear
                </Button>
              </Tooltip>
            )}
          </Stack>
        </Stack>

        {/* Quick Insights Row */}
        {insights && (
          <Box sx={{ mt: 2 }}>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2} 
              divider={<Divider orientation="vertical" flexItem />}
              sx={{
                p: 2,
                borderRadius: 2,
                background: 'rgba(0, 122, 255, 0.05)',
                border: '1px solid rgba(0, 122, 255, 0.1)',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <AttachMoney sx={{ color: 'success.main', fontSize: '1.2rem' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Net Amount
                  </Typography>
                  <Typography 
                    variant="subtitle2" 
                    color={insights.netAmount >= 0 ? 'success.main' : 'error.main'}
                    fontWeight={600}
                  >
                    {insights.netAmount.toLocaleString('en-AE', { 
                      style: 'currency', 
                      currency: 'AED' 
                    })}
                  </Typography>
                </Box>
              </Stack>
              
              <Stack direction="row" alignItems="center" spacing={1}>
                <CategoryOutlined sx={{ color: 'primary.main', fontSize: '1.2rem' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Transactions
                  </Typography>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {insights.totalTransactions}
                  </Typography>
                </Box>
              </Stack>
              
              <Stack direction="row" alignItems="center" spacing={1}>
                <TrendingUp sx={{ color: 'info.main', fontSize: '1.2rem' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Top Category
                  </Typography>
                  <Typography variant="subtitle2" fontWeight={600} color="info.main">
                    {insights.topCategory}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Box>
        )}

        {/* Expanded Filters */}
        <Collapse in={isExpanded}>
          <Box sx={{ mt: 3 }}>
            <Stack spacing={3}>
              {/* Category Filters */}
              <Box>
                <Typography 
                  variant="subtitle2" 
                  gutterBottom 
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
                >
                  <CategoryOutlined fontSize="small" />
                  Categories
                  {state.selectedCategories.length > 0 && (
                    <Chip 
                      label={`${state.selectedCategories.length} selected`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                  {categories.slice(0, isMobile ? 4 : 8).map((category) => (
                    <Chip
                      key={category}
                      label={category}
                      clickable
                      variant={state.selectedCategories.includes(category) ? 'filled' : 'outlined'}
                      onClick={() => handleCategoryToggle(category)}
                      size="small"
                      sx={{
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                        },
                      }}
                    />
                  ))}
                  {categories.length > (isMobile ? 4 : 8) && (
                    <Chip
                      label={`+${categories.length - (isMobile ? 4 : 8)} more`}
                      variant="outlined"
                      size="small"
                      sx={{ opacity: 0.7 }}
                    />
                  )}
                </Stack>
              </Box>

              {/* Timeframe Filter */}
              <Box>
                <Typography 
                  variant="subtitle2" 
                  gutterBottom 
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
                >
                  <DateRangeOutlined fontSize="small" />
                  Time Period
                  {state.selectedTimeframe && (
                    <Chip 
                      label={state.selectedTimeframe.label}
                      size="small"
                      color="primary"
                      variant="outlined"
                      onDelete={() => dispatch(appActions.setSelectedTimeframe(null))}
                    />
                  )}
                </Typography>
                <TimeframeFilter
                  onTimeframeChange={(timeframe) => dispatch(appActions.setSelectedTimeframe(timeframe))}
                  selectedTimeframe={state.selectedTimeframe}
                  availableMonths={state.data ? Object.keys(state.data.summary.byMonth).sort() : []}
                  compact={true}
                />
              </Box>
            </Stack>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default FilterBar;