import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  ButtonGroup,
  Stack,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  DatePicker,
  Divider,
  IconButton,
  Collapse,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Today,
  DateRange,
  CalendarMonth,
  ExpandMore,
  ExpandLess,
  FilterList,
  Clear,
  TrendingUp,
  Schedule,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';

export interface TimeFrame {
  label: string;
  value: string;
  start: Date;
  end: Date;
  color?: string;
}

interface TimeframeFilterProps {
  onTimeframeChange: (timeframe: TimeFrame | null) => void;
  selectedTimeframe?: TimeFrame | null;
  availableMonths?: string[];
  compact?: boolean;
}

const TimeframeFilter: React.FC<TimeframeFilterProps> = ({
  onTimeframeChange,
  selectedTimeframe,
  availableMonths = [],
  compact = false
}) => {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getPresetTimeframes = (): TimeFrame[] => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfLast30Days = new Date(now);
    startOfLast30Days.setDate(now.getDate() - 30);
    const startOfLast90Days = new Date(now);
    startOfLast90Days.setDate(now.getDate() - 90);

    return [
      {
        label: 'Today',
        value: 'today',
        start: startOfToday,
        end: now,
        color: theme.palette.primary.main,
      },
      {
        label: 'This Week',
        value: 'week',
        start: startOfWeek,
        end: now,
        color: theme.palette.secondary.main,
      },
      {
        label: 'This Month',
        value: 'month',
        start: startOfMonth,
        end: now,
        color: theme.palette.success.main,
      },
      {
        label: 'Last 30 Days',
        value: 'last30',
        start: startOfLast30Days,
        end: now,
        color: theme.palette.info.main,
      },
      {
        label: 'Last 90 Days',
        value: 'last90',
        start: startOfLast90Days,
        end: now,
        color: theme.palette.warning.main,
      },
      {
        label: 'This Year',
        value: 'year',
        start: startOfYear,
        end: now,
        color: theme.palette.error.main,
      },
    ];
  };

  const getMonthTimeframes = (): TimeFrame[] => {
    return availableMonths.map(month => {
      const [year, monthNum] = month.split('-');
      const start = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const end = new Date(parseInt(year), parseInt(monthNum), 0);
      
      return {
        label: new Intl.DateTimeFormat('en-US', { 
          month: 'long', 
          year: 'numeric' 
        }).format(start),
        value: month,
        start,
        end,
        color: theme.palette.primary.main,
      };
    });
  };

  const handlePresetSelect = (timeframe: TimeFrame) => {
    setSelectedPreset(timeframe.value);
    setCustomStart(null);
    setCustomEnd(null);
    onTimeframeChange(timeframe);
  };

  const handleCustomRange = () => {
    if (customStart && customEnd) {
      const timeframe: TimeFrame = {
        label: `${customStart.toLocaleDateString()} - ${customEnd.toLocaleDateString()}`,
        value: 'custom',
        start: customStart,
        end: customEnd,
        color: theme.palette.primary.main,
      };
      setSelectedPreset('custom');
      onTimeframeChange(timeframe);
    }
  };

  const handleClear = () => {
    setSelectedPreset('');
    setCustomStart(null);
    setCustomEnd(null);
    onTimeframeChange(null);
  };

  const presetTimeframes = getPresetTimeframes();
  const monthTimeframes = getMonthTimeframes();

  if (compact) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton
              size="small"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
            <Schedule color="primary" />
            <Typography variant="subtitle2">Timeframe</Typography>
            {selectedTimeframe && (
              <Chip
                label={selectedTimeframe.label}
                size="small"
                color="primary"
                variant="outlined"
                onDelete={handleClear}
              />
            )}
          </Stack>
          
          <Collapse in={isExpanded}>
            <Box sx={{ mt: 2 }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" gutterBottom>Quick Select</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                    {presetTimeframes.slice(0, 4).map((timeframe) => (
                      <Chip
                        key={timeframe.value}
                        label={timeframe.label}
                        clickable
                        size="small"
                        variant={selectedPreset === timeframe.value ? 'filled' : 'outlined'}
                        onClick={() => handlePresetSelect(timeframe)}
                        sx={{ 
                          color: selectedPreset === timeframe.value ? 'white' : timeframe.color,
                          borderColor: timeframe.color,
                          backgroundColor: selectedPreset === timeframe.value ? timeframe.color : 'transparent',
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <DateRange color="primary" />
            <Typography variant="h6">Time Period</Typography>
          </Stack>
          {selectedTimeframe && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Chip
                label={selectedTimeframe.label}
                color="primary"
                variant="outlined"
                onDelete={handleClear}
                deleteIcon={<Clear />}
              />
              <Typography variant="body2" color="text.secondary">
                {selectedTimeframe.start.toLocaleDateString()} - {selectedTimeframe.end.toLocaleDateString()}
              </Typography>
            </Stack>
          )}
        </Stack>

        <Stack spacing={3}>
          {/* Quick Presets */}
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Today fontSize="small" />
              Quick Select
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
              {presetTimeframes.map((timeframe) => (
                <Button
                  key={timeframe.value}
                  variant={selectedPreset === timeframe.value ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => handlePresetSelect(timeframe)}
                  sx={{
                    borderColor: timeframe.color,
                    color: selectedPreset === timeframe.value ? 'white' : timeframe.color,
                    backgroundColor: selectedPreset === timeframe.value ? timeframe.color : 'transparent',
                    '&:hover': {
                      backgroundColor: selectedPreset === timeframe.value 
                        ? timeframe.color 
                        : `${timeframe.color}20`,
                    },
                  }}
                >
                  {timeframe.label}
                </Button>
              ))}
            </Stack>
          </Box>

          <Divider />

          {/* Monthly Selection */}
          {monthTimeframes.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarMonth fontSize="small" />
                Available Months
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                {monthTimeframes.map((timeframe) => (
                  <Chip
                    key={timeframe.value}
                    label={timeframe.label}
                    clickable
                    variant={selectedPreset === timeframe.value ? 'filled' : 'outlined'}
                    onClick={() => handlePresetSelect(timeframe)}
                    color="primary"
                    size="small"
                  />
                ))}
              </Stack>
            </Box>
          )}

          <Divider />

          {/* Custom Range */}
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterList fontSize="small" />
              Custom Range
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                <MuiDatePicker
                  label="Start Date"
                  value={customStart}
                  onChange={setCustomStart}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: isMobile,
                    },
                  }}
                />
                <MuiDatePicker
                  label="End Date"
                  value={customEnd}
                  onChange={setCustomEnd}
                  minDate={customStart || undefined}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: isMobile,
                    },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleCustomRange}
                  disabled={!customStart || !customEnd}
                  startIcon={<TrendingUp />}
                  size="small"
                >
                  Apply
                </Button>
              </Stack>
            </LocalizationProvider>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default TimeframeFilter;