import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Grid, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import { getPublicStats, getCourses, getLanguages, type PublicStats } from '../api';

const formatTimeSpent = (totalSeconds: number) => {
  if (!totalSeconds || totalSeconds <= 0) return '0 perc';
  if (totalSeconds < 60) return `${totalSeconds} mp`;
  if (totalSeconds < 3600) return `${Math.floor(totalSeconds / 60)} perc`;
  const hours = (totalSeconds / 3600).toFixed(1);
  return `${hours.endsWith('.0') ? hours.slice(0, -2) : hours} óra`;
};

const Home: React.FC = () => {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [courseStats, setCourseStats] = useState<{ languagesCount: number; coursesCount: number; tasksCount: number }>({
    languagesCount: 5,
    coursesCount: 0,
    tasksCount: 0,
  });

  useEffect(() => {
    getPublicStats()
      .then(setStats)
      .catch(console.error);

    Promise.all([getCourses(), getLanguages()])
      .then(([courses, langs]) => {
        let totalTasks = 0;
        courses.forEach((c) => {
          totalTasks += c.tasks_count || 0;
        });
        setCourseStats({
          languagesCount: langs.length > 0 ? langs.length : 5,
          coursesCount: courses.length,
          tasksCount: totalTasks,
        });
      })
      .catch(console.error);
  }, []);

  const statItems = [
    {
      value: stats ? formatTimeSpent(stats.total_time_spent_seconds) : 'Betöltés...',
      label: 'ELTÖLTÖTT TANULÁSI IDŐ',
    },
    {
      value: stats ? stats.total_lessons_completed.toLocaleString('hu-HU') : 'Betöltés...',
      label: 'FUTTATOTT MEGOLDÁS',
    },
    {
      value: stats ? stats.total_users.toLocaleString('hu-HU') : 'Betöltés...',
      label: 'REGISZTRÁLT DIÁK',
    },
    {
      value: stats ? `${stats.total_xp_earned.toLocaleString('hu-HU')} XP` : 'Betöltés...',
      label: 'MEGSZERZETT XP',
    },
  ];

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', pt: 12, pb: 8, px: { xs: 2, md: 4 }, width: '100%' }}>
      <Grid container spacing={8} sx={{ alignItems: 'center' }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}>
            <Box sx={{ mb: 4 }}>
              <Chip
                label={`> ${courseStats.languagesCount} nyelv • ${courseStats.coursesCount} kurzus • ${courseStats.tasksCount} feladat`}
                variant="outlined"
                sx={{
                  color: 'primary.main',
                  borderColor: 'rgba(0, 230, 153, 0.2)',
                  bgcolor: 'rgba(0, 230, 153, 0.05)',
                  fontFamily: 'var(--font-mono)',
                  borderRadius: 2,
                  mb: 3,
                  fontWeight: 600,
                }}
              />
              <Typography variant="h1" sx={{ color: '#fff', mb: 3, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, fontSize: { xs: '3rem', md: '4rem' } }}>
                Kódolással tanulsz,<br />
                <span style={{ color: '#00e699' }}>nem videónézéssel.</span>
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.25rem', lineHeight: 1.6, maxWidth: 480, mb: 5, letterSpacing: '0.01em' }}>
                Nyelvekre és fejezetekre bontott modulok, valódi futtatott
                kódfeladatok, feleletválasztós kvízek és kódkiegészítés.
                Minden megoldásért pont jár - a pontokból szint és felszerelés lesz.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  component={Link}
                  to="/learn"
                  startIcon={<PlayArrowIcon />}
                  sx={{ color: '#000', px: 4, py: 1.5, borderRadius: 2, transition: 'transform 160ms cubic-bezier(0.23, 1, 0.32, 1)', '&:active': { transform: 'scale(0.97)' } }}
                >
                  Kezdd el ingyen
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  component={Link}
                  to="/dungeon"
                  startIcon={<FlashOnIcon />}
                  sx={{ color: '#fff', borderColor: '#334155', px: 4, py: 1.5, borderRadius: 2, transition: 'all 160ms cubic-bezier(0.23, 1, 0.32, 1)', '&:active': { transform: 'scale(0.97)' }, '&:hover': { borderColor: '#475569', bgcolor: 'rgba(255,255,255,0.05)' } }}
                >
                  Heti raid boss
                </Button>
              </Box>
            </Box>

            <Box
              component={motion.div}
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
                hidden: {},
              }}
              sx={{ display: 'flex', gap: { xs: 3, md: 4 }, mt: 8, flexWrap: 'wrap' }}
            >
              {statItems.map((stat, i) => (
                <Box
                  key={i}
                  component={motion.div}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] } },
                  }}
                  sx={{ minWidth: { xs: 'calc(50% - 16px)', sm: 'auto' } }}
                >
                  <Typography variant="h3" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: '-0.02em', fontSize: { xs: '1.8rem', md: '2.2rem' } }}>
                    {stat.value}
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em' }}>
                    {stat.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </motion.div>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}>
            {/* Fake Code Editor Card */}
            <Box sx={{
              background: 'rgba(11, 18, 21, 0.6)',
              backdropFilter: 'blur(24px) saturate(180%)',
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderTop: '1px solid rgba(255, 255, 255, 0.15)',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0,230,153,0.05)',
              position: 'relative',
            }}>
              {/* Glow */}
              <Box sx={{ position: 'absolute', bottom: -50, right: -50, width: 200, height: 200, bgcolor: 'primary.main', filter: 'blur(100px)', opacity: 0.15, zIndex: 0, pointerEvents: 'none' }} />
              <Box sx={{ position: 'absolute', top: -50, left: -50, width: 150, height: 150, bgcolor: 'primary.main', filter: 'blur(100px)', opacity: 0.1, zIndex: 0, pointerEvents: 'none' }} />

              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)', zIndex: 1, position: 'relative' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ef4444' }} />
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#f59e0b' }} />
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#10b981' }} />
                </Box>
                <Typography variant="caption" sx={{ fontFamily: 'var(--font-mono)', color: '#9ca3af' }}>main.go</Typography>
                <Chip label="piston runner" size="small" sx={{ height: 20, fontSize: '10px', color: 'primary.main', borderColor: 'primary.main', bgcolor: 'transparent' }} variant="outlined" />
              </Box>

              <Box sx={{ p: 3, fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: '#f3f4f6', zIndex: 1, position: 'relative', overflowX: 'auto' }}>
                <pre style={{ margin: 0, color: '#9ca3af' }}>
                  <span style={{ color: '#4b5563', marginRight: 16 }}>1</span><span style={{ color: '#00e699' }}>package</span> main<br />
                  <span style={{ color: '#4b5563', marginRight: 16 }}>2</span><br />
                  <span style={{ color: '#4b5563', marginRight: 16 }}>3</span><span style={{ color: '#00e699' }}>import</span> <span style={{ color: '#fbbf24' }}>"fmt"</span><br />
                  <span style={{ color: '#4b5563', marginRight: 16 }}>4</span><br />
                  <span style={{ color: '#4b5563', marginRight: 16 }}>5</span><span style={{ color: '#00e699' }}>func</span> <span style={{ color: '#60a5fa' }}>Damage</span>(xp <span style={{ color: '#00e699' }}>int</span>) <span style={{ color: '#00e699' }}>int</span> {'{'}<br />
                  <span style={{ color: '#4b5563', marginRight: 16 }}>6</span>  <span style={{ color: '#00e699' }}>return</span> xp * <span style={{ color: '#fbbf24' }}>2</span> <span style={{ color: '#4b5563' }}>// kritikus találat</span><br />
                  <span style={{ color: '#4b5563', marginRight: 16 }}>7</span>{'}'}<br />
                </pre>
              </Box>

              <Box sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)', zIndex: 1, position: 'relative' }}>
                <Typography variant="caption" sx={{ fontFamily: 'var(--font-mono)', display: 'block', color: 'primary.main', mb: 1 }}>
                  ✓ TestDamage = 4/4 eset sikeres (18ms)
                </Typography>
                <Typography variant="caption" sx={{ fontFamily: 'var(--font-mono)', display: 'block', color: '#fbbf24' }}>
                  +40 pont • Szint 12 → 13 folyamatban
                </Typography>
              </Box>
            </Box>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Home;
