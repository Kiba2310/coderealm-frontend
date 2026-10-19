import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { motion } from 'framer-motion';
import GroupsIcon from '@mui/icons-material/Groups';
import { useNavigate } from 'react-router-dom';

const Guilds: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
        <Box 
          sx={{ 
            textAlign: 'center', 
            p: 6, 
            bgcolor: 'rgba(17,25,31,0.6)', 
            backdropFilter: 'blur(10px)', 
            borderRadius: 4, 
            border: '1px dashed', 
            borderColor: 'rgba(255,255,255,0.1)' 
          }}
        >
          <Box sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', width: 100, height: 100, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 4 }}>
            <GroupsIcon sx={{ fontSize: 60, color: 'primary.main' }} />
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, color: '#fff' }}>
        Céhek (Guilds)
      </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
            A céhek fejlesztés alatt állnak. Hamarosan csatlakozhatsz más diákokhoz, alapíthatsz saját klánt, és együtt indulhattok a kihívásokon!
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            size="large" 
            onClick={() => navigate('/learn')}
            sx={{ fontWeight: 'bold', borderRadius: 2 }}
          >
            Vissza a tanuláshoz
          </Button>
        </Box>
      </motion.div>
    </Container>
  );
};

export default Guilds;
