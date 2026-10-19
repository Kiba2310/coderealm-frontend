import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Box, Button, Chip, Menu, MenuItem, IconButton, Avatar } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import DiamondIcon from '@mui/icons-material/Diamond';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import { useAuth } from '../contexts/AuthContext';
import { getAvatarUrl } from '../api';

const NavLink: React.FC<{ to: string; currentPath: string; children: React.ReactNode }> = ({ to, currentPath, children }) => (
  <Button
    component={Link}
    to={to}
    sx={{
      color: currentPath === to ? '#fff' : '#9ca3af',
      fontWeight: currentPath === to ? 600 : 500,
      '&:hover': { color: '#fff', backgroundColor: 'transparent' }
    }}
  >
    {children}
  </Button>
);

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, logout, hasRole } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [resourcesAnchorEl, setResourcesAnchorEl] = useState<null | HTMLElement>(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setResourcesAnchorEl(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'rgba(11, 18, 21, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #1e293b'
        }}
      >
        <Toolbar sx={{ maxWidth: 1200, width: '100%', mx: 'auto', display: 'flex', gap: 2 }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', mr: 2 }} onClick={() => navigate('/')}>
            <Box sx={{ bgcolor: 'primary.main', color: '#000', borderRadius: 1.5, p: 0.5, display: 'flex', mr: 1.5 }}>
              <CodeIcon fontSize="small" />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
              CodeRealm
            </Typography>
          </Box>

          {/* Links */}
          <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
            <NavLink to="/learn" currentPath={location.pathname}>Tanulás</NavLink>
            <NavLink to="/leaderboard" currentPath={location.pathname}>Ranglista</NavLink>

            <Button
              onClick={handleMenuOpen}
              sx={{
                color: (location.pathname === '/guilds' || location.pathname === '/dungeon') ? '#fff' : '#9ca3af',
                fontWeight: (location.pathname === '/guilds' || location.pathname === '/dungeon') ? 600 : 500,
                '&:hover': { color: '#fff', backgroundColor: 'transparent' }
              }}
            >
              Közösség
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              slotProps={{ paper: { sx: { bgcolor: '#0f172a', border: '1px solid #1e293b' } } }}
            >
              <MenuItem component={Link} to="/guilds" onClick={handleMenuClose} sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>Céhek</MenuItem>
              <MenuItem component={Link} to="/dungeon" onClick={handleMenuClose} sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>Dungeon</MenuItem>
            </Menu>

            {user && (
              <NavLink to="/store" currentPath={location.pathname}>Bolt</NavLink>
            )}

            {(hasRole('admin') || hasRole('teacher')) && (
              <NavLink to="/tests" currentPath={location.pathname}>Tesztek</NavLink>
            )}

            {/* Resources Menu */}
            <Box>
              <Button
                color="inherit"
                sx={{
                  color: location.pathname.startsWith('/resources') ? '#fff' : '#9ca3af',
                  fontWeight: location.pathname.startsWith('/resources') ? 600 : 500,
                  '&:hover': { color: '#fff', backgroundColor: 'transparent' }
                }}
                onClick={(e) => setResourcesAnchorEl(e.currentTarget)}
              >
                Források
              </Button>
              <Menu
                anchorEl={resourcesAnchorEl}
                open={Boolean(resourcesAnchorEl)}
                onClose={handleMenuClose}
                disableScrollLock
                sx={{ '& .MuiPaper-root': { bgcolor: '#0f172a', border: '1px solid #1e293b', borderRadius: 2, minWidth: 200 } }}
              >
                <MenuItem component={Link} to="/resources/playground" onClick={handleMenuClose} sx={{ color: '#9ca3af', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.05)' } }}>
                  Játszótér (Kód futtató)
                </MenuItem>
                <MenuItem component={Link} to="/resources/cheat-sheets" onClick={handleMenuClose} sx={{ color: '#9ca3af', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.05)' } }}>
                  Segédletek (Cheat Sheets)
                </MenuItem>
              </Menu>
            </Box>
          </Box>

          {/* Stats & Actions */}
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            {user ? (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<FlashOnIcon />}
                  component={Link}
                  to="/dungeon"
                  sx={{ color: '#000', px: 2, borderRadius: 2, display: { xs: 'none', md: 'flex' } }}
                >
                  Raid
                </Button>
                <Chip
                  icon={<DiamondIcon sx={{ color: 'primary.main !important' }} fontSize="small" />}
                  label={`${user.points ?? 0} pont`}
                  variant="outlined"
                  sx={{ color: 'primary.main', borderColor: '#082f24', bgcolor: '#061c16', fontWeight: 600 }}
                />

                <IconButton onClick={(e) => setUserMenuAnchor(e.currentTarget)} sx={{ p: 0, ml: 1 }}>
                  <Avatar
                    alt={user.nickname || user.email.split('@')[0]}
                    src={getAvatarUrl(user.avatar_url)}
                    sx={{ 
                      width: 40, 
                      height: 40, 
                      border: user.active_effects?.includes('fire_avatar')
                        ? '2px solid #ef4444'
                        : user.active_effects?.includes('dragon_crest')
                        ? '2px solid #fbbf24'
                        : user.active_effects?.includes('neon_theme')
                        ? '2px solid #06b6d4'
                        : '2px solid',
                      borderColor: user.active_effects?.includes('fire_avatar')
                        ? '#ef4444'
                        : user.active_effects?.includes('dragon_crest')
                        ? '#fbbf24'
                        : user.active_effects?.includes('neon_theme')
                        ? '#06b6d4'
                        : 'primary.main',
                      boxShadow: user.active_effects?.includes('fire_avatar')
                        ? '0 0 10px #ef4444'
                        : user.active_effects?.includes('dragon_crest')
                        ? '0 0 10px #fbbf24'
                        : user.active_effects?.includes('neon_theme')
                        ? '0 0 10px #06b6d4'
                        : 'none',
                    }}
                  >
                    {!user.avatar_url && (user.nickname ? user.nickname[0].toUpperCase() : user.email[0].toUpperCase())}
                  </Avatar>
                </IconButton>

                <Menu
                  anchorEl={userMenuAnchor}
                  open={Boolean(userMenuAnchor)}
                  onClose={() => setUserMenuAnchor(null)}
                  slotProps={{ paper: { sx: { bgcolor: '#0f172a', border: '1px solid #1e293b', mt: 1.5, minWidth: 200 } } }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #1e293b', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 'bold' }}>
                      {user.nickname || user.email.split('@')[0]}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#9ca3af' }}>{user.email}</Typography>
                  </Box>

                  <MenuItem component={Link} to="/dashboard" onClick={() => setUserMenuAnchor(null)} sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>Profil</MenuItem>
                  <MenuItem component={Link} to="/daily-challenge" onClick={() => setUserMenuAnchor(null)} sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>Napi Kihívás</MenuItem>
                  <MenuItem component={Link} to="/calendar" onClick={() => setUserMenuAnchor(null)} sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>Naptár</MenuItem>
                  <MenuItem component={Link} to="/groups" onClick={() => setUserMenuAnchor(null)} sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>Tantermek</MenuItem>
                  {hasRole('admin') && (
                    <MenuItem component={Link} to="/admin" onClick={() => setUserMenuAnchor(null)} sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>Admin</MenuItem>
                  )}

                  <MenuItem
                    onClick={async () => {
                      setUserMenuAnchor(null);
                      if (window.confirm('Biztosan törlöd a tesztelési adatokat?')) {
                        try {
                          const { resetProgress } = await import('../api');
                          await resetProgress();
                          localStorage.removeItem('coderealm_progress');
                          localStorage.removeItem('bootdevclone_progress');
                          window.location.reload();
                        } catch (err) {
                          console.error('Reset error:', err);
                          alert('Hiba a reset során.');
                        }
                      }
                    }}
                    sx={{ color: 'warning.main', '&:hover': { bgcolor: 'rgba(255,152,0,0.1)' }, mt: 1 }}
                  >
                    Dev: Reset
                  </MenuItem>

                  <MenuItem onClick={() => { setUserMenuAnchor(null); logout(); }} sx={{ color: 'error.main', '&:hover': { bgcolor: 'rgba(244,67,54,0.1)' }, mt: 1, borderTop: '1px solid #1e293b', pt: 1.5 }}>
                    Kijelentkezés
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                onClick={login}
                variant="contained"
                color="primary"
                sx={{ color: '#000', textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
              >
                Bejelentkezés
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, width: '100%', maxWidth: 1200, mx: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
