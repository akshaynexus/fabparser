import { createTheme, ThemeOptions } from '@mui/material/styles';

// Color palette for glassmorphic design
const glassmorphicColors = {
  primary: {
    main: '#007AFF',
    light: '#40A9FF',
    dark: '#0056CC',
    gradient: 'linear-gradient(135deg, #007AFF 0%, #40A9FF 100%)',
  },
  secondary: {
    main: '#FF9500',
    light: '#FFB340',
    dark: '#CC7700',
    gradient: 'linear-gradient(135deg, #FF9500 0%, #FFB340 100%)',
  },
  success: {
    main: '#34C759',
    light: '#5ED17A',
    dark: '#28A745',
    gradient: 'linear-gradient(135deg, #34C759 0%, #5ED17A 100%)',
  },
  error: {
    main: '#FF3B30',
    light: '#FF6B5A',
    dark: '#E8392D',
    gradient: 'linear-gradient(135deg, #FF3B30 0%, #FF6B5A 100%)',
  },
  warning: {
    main: '#FF9500',
    light: '#FFB340',
    dark: '#CC7700',
    gradient: 'linear-gradient(135deg, #FF9500 0%, #FFB340 100%)',
  },
  info: {
    main: '#5AC8FA',
    light: '#7DD3FC',
    dark: '#0EA5E9',
    gradient: 'linear-gradient(135deg, #5AC8FA 0%, #7DD3FC 100%)',
  },
};

