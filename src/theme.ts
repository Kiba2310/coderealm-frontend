import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00e699', // Neon green from the design
      contrastText: '#08060d',
    },
    secondary: {
      main: '#ff4b4b', // Red for boss/damage
    },
    background: {
      default: '#0b1215', // Dark deep teal
      paper: '#11191f',   // Elevated surfaces
    },
    text: {
      primary: '#f3f4f6',
      secondary: '#9ca3af',
    },
    success: {
      main: '#00e699',
    },
    error: {
      main: '#ff4b4b',
    },
    divider: '#1e293b',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '3.5rem',
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        body {
          background: linear-gradient(rgba(11, 18, 21, 0.8), rgba(6, 28, 30, 0.8)), url('/bg.png') center / 100vw 100vh fixed !important;
        }
      `,
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 16, // Pill shape
          padding: '12px 28px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: 'none',
          backgroundImage: 'none',
          border: '1px solid #1e293b',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 600,
          fontSize: '0.85rem',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          height: 8,
          backgroundColor: '#1e293b',
        },
        bar: {
          borderRadius: 10,
        },
      },
    },
  },
});

export default theme;
