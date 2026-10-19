import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, Snackbar, Alert, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { getStoreItems, refreshStore, buyStoreItem, type StoreItem } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import DiamondIcon from '@mui/icons-material/Diamond';
import TerminalIcon from '@mui/icons-material/Terminal';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import ScienceIcon from '@mui/icons-material/Science';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import PestControlIcon from '@mui/icons-material/PestControl';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import AutorenewIcon from '@mui/icons-material/Autorenew';

const iconMap: any = {
  'neon_theme': <TerminalIcon sx={{ color: '#60a5fa' }} />,
  'fire_avatar': <LocalFireDepartmentIcon sx={{ color: '#f87171' }} />,
  'xp_amulet': <ScienceIcon sx={{ color: '#a78bfa' }} />,
  'freeze_rune': <AcUnitIcon sx={{ color: '#60a5fa' }} />,
  'helper': <PestControlIcon sx={{ color: '#fbbf24' }} />,
  'dragon_crest': <ColorLensIcon sx={{ color: '#fbbf24' }} />,
};

const Storefront: React.FC = () => {
  const { user, updateUserContext } = useAuth();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const storeItems = await getStoreItems();
      setItems(storeItems);
    } catch (error) {
      console.error('Failed to fetch store items:', error);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Közönséges': return '#9ca3af';
      case 'Ritka': return '#60a5fa';
      case 'Epikus': return '#c084fc';
      case 'Legendás': return '#fbbf24';
      default: return '#fff';
    }
  };

  const handlePurchase = async (item: StoreItem) => {
    if (user && user.points >= item.cost) {
      try {
        await buyStoreItem(item.id);
        updateUserContext({
          points: user.points - item.cost,
          active_effects: [...(user.active_effects || []), item.id]
        });
        setMessage('Sikeres vásárlás!');
      } catch (error) {
        setMessage('Sikertelen vásárlás!');
      }
    } else {
      setMessage('Nincs elég pontod!');
    }
  };

  const handleRefresh = async () => {
    if (user && user.points >= 50) {
      try {
        const newItems = await refreshStore();
        setItems(newItems);
        updateUserContext({ points: user.points - 50 });
        setMessage('Bolt frissítve!');
      } catch (error) {
        setMessage('Nem sikerült frissíteni a boltot!');
      }
    } else {
      setMessage('Nincs elég pontod a frissítéshez!');
    }
  };

  return (
    <Box sx={{ p: 4, pt: 8, maxWidth: 1000, margin: '0 auto', width: '100%' }}>
      <Typography variant="overline" color="primary" sx={{ fontWeight: 'bold', letterSpacing: 2, display: 'block', mb: 1 }}>
        BOLT
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 6 }}>
        <Box>
          <Typography variant="h2" sx={{ mt: 1, mb: 2 }}>
            Váltsd be a pontjaid
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600 }}>
            A feladatokért és tesztekért kapott pontok itt költhetők el kozmetikai tárgyakra és ideiglenes boostokra.
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' }}>
          <Chip 
            icon={<DiamondIcon sx={{ color: 'primary.main !important' }} />} 
            label={`${user?.points || 0} pont`} 
            variant="outlined"
            sx={{ color: 'primary.main', borderColor: '#082f24', bgcolor: '#061c16', fontWeight: 600, fontSize: '1.2rem', py: 2.5, px: 1, borderRadius: 3 }}
          />
          <Button 
            variant="outlined" 
            size="small"
            startIcon={<AutorenewIcon />}
            onClick={handleRefresh}
            sx={{ borderRadius: 2, borderColor: '#082f24', color: 'primary.main' }}
          >
            Frissítés (50 pont)
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {items.map((item) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
            <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} style={{ height: '100%' }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0b1215', p: 1 }}>
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', pb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ p: 1, bgcolor: '#11191f', borderRadius: 2 }}>
                      {iconMap[item.id] || <DiamondIcon sx={{ color: '#fff' }} />}
                    </Box>
                    <Typography variant="caption" sx={{ color: getRarityColor(item.rarity) }}>
                      {item.rarity}
                    </Typography>
                  </Box>
                  <Typography variant="h6" gutterBottom>{item.name}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>{item.description}</Typography>
                  
                  <Button 
                    variant="contained" 
                    fullWidth 
                    disabled={!user || user.points < item.cost || user.active_effects?.includes(item.id)}
                    onClick={() => handlePurchase(item)}
                    sx={{ borderRadius: 2, display: 'flex', gap: 1, py: 1.5 }}
                  >
                    {user?.active_effects?.includes(item.id) ? (
                      'Megvásárolva'
                    ) : (
                      <>
                        <DiamondIcon fontSize="small" sx={{ opacity: 0.8 }} />
                        {item.cost} pont
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
      
      <Snackbar open={!!message} autoHideDuration={3000} onClose={() => setMessage('')}>
        <Alert severity={message.includes('Sikeres') || message.includes('Bolt frissítve') ? 'success' : 'error'}>{message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Storefront;
