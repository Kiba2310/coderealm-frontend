import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  LinearProgress,
  Button,
  Avatar,
  Tabs,
  Tab,
  Chip,
  Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import DiamondIcon from '@mui/icons-material/Diamond';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import TerminalIcon from '@mui/icons-material/Terminal';
import ShieldIcon from '@mui/icons-material/Shield';
import HelpIcon from '@mui/icons-material/Help';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { getPublicProfile, getAchievementStats, getAvatarUrl, type PublicProfile as PublicProfileType, type AchievementStat } from '../api';

const AVAILABLE_ACHIEVEMENTS = [
  { id: 'newbie', title: 'Újonc', description: 'Megtetted az első lépést és megnyitottad a profilodat!', icon: '/newbie_achievement.jpg' },
  { id: 'first_lesson', title: 'A Kezdetek', description: 'Befejezted életed első leckéjét!', icon: '/newbie_achievement.jpg' },
  { id: 'code_warrior', title: 'Kódharcos', description: 'Sikeresen megoldottad az első 10 programozási feladatot.', icon: '/newbie_achievement.jpg' },
  { id: 'master', title: 'Mester', description: 'Minden leckét sikeresen teljesítettél.', icon: '/newbie_achievement.jpg' },
];

const calculateLevel = (xp: number) => {
  let level = 1;
  let requiredXP = 50;
  let currentXP = xp;

  while (currentXP >= requiredXP) {
    currentXP -= requiredXP;
    level++;
    requiredXP = Math.floor(requiredXP * 1.1);
  }

  return { level, currentXP, requiredXP };
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`public-profile-tabpanel-${index}`}
      aria-labelledby={`public-profile-tab-${index}`}
      {...other}
      style={{ width: '100%' }}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const getEffectDetails = (effect: string) => {
  switch (effect) {
    case 'fire_avatar':
      return {
        label: 'Tűz Avatár Keret',
        desc: 'Lángoló, animált vörös-narancs tűzaura és keret a profilképed körül, amely a ranglistán és a profilodon is ragyog.',
        icon: <LocalFireDepartmentIcon sx={{ color: '#f97316' }} />,
        color: '#f97316',
        bg: 'rgba(249, 115, 22, 0.15)',
        border: 'rgba(249, 115, 22, 0.4)',
      };
    case 'dragon_crest':
      return {
        label: 'Sárkány Címer',
        desc: 'Legendás arany ragyogás a neveden és a profilképeden, amely tekintélyt parancsol a dicsőségfalon.',
        icon: <AutoAwesomeIcon sx={{ color: '#fbbf24' }} />,
        color: '#fbbf24',
        bg: 'rgba(251, 191, 36, 0.15)',
        border: 'rgba(251, 191, 36, 0.4)',
      };
    case 'neon_theme':
      return {
        label: 'Neon Kiber Téma',
        desc: 'Futurisztikus kiber-neon ciánkék fénykeret és modern stílus a profilodhoz.',
        icon: <TerminalIcon sx={{ color: '#06b6d4' }} />,
        color: '#06b6d4',
        bg: 'rgba(6, 182, 212, 0.15)',
        border: 'rgba(6, 182, 212, 0.4)',
      };
    case 'freeze_rune':
      return {
        label: 'Fagyasztó Rúna',
        desc: 'Jégkristályos fagyos aura a profilodhoz, amely megóvja a napi sorozatodat.',
        icon: <AcUnitIcon sx={{ color: '#38bdf8' }} />,
        color: '#38bdf8',
        bg: 'rgba(56, 189, 248, 0.15)',
        border: 'rgba(56, 189, 248, 0.4)',
      };
    case 'xp_amulet':
      return {
        label: 'XP Amulett',
        desc: '+10% bónusz pont és XP minden sikeresen megoldott feladatért és leckéért egy héten át.',
        icon: <ShieldIcon sx={{ color: '#10b981' }} />,
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.15)',
        border: 'rgba(16, 185, 129, 0.4)',
      };
    case 'helper':
      return {
        label: 'Helper Segítő Tárgy',
        desc: 'Egy ingyenes segítségkérés programozási feladatokhoz pontlevonás nélkül.',
        icon: <HelpIcon sx={{ color: '#a855f7' }} />,
        color: '#a855f7',
        bg: 'rgba(168, 85, 247, 0.15)',
        border: 'rgba(168, 85, 247, 0.4)',
      };
    default:
      return {
        label: effect,
        desc: effect,
        icon: <AutoAwesomeIcon sx={{ color: '#60a5fa' }} />,
        color: '#60a5fa',
        bg: 'rgba(96, 165, 250, 0.15)',
        border: 'rgba(96, 165, 250, 0.4)',
      };
  }
};

const PublicProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfileType | null>(null);
  const [stats, setStats] = useState<AchievementStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([
      getPublicProfile(userId),
      getAchievementStats().catch(() => [] as AchievementStat[])
    ])
      .then(([prof, achStats]) => {
        setProfile(prof);
        setStats(achStats);
      })
      .catch((err) => {
        console.error('Failed to load profile:', err);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <CircularProgress size={50} />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom sx={{ fontWeight: 'bold' }}>
          A keresett felhasználó nem található!
        </Typography>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/leaderboard')} sx={{ mt: 2, borderRadius: 2 }}>
          Vissza a ranglistára
        </Button>
      </Box>
    );
  }

  const { level, currentXP, requiredXP } = calculateLevel(profile.xp || 0);
  const displayName = profile.nickname || 'Névtelen Hacker';
  const hasFireAvatar = profile.active_effects?.includes('fire_avatar');
  const hasDragonCrest = profile.active_effects?.includes('dragon_crest');
  const hasNeonTheme = profile.active_effects?.includes('neon_theme');
  const hasFreezeRune = profile.active_effects?.includes('freeze_rune');

  return (
    <Box sx={{ p: 4, pt: 8, maxWidth: 1050, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Button
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/leaderboard')}
          sx={{ color: '#9ca3af', textTransform: 'none', '&:hover': { color: '#fff' } }}
        >
          Vissza a ranglistára
        </Button>
        <Typography className='text-xl text-gray-400 font-bold tracking-widest uppercase'>
          NYILVÁNOS PROFIL
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Bal oldali oszlop: Avatar és Alap adatok */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ bgcolor: '#0b1215', p: 3, textAlign: 'center', height: '100%', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={getAvatarUrl(profile.avatar_url)}
                  sx={{
                    width: 120,
                    height: 120,
                    mb: 2,
                    border: hasFireAvatar
                      ? '4px solid #f97316'
                      : hasDragonCrest
                      ? '4px solid #fbbf24'
                      : hasNeonTheme
                      ? '4px solid #06b6d4'
                      : hasFreezeRune
                      ? '4px solid #38bdf8'
                      : '4px solid #1e293b',
                    boxShadow: hasFireAvatar
                      ? '0 0 25px rgba(249, 115, 22, 0.8), 0 0 45px rgba(239, 68, 68, 0.4)'
                      : hasDragonCrest
                      ? '0 0 25px rgba(251, 191, 36, 0.8), 0 0 45px rgba(245, 158, 11, 0.4)'
                      : hasNeonTheme
                      ? '0 0 25px rgba(6, 182, 212, 0.8)'
                      : hasFreezeRune
                      ? '0 0 25px rgba(56, 189, 248, 0.8)'
                      : 'none',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {!profile.avatar_url && displayName[0]?.toUpperCase()}
                </Avatar>
              </Box>

              <Typography
                variant="h5"
                sx={{
                  fontWeight: 'bold',
                  mb: 1,
                  color: hasDragonCrest ? '#fbbf24' : '#fff',
                  textShadow: hasDragonCrest
                    ? '0 0 12px rgba(251, 191, 36, 0.8)'
                    : hasNeonTheme
                    ? '0 0 12px rgba(6, 182, 212, 0.8)'
                    : 'none',
                }}
              >
                {displayName}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 3 }}>
                <CalendarTodayIcon sx={{ fontSize: 14 }} />
                Csatlakozott: {new Date(profile.created_at).toLocaleDateString('hu-HU', { year: 'numeric', month: 'short' })}
              </Typography>

              {/* Stat chips */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
                <Chip
                  icon={<FlashOnIcon sx={{ color: '#fbbf24 !important' }} />}
                  label={`${profile.xp} XP`}
                  variant="outlined"
                  sx={{ bgcolor: 'rgba(251, 191, 36, 0.1)', borderColor: 'rgba(251, 191, 36, 0.3)', color: '#fbbf24', fontWeight: 'bold' }}
                />
                <Chip
                  icon={<DiamondIcon sx={{ color: '#00e699 !important' }} />}
                  label={`${profile.points} Pont`}
                  variant="outlined"
                  sx={{ bgcolor: 'rgba(0, 230, 153, 0.1)', borderColor: 'rgba(0, 230, 153, 0.3)', color: '#00e699', fontWeight: 'bold' }}
                />
                <Chip
                  icon={<EmojiEventsIcon sx={{ color: '#60a5fa !important' }} />}
                  label={`${profile.achievements?.length || 0} Kitüntetés`}
                  variant="outlined"
                  sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)', color: '#60a5fa', fontWeight: 'bold' }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Jobb oldali oszlop: Tartalom (Fülek) */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={currentTab}
              onChange={(_, val) => setCurrentTab(val)}
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab label="Áttekintés" />
              <Tab label={`Kitüntetések (${profile.achievements?.length || 0})`} />
            </Tabs>
          </Box>

          <CustomTabPanel value={currentTab} index={0}>
            <Grid container spacing={3}>
              {/* Bemutatkozás */}
              <Grid size={{ xs: 12 }}>
                <Card sx={{ bgcolor: '#0b1215', p: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="text.secondary">
                      Bemutatkozás
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: profile.bio ? '#e2e8f0' : 'text.secondary', fontStyle: profile.bio ? 'normal' : 'italic' }}>
                      {profile.bio || 'A felhasználó még nem adott meg bemutatkozást.'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Szint és XP - TISZTA ELRENDEZÉS, ÁTFEDÉS NÉLKÜL */}
              <Grid size={{ xs: 12 }}>
                <Card sx={{ bgcolor: '#0b1215', p: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h5" color="primary.main" sx={{ fontWeight: 'bold' }}>
                        Szint {level}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#fbbf24', fontWeight: 'bold' }}>
                        Összes XP: {profile.xp || 0}
                      </Typography>
                    </Box>

                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, Math.max(0, (currentXP / requiredXP) * 100))}
                      sx={{
                        mb: 1.5,
                        height: 10,
                        borderRadius: 5,
                        bgcolor: '#1e293b',
                        '& .MuiLinearProgress-bar': {
                          backgroundImage: 'linear-gradient(90deg, #fbbf24, #00e699)',
                        },
                      }}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        {currentXP} / {requiredXP} XP a következő szintig
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#00e699', fontWeight: 'bold' }}>
                        {Math.round((currentXP / requiredXP) * 100)}%
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Aktív effektek */}
              {profile.active_effects && profile.active_effects.length > 0 && (
                <Grid size={{ xs: 12 }}>
                  <Card sx={{ bgcolor: '#0b1215', p: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Felszerelt Tárgyak & Kozmetikák</Typography>
                      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                        {profile.active_effects.map((effect) => {
                          const details = getEffectDetails(effect);
                          return (
                            <Tooltip key={effect} title={details.desc} arrow placement="top">
                              <Chip
                                icon={details.icon}
                                label={details.label}
                                variant="outlined"
                                sx={{
                                  borderColor: details.border,
                                  bgcolor: details.bg,
                                  color: details.color,
                                  fontWeight: 'bold',
                                  py: 2.2,
                                  px: 1,
                                  borderRadius: 2,
                                }}
                              />
                            </Tooltip>
                          );
                        })}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </CustomTabPanel>

          <CustomTabPanel value={currentTab} index={1}>
            <Grid container spacing={2}>
              {AVAILABLE_ACHIEVEMENTS.map((ach) => {
                const earned = profile.achievements?.find((a) => a.id === ach.id);
                const stat = stats.find((s) => s.achievement_id === ach.id);
                const percentage = stat ? stat.percentage : 0;

                return { ach, earned, percentage };
              })
                .sort((a, b) => {
                  if (a.earned && b.earned) {
                    return new Date(b.earned.earned_at).getTime() - new Date(a.earned.earned_at).getTime();
                  }
                  if (a.earned) return -1;
                  if (b.earned) return 1;
                  return 0;
                })
                .map(({ ach, earned, percentage }) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={ach.id}>
                    <Card
                      sx={{
                        bgcolor: '#0f172a',
                        border: earned ? '1px solid rgba(0, 230, 153, 0.3)' : '1px solid #1e293b',
                        display: 'flex',
                        alignItems: 'center',
                        p: 2,
                        borderRadius: 3,
                        filter: earned ? 'none' : 'grayscale(100%) opacity(40%)',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <img
                        src={ach.icon}
                        alt={ach.title}
                        style={{ width: 60, height: 60, borderRadius: 8, marginRight: 14 }}
                      />
                      <Box sx={{ width: '100%' }}>
                        <Typography variant="subtitle1" color={earned ? 'primary.main' : 'text.secondary'} sx={{ fontWeight: 'bold' }}>
                          {ach.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, minHeight: 36, fontSize: '0.85rem' }}>
                          {ach.description}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Játékosok {percentage.toFixed(1)}%-a
                          </Typography>
                          {earned && (
                            <Typography variant="caption" sx={{ color: '#00e699', fontWeight: 'bold' }}>
                              {new Date(earned.earned_at).toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                ))}
            </Grid>
          </CustomTabPanel>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PublicProfile;
