import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  CircularProgress,
  Tooltip,
  Alert,
  Chip,
} from '@mui/material';
import { motion } from 'framer-motion';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DiamondIcon from '@mui/icons-material/Diamond';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import LockIcon from '@mui/icons-material/Lock';
import confetti from 'canvas-confetti';
import { getDailyLoginStatus, claimDailyLogin, type DailyLoginStatus } from '../api';
import { useAuth } from '../contexts/AuthContext';

const HUNGARIAN_MONTHS = [
  'Január', 'Február', 'Március', 'Április', 'Május', 'Június',
  'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'
];

const WEEKDAYS = ['Hét', 'Ked', 'Sze', 'Csü', 'Pén', 'Szo', 'Vas'];

const DailyCalendar: React.FC = () => {
  const { user, updateUserContext } = useAuth();
  const [status, setStatus] = useState<DailyLoginStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const todayDate = now.getDate();

  // Days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // First day of current month (0: Sunday, 1: Monday, ...)
  const firstDayRaw = new Date(currentYear, currentMonth, 1).getDay();
  // Adjust so Monday = 0, Sunday = 6
  const firstDayWeekday = (firstDayRaw + 6) % 7;

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const data = await getDailyLoginStatus();
      setStatus(data);
    } catch (err) {
      console.error('Failed to load daily login status:', err);
      setErrorMessage('Nem sikerült betölteni a naptár adatait.');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (claiming || status?.claimed_today) return;
    setClaiming(true);
    setErrorMessage(null);
    try {
      const result = await claimDailyLogin();
      // Update local state
      setStatus((prev) => {
        if (!prev) return prev;
        const todayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(todayDate).padStart(2, '0')}`;
        return {
          ...prev,
          claimed_today: true,
          next_streak_day: 0,
          next_points: 0,
          total_this_month: prev.total_this_month + result.points_awarded,
          days: [
            ...prev.days,
            {
              date: todayStr,
              streak_day: result.streak_day,
              points_awarded: result.points_awarded,
            },
          ],
        };
      });

      // Update user points in AuthContext
      if (user) {
        updateUserContext({ points: result.total_points });
      }

      setSuccessMessage(`Sikeres beváltás! +${result.points_awarded} pont jóváírva a mai napért! (${result.streak_day}. bejelentkezési nap)`);

      // Confetti celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00e699', '#fbbf24', '#38bdf8'],
      });
    } catch (err: any) {
      console.error('Claim failed:', err);
      const msg = err.response?.data?.error || 'Nem sikerült beváltani a napi jutalmat.';
      setErrorMessage(msg);
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <CircularProgress size={50} />
      </Box>
    );
  }

  // Create a map for quick lookup: dayNumber (1..31) -> DailyLoginDay
  const claimedDaysMap = new Map<number, { streak_day: number; points_awarded: number }>();
  if (status?.days) {
    status.days.forEach((d) => {
      // d.date is "YYYY-MM-DD"
      const parts = d.date.split('-');
      if (parts.length === 3) {
        const dayNum = parseInt(parts[2], 10);
        claimedDaysMap.set(dayNum, { streak_day: d.streak_day, points_awarded: d.points_awarded });
      }
    });
  }

  // Calculate upcoming reward points for unclaimed today
  const nextPotentialStreakDay = (status?.days?.length || 0) + 1;
  const nextPotentialPoints = nextPotentialStreakDay * 5;

  return (
    <Box sx={{ p: { xs: 2, md: 6 }, maxWidth: 1100, mx: 'auto', width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="overline" color="primary" sx={{ fontWeight: '800', letterSpacing: 2, display: 'block', mb: 0.5 }}>
            NAPI JUTALOM
          </Typography>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 900,
              background: 'linear-gradient(45deg, #fff, #9ca3af)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <CalendarMonthIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            {currentYear}. {HUNGARIAN_MONTHS[currentMonth]}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 650 }}>
            Lépj be minden nap és váltsd be a növekvő pontjutalmad! Első belépéskor 5 pont, majd 10, 15, 20 és így tovább.
            Ha kihagysz napokat, a jutalmad nem vész el, onnan folytatódik, ahol abbahagytad. A pontszorzó minden hónap 1-jén indul újra.
          </Typography>
        </Box>

        {/* Claim button */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', sm: 'flex-end' }, gap: 1 }}>
          <Button
            variant="contained"
            size="large"
            disabled={status?.claimed_today || claiming}
            onClick={handleClaim}
            startIcon={status?.claimed_today ? <CheckCircleIcon /> : <DiamondIcon />}
            sx={{
              bgcolor: status?.claimed_today ? 'rgba(0, 230, 153, 0.2)' : 'primary.main',
              color: status?.claimed_today ? '#00e699' : '#000',
              fontWeight: 800,
              fontSize: '1.05rem',
              py: 1.6,
              px: 3,
              borderRadius: 3,
              boxShadow: status?.claimed_today ? 'none' : '0 0 20px rgba(0, 230, 153, 0.4)',
              '&:hover': {
                bgcolor: status?.claimed_today ? 'rgba(0, 230, 153, 0.2)' : '#00cc88',
              },
            }}
          >
            {claiming
              ? 'Beváltás folyamatban...'
              : status?.claimed_today
              ? 'Ma már beváltva ✓'
              : `Mai jutalom beváltása (+${nextPotentialPoints} pont)`}
          </Button>
          {!status?.claimed_today && (
            <Typography variant="caption" sx={{ color: '#fbbf24', fontWeight: 600 }}>
              ★ A mai {nextPotentialStreakDay}. bejelentkezési napodért {nextPotentialPoints} pont jár!
            </Typography>
          )}
        </Box>
      </Box>

      {/* Messages */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2, fontWeight: 'bold' }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontWeight: 'bold' }} onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      {/* Stats row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ bgcolor: '#0b1215', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 3 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
              <Box sx={{ bgcolor: 'rgba(0, 230, 153, 0.15)', p: 1.5, borderRadius: 2, display: 'flex', color: '#00e699' }}>
                <DiamondIcon sx={{ fontSize: 32 }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  Havi Szerzett Pontok
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff' }}>
                  +{status?.total_this_month || 0} pont
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ bgcolor: '#0b1215', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 3 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
              <Box sx={{ bgcolor: 'rgba(234, 179, 8, 0.15)', p: 1.5, borderRadius: 2, display: 'flex', color: '#fbbf24' }}>
                <LocalFireDepartmentIcon sx={{ fontSize: 32 }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  Bejelentkezett Napok
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff' }}>
                  {status?.days?.length || 0} / {daysInMonth} nap
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ bgcolor: '#0b1215', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 3 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
              <Box sx={{ bgcolor: 'rgba(59, 130, 246, 0.15)', p: 1.5, borderRadius: 2, display: 'flex', color: '#60a5fa' }}>
                <CalendarMonthIcon sx={{ fontSize: 32 }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  Következő Jutalom
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff' }}>
                  {status?.claimed_today
                    ? `+${((status?.days?.length || 0) + 1) * 5} pont (holnap)`
                    : `+${nextPotentialPoints} pont (ma)`}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Calendar Grid Container */}
      <Card
        sx={{
          bgcolor: '#0b1215',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: 4,
          p: { xs: 2, md: 4 },
        }}
      >
        {/* Weekday headers */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 1.5,
            mb: 2,
            textAlign: 'center',
          }}
        >
          {WEEKDAYS.map((w, idx) => (
            <Typography
              key={w}
              variant="subtitle2"
              sx={{
                fontWeight: 800,
                color: idx >= 5 ? '#f87171' : 'text.secondary',
                py: 0.5,
              }}
            >
              {w}
            </Typography>
          ))}
        </Box>

        {/* Days Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 1.5,
          }}
        >
          {/* Empty padding boxes for days before 1st of month */}
          {Array.from({ length: firstDayWeekday }).map((_, index) => (
            <Box
              key={`empty-${index}`}
              sx={{
                minHeight: { xs: 75, md: 95 },
                bgcolor: 'transparent',
                borderRadius: 2.5,
                opacity: 0.2,
              }}
            />
          ))}

          {/* Actual days 1..daysInMonth */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const dayNum = index + 1;
            const isToday = dayNum === todayDate;
            const isPast = dayNum < todayDate;
            const claimedData = claimedDaysMap.get(dayNum);
            const isClaimed = !!claimedData;

            let borderColor = 'rgba(255, 255, 255, 0.06)';
            let bgcolor = '#0f172a';
            let boxShadow = 'none';

            if (isClaimed) {
              borderColor = 'rgba(0, 230, 153, 0.6)';
              bgcolor = 'rgba(0, 230, 153, 0.08)';
              boxShadow = '0 0 15px rgba(0, 230, 153, 0.15)';
            } else if (isToday) {
              borderColor = '#fbbf24';
              bgcolor = 'rgba(251, 191, 36, 0.1)';
              boxShadow = '0 0 15px rgba(251, 191, 36, 0.25)';
            } else if (isPast) {
              borderColor = 'rgba(255, 255, 255, 0.03)';
              bgcolor = '#090d10';
            }

            return (
              <motion.div
                key={`day-${dayNum}`}
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.15 }}
                style={{ height: '100%' }}
              >
                <Box
                  onClick={() => {
                    if (isToday && !status?.claimed_today) {
                      handleClaim();
                    }
                  }}
                  sx={{
                    minHeight: { xs: 75, md: 95 },
                    height: '100%',
                    bgcolor,
                    border: `1.5px solid ${borderColor}`,
                    borderRadius: 2.5,
                    p: 1.5,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: isToday && !status?.claimed_today ? 'pointer' : 'default',
                    boxShadow,
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Top: Day number & Badge */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 800,
                        fontSize: { xs: '0.85rem', md: '1rem' },
                        color: isClaimed ? '#00e699' : isToday ? '#fbbf24' : isPast ? '#475569' : '#94a3b8',
                      }}
                    >
                      {dayNum}
                    </Typography>

                    {isToday && (
                      <Chip
                        label="MA"
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          bgcolor: '#fbbf24',
                          color: '#000',
                        }}
                      />
                    )}
                  </Box>

                  {/* Middle / Bottom Content */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', my: 'auto' }}>
                    {isClaimed ? (
                      <Tooltip title={`${claimedData.streak_day}. bejelentkezési nap: +${claimedData.points_awarded} pont`} arrow>
                        <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <CheckCircleIcon sx={{ color: '#00e699', fontSize: { xs: 20, md: 24 }, mb: 0.3 }} />
                          <Typography
                            variant="caption"
                            sx={{ color: '#00e699', fontWeight: 800, fontSize: { xs: '0.7rem', md: '0.8rem' } }}
                          >
                            +{claimedData.points_awarded} pont
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem', display: { xs: 'none', md: 'block' } }}>
                            {claimedData.streak_day}. nap
                          </Typography>
                        </Box>
                      </Tooltip>
                    ) : isToday ? (
                      <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography
                          variant="caption"
                          sx={{ color: '#fbbf24', fontWeight: 800, fontSize: { xs: '0.75rem', md: '0.85rem' } }}
                        >
                          +{nextPotentialPoints} pont
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '0.65rem' }}>
                          Kattints a beváltáshoz!
                        </Typography>
                      </Box>
                    ) : isPast ? (
                      <Typography variant="caption" sx={{ color: '#334155', fontStyle: 'italic', fontSize: '0.7rem' }}>
                        Kihagyva
                      </Typography>
                    ) : (
                      <Box sx={{ textAlign: 'center', opacity: 0.35 }}>
                        <LockIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                      </Box>
                    )}
                  </Box>
                </Box>
              </motion.div>
            );
          })}
        </Box>
      </Card>
    </Box>
  );
};

export default DailyCalendar;
