import { createTheme } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

export const getTheme = (mode: PaletteMode) => createTheme({
  palette: {
    mode,
    primary: {
      main: '#1976d2',
      ...(mode === 'dark' && {
        main: '#0a0b0d',
      }),
    },
    secondary: {
      main: '#dc004e',
      ...(mode === 'dark' && {
        main: '#f48fb1',
      }),
    },
    background: {
      default: mode === 'light' ? '#f5f5f5' : '#121212',
      paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          ...(mode === 'dark' && {
            backgroundImage: 'none',
          }),
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          ...(mode === 'dark' && {
            backgroundImage: 'none',
          }),
        },
      },
    },
  },
});