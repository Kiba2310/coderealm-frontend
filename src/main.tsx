import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './i18n'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider, CssBaseline } from '@mui/material'
import theme from './theme'
import { loader } from '@monaco-editor/react'

// Load Monaco Editor from CDN with explicit correct URL
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs',
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
