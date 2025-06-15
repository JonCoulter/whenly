// src/theme.ts
import { createTheme } from '@mui/material/styles';
import type { ThemeOptions, PaletteMode } from '@mui/material/styles';

// Base palette colors (shared between modes)
const baseColors = {
  primary: {
    main: '#2083F2',
  },
  secondary: {
    main: '#FF5623',
  },
};

// Create theme options based on mode
export const getThemeOptions = (mode: PaletteMode): ThemeOptions => ({
  palette: {
    mode,
    primary: baseColors.primary,
    secondary: baseColors.secondary,
    ...(mode === 'light'
      ? {
          // Light mode
          background: {
            default: '#F9FAFB',
            paper: '#FFFFFF',
          },
          text: {
            primary: '#171717',
            secondary: '#6B7280',
          },
          divider: 'rgba(0, 0, 0, 0.12)',
        }
      : {
          // Dark mode
          background: {
            default: '#111827',
            paper: '#1F2937',
          },
          text: {
            primary: '#F9FAFB',
            secondary: '#D1D5DB',
          },
          divider: 'rgba(255, 255, 255, 0.12)',
        }),
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderBottom: '1px solid',
          borderColor: mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
          backgroundColor: mode === 'light' ? '#FFFFFF' : '#1F2937',
        },
      },
    },
  },
});

// Default theme
const theme = createTheme(getThemeOptions('light'));

export default theme;