// Dark mode glassmorphic theme
export const createGlassmorphicTheme = (darkMode: boolean = true) => {
  const baseTheme: ThemeOptions = {
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: glassmorphicColors.primary,
      secondary: glassmorphicColors.secondary,
      success: glassmorphicColors.success,
      error: glassmorphicColors.error,
      warning: glassmorphicColors.warning,
      info: glassmorphicColors.info,
      background: {
        default: darkMode 
          ? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #1a1a2e 100%)'
          : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #bae6fd 50%, #7dd3fc 75%, #38bdf8 100%)',
        paper: darkMode 
          ? 'rgba(255, 255, 255, 0.05)'
          : 'rgba(255, 255, 255, 0.8)',
      },
      text: {
        primary: darkMode ? '#ffffff' : '#1a202c',
        secondary: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(26, 32, 44, 0.7)',
      },
      divider: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif',
      h1: {
        fontWeight: 700,
        fontSize: { xs: '1.8rem', sm: '2rem', md: '2.5rem' },
        letterSpacing: '-0.02em',
        lineHeight: 1.2,
        background: glassmorphicColors.primary.gradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      },
      h2: {
        fontWeight: 600,
        fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
        letterSpacing: '-0.01em',
        lineHeight: 1.3,
      },
      h3: {
        fontWeight: 600,
        fontSize: { xs: '1.25rem', sm: '1.375rem', md: '1.5rem' },
        letterSpacing: '-0.01em',
        lineHeight: 1.4,
      },
      h4: {
        fontWeight: 600,
        fontSize: { xs: '1.125rem', sm: '1.1875rem', md: '1.25rem' },
        lineHeight: 1.4,
      },
      h5: {
        fontWeight: 500,
        fontSize: { xs: '1rem', sm: '1.0625rem', md: '1.125rem' },
        lineHeight: 1.5,
      },
      h6: {
        fontWeight: 500,
        fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
        lineHeight: 1.5,
      },
      body1: {
        fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
        lineHeight: 1.6,
        fontWeight: 400,
      },
      body2: {
        fontSize: { xs: '0.75rem', sm: '0.8125rem', md: '0.875rem' },
        lineHeight: 1.5,
        fontWeight: 400,
      },
      caption: {
        fontSize: '0.75rem',
        lineHeight: 1.4,
        fontWeight: 500,
        letterSpacing: '0.025em',
      },
    },
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1536,
      },
    },
    shape: {
      borderRadius: 20,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: darkMode 
              ? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #1a1a2e 100%)'
              : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #bae6fd 50%, #7dd3fc 75%, #38bdf8 100%)',
            backgroundAttachment: 'fixed',
            minHeight: '100vh',
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
              borderRadius: '4px',
              '&:hover': {
                background: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
              },
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            background: darkMode 
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: darkMode 
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '20px',
            boxShadow: darkMode
              ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)'
              : '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: darkMode
                ? '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                : '0 12px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.3)',
              background: darkMode 
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(255, 255, 255, 0.35)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            background: darkMode 
              ? 'rgba(255, 255, 255, 0.03)'
              : 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(15px)',
            WebkitBackdropFilter: 'blur(15px)',
            border: darkMode 
              ? '1px solid rgba(255, 255, 255, 0.08)'
              : '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            boxShadow: darkMode
              ? '0 4px 20px rgba(0, 0, 0, 0.25)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: darkMode 
              ? 'rgba(10, 10, 10, 0.8)'
              : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: 'none',
            borderBottom: darkMode 
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 500,
            padding: '10px 20px',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-1px)',
            },
          },
          contained: {
            background: glassmorphicColors.primary.gradient,
            border: '1px solid rgba(0, 122, 255, 0.3)',
            color: 'white',
            '&:hover': {
              background: 'linear-gradient(135deg, #0056CC 0%, #007AFF 100%)',
              boxShadow: '0 8px 25px rgba(0, 122, 255, 0.4)',
            },
          },
          outlined: {
            background: darkMode 
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(255, 255, 255, 0.2)',
            border: darkMode 
              ? '1px solid rgba(255, 255, 255, 0.2)'
              : '1px solid rgba(0, 0, 0, 0.1)',
            '&:hover': {
              background: darkMode 
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(255, 255, 255, 0.3)',
              border: darkMode 
                ? '1px solid rgba(255, 255, 255, 0.3)'
                : '1px solid rgba(0, 0, 0, 0.2)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              background: darkMode 
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              borderRadius: '12px',
              transition: 'all 0.2s ease',
              '&:hover': {
                background: darkMode 
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(255, 255, 255, 0.4)',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: glassmorphicColors.primary.main,
                },
              },
              '&.Mui-focused': {
                background: darkMode 
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(255, 255, 255, 0.5)',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: glassmorphicColors.primary.main,
                  borderWidth: '2px',
                },
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: darkMode 
                  ? 'rgba(255, 255, 255, 0.2)'
                  : 'rgba(0, 0, 0, 0.1)',
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            background: darkMode 
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: darkMode 
              ? '1px solid rgba(255, 255, 255, 0.15)'
              : '1px solid rgba(0, 0, 0, 0.1)',
            color: darkMode ? 'white' : 'inherit',
            fontWeight: 500,
            transition: 'all 0.2s ease',
            '&:hover': {
              background: darkMode 
                ? 'rgba(255, 255, 255, 0.15)'
                : 'rgba(255, 255, 255, 0.4)',
              transform: 'translateY(-1px)',
            },
            '&.MuiChip-filled': {
              background: glassmorphicColors.primary.gradient,
              color: 'white',
              border: 'none',
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
            transition: 'all 0.2s ease',
            '&:hover': {
              background: darkMode 
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(255, 255, 255, 0.2)',
            },
            '&.Mui-selected': {
              background: glassmorphicColors.primary.gradient,
              color: 'white',
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            background: darkMode 
              ? 'rgba(255, 255, 255, 0.03)'
              : 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(15px)',
            WebkitBackdropFilter: 'blur(15px)',
            borderRadius: '16px',
            padding: '4px',
            border: darkMode 
              ? '1px solid rgba(255, 255, 255, 0.08)'
              : '1px solid rgba(0, 0, 0, 0.05)',
          },
          indicator: {
            display: 'none',
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            background: darkMode 
              ? 'rgba(0, 0, 0, 0.9)'
              : 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: darkMode 
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: 500,
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: '8px',
            height: '8px',
            background: darkMode 
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.1)',
          },
          bar: {
            borderRadius: '8px',
          },
        },
      },
    },
  };

  return createTheme(baseTheme);
};