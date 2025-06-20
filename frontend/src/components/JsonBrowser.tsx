import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Stack,
  Chip,
  IconButton,
  Collapse,
  Paper,
  Button,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab,
  Alert,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Search,
  ExpandMore,
  ExpandLess,
  ContentCopy,
  Download,
  Code,
  DataObject,
  TableView,
  ViewList,
  BookmarkBorder,
  Share,
} from '@mui/icons-material';
import { TransactionSummary } from '../App';

interface JsonBrowserProps {
  data: TransactionSummary;
}

interface JsonViewerProps {
  data: any;
  path?: string;
  level?: number;
  searchQuery?: string;
  maxDepth?: number;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ 
  data, 
  path = '', 
  level = 0, 
  searchQuery = '',
  maxDepth = 10 
}) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const theme = useTheme();

  const isObject = (value: any) => value && typeof value === 'object' && !Array.isArray(value);
  const isArray = (value: any) => Array.isArray(value);
  const isPrimitive = (value: any) => value === null || typeof value !== 'object';

  const shouldHighlight = (key: string, value: any) => {
    if (!searchQuery) return false;
    const searchLower = searchQuery.toLowerCase();
    return (
      key.toLowerCase().includes(searchLower) ||
      (typeof value === 'string' && value.toLowerCase().includes(searchLower))
    );
  };

  const formatValue = (value: any) => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value.toString();
    return JSON.stringify(value);
  };

  const getValueColor = (value: any) => {
    if (value === null || value === undefined) return theme.palette.text.disabled;
    if (typeof value === 'string') return theme.palette.success.main;
    if (typeof value === 'number') return theme.palette.info.main;
    if (typeof value === 'boolean') return theme.palette.warning.main;
    return theme.palette.text.primary;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add toast notification here
    });
  };

  const renderValue = (key: string, value: any, currentPath: string) => {
    const fullPath = currentPath ? `${currentPath}.${key}` : key;
    const isCollapsed = collapsed[fullPath];
    const highlight = shouldHighlight(key, value);

    if (level > maxDepth) {
      return (
        <Box key={key} sx={{ ml: level * 2, py: 0.5 }}>
          <Typography variant="body2" color="text.disabled">
            ... (max depth reached)
          </Typography>
        </Box>
      );
    }

    if (isPrimitive(value)) {
      return (
        <Box 
          key={key} 
          sx={{ 
            ml: level * 2, 
            py: 0.25,
            backgroundColor: highlight ? 'rgba(255, 255, 0, 0.1)' : 'transparent',
            borderRadius: 1,
            px: highlight ? 1 : 0,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography 
              variant="body2" 
              component="span" 
              sx={{ color: theme.palette.primary.main, fontWeight: 500 }}
            >
              {key}:
            </Typography>
            <Typography 
              variant="body2" 
              component="span" 
              sx={{ color: getValueColor(value), fontFamily: 'monospace' }}
            >
              {formatValue(value)}
            </Typography>
            <IconButton 
              size="small" 
              onClick={() => copyToClipboard(formatValue(value))}
              sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
            >
              <ContentCopy fontSize="inherit" />
            </IconButton>
          </Stack>
        </Box>
      );
    }

    const itemCount = isArray(value) ? value.length : Object.keys(value).length;
    const previewText = isArray(value) ? `Array(${itemCount})` : `Object(${itemCount})`;

    return (
      <Box key={key} sx={{ ml: level * 2 }}>
        <Stack 
          direction="row" 
          alignItems="center" 
          spacing={1}
          sx={{ 
            py: 0.5,
            backgroundColor: highlight ? 'rgba(255, 255, 0, 0.1)' : 'transparent',
            borderRadius: 1,
            px: highlight ? 1 : 0,
          }}
        >
          <IconButton
            size="small"
            onClick={() => setCollapsed(prev => ({ ...prev, [fullPath]: !isCollapsed }))}
          >
            {isCollapsed ? <ExpandMore /> : <ExpandLess />}
          </IconButton>
          <Typography 
            variant="body2" 
            component="span" 
            sx={{ color: theme.palette.primary.main, fontWeight: 500 }}
          >
            {key}:
          </Typography>
          <Chip 
            label={previewText} 
            size="small" 
            variant="outlined"
            sx={{ height: 20, fontSize: '0.7rem' }}
          />
          <IconButton 
            size="small" 
            onClick={() => copyToClipboard(JSON.stringify(value, null, 2))}
            sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
          >
            <ContentCopy fontSize="inherit" />
          </IconButton>
        </Stack>
        
        <Collapse in={!isCollapsed}>
          <Box sx={{ borderLeft: `2px solid ${theme.palette.divider}`, ml: 1, pl: 1 }}>
            {isArray(value) ? (
              value.map((item: any, index: number) => 
                renderValue(`[${index}]`, item, fullPath)
              )
            ) : (
              Object.entries(value).map(([subKey, subValue]) => 
                renderValue(subKey, subValue, fullPath)
              )
            )}
          </Box>
        </Collapse>
      </Box>
    );
  };

  return (
    <Box>
      {isObject(data) ? (
        Object.entries(data).map(([key, value]) => renderValue(key, value, path))
      ) : isArray(data) ? (
        data.map((item: any, index: number) => renderValue(`[${index}]`, item, path))
      ) : (
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {formatValue(data)}
        </Typography>
      )}
    </Box>
  );
};

const JsonBrowser: React.FC<JsonBrowserProps> = ({ data }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState(0); // 0: Tree, 1: Raw JSON, 2: Table
  const [maxDepth, setMaxDepth] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    
    const filterObject = (obj: any, path = ''): any => {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map((item, index) => filterObject(item, `${path}[${index}]`));
      }

      const filtered: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        const keyMatches = key.toLowerCase().includes(searchQuery.toLowerCase());
        const valueMatches = typeof value === 'string' && 
          value.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (keyMatches || valueMatches || (typeof value === 'object' && value !== null)) {
          if (typeof value === 'object' && value !== null) {
            const filteredChild = filterObject(value, currentPath);
            if (keyMatches || valueMatches || Object.keys(filteredChild).length > 0) {
              filtered[key] = filteredChild;
            }
          } else {
            filtered[key] = value;
          }
        }
      }
      return filtered;
    };

    return filterObject(data);
  }, [data, searchQuery]);

  const handleExport = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transaction_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getDataSummary = () => {
    return {
      totalSize: JSON.stringify(data).length,
      transactionCount: data.transactions?.length || 0,
      categoryCount: Object.keys(data.summary?.byCategory || {}).length,
      monthCount: Object.keys(data.summary?.byMonth || {}).length,
      balanceInfo: data.balanceInfo ? 'Available' : 'Not Available',
    };
  };

  const summary = getDataSummary();

  return (
    <Box sx={{ height: '100%', p: 2, overflow: 'auto' }}>
      {/* Header */}
      <Card sx={{ mb: 2, flexShrink: 0 }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DataObject color="primary" />
                JSON Data Browser
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Explore and analyze your transaction data structure
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleExport}
                size="small"
              >
                Export
              </Button>
              <Button
                variant="outlined"
                startIcon={<Share />}
                onClick={() => setAnchorEl(document.body)}
                size="small"
              >
                Share
              </Button>
            </Stack>
          </Stack>

          {/* Data Summary */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Data Summary</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} divider={<Divider orientation="vertical" flexItem />}>
              <Chip label={`${summary.totalSize.toLocaleString()} bytes`} size="small" variant="outlined" />
              <Chip label={`${summary.transactionCount} transactions`} size="small" variant="outlined" />
              <Chip label={`${summary.categoryCount} categories`} size="small" variant="outlined" />
              <Chip label={`${summary.monthCount} months`} size="small" variant="outlined" />
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card sx={{ mb: 2, flexShrink: 0 }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search keys and values..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              size="small"
              sx={{ maxWidth: { sm: 400 } }}
            />
            
            <Tabs value={viewMode} onChange={(_, value) => setViewMode(value)} variant="scrollable">
              <Tab icon={<ViewList />} label="Tree" iconPosition="start" />
              <Tab icon={<Code />} label="Raw JSON" iconPosition="start" />
              <Tab icon={<TableView />} label="Table" iconPosition="start" />
            </Tabs>
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Max Depth</InputLabel>
              <Select
                value={maxDepth}
                label="Max Depth"
                onChange={(e) => setMaxDepth(Number(e.target.value))}
              >
                <MenuItem value={3}>3 levels</MenuItem>
                <MenuItem value={5}>5 levels</MenuItem>
                <MenuItem value={10}>10 levels</MenuItem>
                <MenuItem value={-1}>Unlimited</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {/* Content */}
      <Card sx={{ height: '600px' }}>
        <CardContent sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', p: 2 }}>
          {viewMode === 0 && (
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
              <JsonViewer 
                data={filteredData} 
                searchQuery={searchQuery}
                maxDepth={maxDepth === -1 ? 999 : maxDepth}
              />
            </Box>
          )}
          
          {viewMode === 1 && (
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  backgroundColor: theme.palette.grey[900],
                  height: '100%',
                  overflow: 'auto'
                }}
              >
                <pre style={{ 
                  margin: 0, 
                  color: theme.palette.text.primary,
                  fontSize: '0.875rem',
                  fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {JSON.stringify(filteredData, null, 2)}
                </pre>
              </Paper>
            </Box>
          )}
          
          {viewMode === 2 && (
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Table view coming soon! This will show transactions in a structured table format.
              </Alert>
              {/* Table view implementation would go here */}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Share Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => {
          navigator.clipboard.writeText(JSON.stringify(data, null, 2));
          setAnchorEl(null);
        }}>
          <ContentCopy sx={{ mr: 1 }} />
          Copy JSON
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <BookmarkBorder sx={{ mr: 1 }} />
          Save View
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default JsonBrowser;