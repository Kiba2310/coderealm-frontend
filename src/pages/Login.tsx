import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, Alert } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      if (res.data && res.data.token) {
        localStorage.setItem('token', res.data.token);
        window.location.href = '/';
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 64px)', bgcolor: 'background.default' }}>
      <Paper sx={{ p: 4, width: '100%', maxWidth: 400, borderRadius: 3, bgcolor: '#11191f', border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", mb: 3, textAlign: "center" }}>
          Bejelentkezés
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <form onSubmit={handleLogin}>
          <TextField
            fullWidth
            disabled
            label="Email"
            type="email"
            variant="outlined"
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.03)' } }}
          />
          <TextField
            fullWidth
            disabled
            label="Jelszó"
            type="password"
            variant="outlined"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.03)' } }}
          />
          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mt: 3, mb: 2, py: 1.5, fontWeight: 'bold' }}
          >
            Bejelentkezés
          </Button>

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={login}
            sx={{ mb: 2, py: 1.5, fontWeight: 'bold', bgcolor: '#f97316', '&:hover': { bgcolor: '#ea580c' } }}
          >
            Bejelentkezés Keycloakkal
          </Button>
          
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
            Nincs még fiókod?{' '}
            <Link to="/register" style={{ color: '#60a5fa', textDecoration: 'none' }}>
              Regisztrálj itt
            </Link>
          </Typography>
        </form>
      </Paper>
    </Box>
  );
};

export default Login;
