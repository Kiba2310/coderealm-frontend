import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, Grid, Button, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { mockBackend, type DungeonState } from '../../services/mockBackend';

const RaidBoss: React.FC = () => {
  const [dungeon, setDungeon] = useState<DungeonState | null>(null);

  useEffect(() => {
    mockBackend.getDungeonState().then(setDungeon);

    const interval = setInterval(() => {
      mockBackend.getDungeonState().then(setDungeon);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!dungeon) return null;

  const healthPercentage = (dungeon.bossHealth / dungeon.maxHealth) * 100;

  return (
    <Box sx={{ p: 4, pt: 8, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      <Typography variant="h2" gutterBottom sx={{ fontWeight: "bold", color: '#fff' }}>
        Heti raid: <span style={{ color: '#ff4b4b' }}>Segfault Gólem</span>
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 6, maxWidth: 600 }}>
        A céhed tagjai kódfeladatok teljesítésével sebzik a bosst. Minden sikeres teszt sebzés, a hibás beküldés nem büntet - de az idő fogy.
      </Typography>

      <Box sx={{ mb: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="caption" color="error">Boss HP</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'var(--font-mono)' }}>
            {dungeon.bossHealth.toLocaleString()} / {dungeon.maxHealth.toLocaleString()}
          </Typography>
        </Box>
        <Box sx={{ position: 'relative', height: 8, bgcolor: '#1e293b', borderRadius: 4, overflow: 'hidden' }}>
          <motion.div 
            initial={{ width: '100%' }}
            animate={{ width: `${healthPercentage}%` }}
            style={{ height: '100%', background: 'linear-gradient(90deg, #ff4b4b, #fbbf24)' }}
            transition={{ duration: 0.5 }}
          />
        </Box>
      </Box>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ p: 3, bgcolor: '#0b1215' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
              <Typography variant="h6">Céh sebzés - Segfault</Typography>
              <Typography variant="caption" color="text.secondary">{dungeon.teams.length} tag</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {dungeon.teams.sort((a, b) => b.damage - a.damage).map((team, index) => {
                const maxDmg = dungeon.teams[0]?.damage || 1;
                const pct = (team.damage / maxDmg) * 100;
                const isMe = team.name === 'Your Team';
                return (
                  <Box key={team.name}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary">#{index + 1}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: isMe ? 'bold' : 'normal' }}>{team.name}</Typography>
                        <Chip label="Go" size="small" sx={{ height: 20, fontSize: '10px' }} />
                      </Box>
                      <Typography variant="body2" color="error" sx={{ fontWeight: "bold" }}>
                        {team.damage.toLocaleString()} dng
                      </Typography>
                    </Box>
                    <Box sx={{ height: 4, bgcolor: '#1e293b', borderRadius: 2 }}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        style={{ height: '100%', background: 'linear-gradient(90deg, #fbbf24, #ff4b4b)', borderRadius: 2 }}
                      />
                    </Box>
                  </Box>
                )
              })}
            </Box>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ p: 3, mb: 3, bgcolor: '#0b1215' }}>
            <Typography variant="h6" gutterBottom color="primary">Aktív feladat</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Írj konkurens worker poolt, ami 1M sort dolgoz fel 200ms alatt.
            </Typography>
            <Box sx={{ p: 2, bgcolor: '#11191f', borderRadius: 2, mb: 3, fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
              <span style={{ color: '#9ca3af' }}>// raid_task.go</span><br/>
              <span style={{ color: '#00e699' }}>func</span> <span style={{ color: '#60a5fa' }}>Process</span>(jobs {'<-chan Row'}) <span style={{ color: '#00e699' }}>int</span> {'{'}<br/>
              &nbsp;&nbsp;<span style={{ color: '#9ca3af' }}>// a te kódod</span><br/>
              {'}'}
            </Box>
            <Button variant="contained" color="secondary" fullWidth sx={{ py: 1.5 }}>
              Beküldés és sebzés
            </Button>
          </Card>

          <Card sx={{ p: 3, bgcolor: '#0b1215' }}>
            <Typography variant="h6" gutterBottom color="primary.main">Lehetséges drop</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Obszidián keret</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Typography variant="caption" sx={{ color: '#fbbf24' }}>Legendás</Typography>
                  <Typography variant="caption" color="text.secondary">3%</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Glitch effekt</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Typography variant="caption" sx={{ color: '#c084fc' }}>Epikus</Typography>
                  <Typography variant="caption" color="text.secondary">11%</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">1500 pont</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Typography variant="caption" sx={{ color: '#60a5fa' }}>Ritka</Typography>
                  <Typography variant="caption" color="text.secondary">40%</Typography>
                </Box>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RaidBoss;
