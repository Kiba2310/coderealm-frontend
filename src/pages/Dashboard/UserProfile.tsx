import React, { useState, useRef, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Chip,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import TerminalIcon from '@mui/icons-material/Terminal';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import ShieldIcon from '@mui/icons-material/Shield';
import HelpIcon from '@mui/icons-material/Help';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  updateProfile,
  uploadAvatarFile,
  grantAchievement,
  getAchievementStats,
  getAvatarUrl,
  getUserInventory,
  toggleEquipItem,
  deleteInventoryItem,
  type AchievementStat,
  type UserInventoryItem,
} from '../../api';
import confetti from 'canvas-confetti';

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
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
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

const getItemDetails = (itemId: string, defaultName: string, defaultDesc: string) => {
  switch (itemId) {
    case 'fire_avatar':
      return {
        label: 'Tűz Avatár Keret',
        desc: 'Lángoló, animált vörös-narancs tűzaura és keret a profilképed körül, amely a ranglistán és a profilodon is ragyog.',
        icon: <LocalFireDepartmentIcon sx={{ color: '#f97316' }} />,
        color: '#f97316',
        bg: 'rgba(249, 115, 22, 0.15)',
        border: '#f97316',
      };
    case 'dragon_crest':
      return {
        label: 'Sárkány Címer',
        desc: 'Legendás arany ragyogás a neveden és a profilképeden, amely tekintélyt parancsol a dicsőségfalon.',
        icon: <AutoAwesomeIcon sx={{ color: '#fbbf24' }} />,
        color: '#fbbf24',
        bg: 'rgba(251, 191, 36, 0.15)',
        border: '#fbbf24',
      };
    case 'neon_theme':
      return {
        label: 'Neon Kiber Téma',
        desc: 'Futurisztikus kiber-neon ciánkék fénykeret és modern stílus a profilodhoz.',
        icon: <TerminalIcon sx={{ color: '#06b6d4' }} />,
        color: '#06b6d4',
        bg: 'rgba(6, 182, 212, 0.15)',
        border: '#06b6d4',
      };
    case 'freeze_rune':
      return {
        label: 'Fagyasztó Rúna',
        desc: 'Jégkristályos fagyos aura a profilodhoz, amely megóvja a napi sorozatodat.',
        icon: <AcUnitIcon sx={{ color: '#38bdf8' }} />,
        color: '#38bdf8',
        bg: 'rgba(56, 189, 248, 0.15)',
        border: '#38bdf8',
      };
    case 'xp_amulet':
      return {
        label: 'XP Amulett',
        desc: '+10% bónusz pont és XP minden sikeresen megoldott feladatért és leckéért egy héten át.',
        icon: <ShieldIcon sx={{ color: '#10b981' }} />,
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.15)',
        border: '#10b981',
      };
    case 'helper':
      return {
        label: 'Helper Segítő Tárgy',
        desc: 'Egy ingyenes segítségkérés programozási feladatokhoz pontlevonás nélkül.',
        icon: <HelpIcon sx={{ color: '#a855f7' }} />,
        color: '#a855f7',
        bg: 'rgba(168, 85, 247, 0.15)',
        border: '#a855f7',
      };
    default:
      return {
        label: defaultName || itemId,
        desc: defaultDesc || itemId,
        icon: <AutoAwesomeIcon sx={{ color: '#60a5fa' }} />,
        color: '#60a5fa',
        bg: 'rgba(96, 165, 250, 0.15)',
        border: '#60a5fa',
      };
  }
};

const UserProfile: React.FC = () => {
  const { user, updateUserContext } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({ nickname: '', bio: '', avatar_url: '' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [inventory, setInventory] = useState<UserInventoryItem[]>([]);
  const [togglingItem, setTogglingItem] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stats, setStats] = useState<AchievementStat[]>([]);

  useEffect(() => {
    getAchievementStats().then(setStats).catch(console.error);
    getUserInventory().then(setInventory).catch(console.error);
  }, []);

  // Check for newbie achievement on mount
  useEffect(() => {
    if (user && user.achievements) {
      if (!user.achievements.some(a => a.id === 'newbie')) {
        // Grant achievement
        grantAchievement('newbie')
          .then((updatedUser) => {
            setShowAchievementModal(true);
            updateUserContext({ achievements: updatedUser.achievements || [{ id: 'newbie', earned_at: new Date().toISOString() }] });

            const duration = 3000;
            const end = Date.now() + duration;

            const frame = () => {
              confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#00e699', '#fbbf24', '#3b82f6']
              });
              confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#00e699', '#fbbf24', '#3b82f6']
              });

              if (Date.now() < end) {
                requestAnimationFrame(frame);
              }
            };
            frame();
          })
          .catch(console.error);
      }
    }
  }, [user, updateUserContext]);

  if (!user) return <CircularProgress />;

  const { level, currentXP, requiredXP } = calculateLevel(user.xp || 0);
  const displayName = user.nickname || user.email.split('@')[0];

  const handleEditOpen = () => {
    setEditData({
      nickname: user.nickname || '',
      bio: user.bio || '',
      avatar_url: user.avatar_url || ''
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setEditOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setEditData(prev => ({ ...prev, avatar_url: '' }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalAvatarUrl = editData.avatar_url;

      if (avatarFile) {
        const result = await uploadAvatarFile(avatarFile);
        finalAvatarUrl = result.avatar_url;
      }

      const dataToSave: any = {};
      if (editData.nickname !== undefined) dataToSave.nickname = editData.nickname;
      if (editData.bio !== undefined) dataToSave.bio = editData.bio;
      if (finalAvatarUrl !== undefined) dataToSave.avatar_url = finalAvatarUrl;

      await updateProfile(dataToSave);

      const contextUpdate: any = {};
      if (dataToSave.nickname !== undefined) contextUpdate.nickname = dataToSave.nickname;
      if (dataToSave.bio !== undefined) contextUpdate.bio = dataToSave.bio;
      if (dataToSave.avatar_url !== undefined) contextUpdate.avatar_url = dataToSave.avatar_url;

      updateUserContext(contextUpdate);
      setEditOpen(false);
    } catch (err) {
      console.error('Failed to update profile', err);
      alert('Hiba történt a profil mentésekor.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEquip = async (itemId: string) => {
    setTogglingItem(itemId);
    try {
      const res = await toggleEquipItem(itemId);
      setInventory(res.items);
      updateUserContext({ active_effects: res.active_effects });
    } catch (err) {
      console.error('Failed to toggle item:', err);
    } finally {
      setTogglingItem(null);
    }
  };

  const handleDeleteInventoryItem = async (inventoryId: string) => {
    try {
      const res = await deleteInventoryItem(inventoryId);
      setInventory(res.items);
      updateUserContext({ active_effects: res.active_effects });
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Box sx={{ p: 4, pt: 8, maxWidth: 1050, mx: 'auto' }}>
      <Typography className='text-xl text-gray-400 font-bold tracking-widest uppercase mb-4'>
        PROFIL
      </Typography>

      <Grid container spacing={4}>
        {/* Bal oldali oszlop: Avatar és Alap adatok */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ bgcolor: '#0b1215', p: 3, textAlign: 'center', height: '100%', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={getAvatarUrl(user.avatar_url)}
                  sx={{ 
                    width: 120, 
                    height: 120, 
                    mb: 2, 
                    border: user.active_effects?.includes('fire_avatar')
                      ? '4px solid #f97316'
                      : user.active_effects?.includes('dragon_crest')
                      ? '4px solid #fbbf24'
                      : user.active_effects?.includes('neon_theme')
                      ? '4px solid #06b6d4'
                      : user.active_effects?.includes('freeze_rune')
                      ? '4px solid #38bdf8'
                      : '4px solid #1e293b',
                    boxShadow: user.active_effects?.includes('fire_avatar')
                      ? '0 0 25px rgba(249, 115, 22, 0.8), 0 0 45px rgba(239, 68, 68, 0.4)'
                      : user.active_effects?.includes('dragon_crest')
                      ? '0 0 25px rgba(251, 191, 36, 0.8), 0 0 45px rgba(245, 158, 11, 0.4)'
                      : user.active_effects?.includes('neon_theme')
                      ? '0 0 25px rgba(6, 182, 212, 0.8)'
                      : user.active_effects?.includes('freeze_rune')
                      ? '0 0 25px rgba(56, 189, 248, 0.8)'
                      : 'none',
                    transition: 'all 0.3s ease',
                  }}
                />
              </Box>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 'bold', 
                  mb: 1,
                  color: user.active_effects?.includes('dragon_crest') ? '#fbbf24' : '#fff',
                  textShadow: user.active_effects?.includes('dragon_crest')
                    ? '0 0 12px rgba(251, 191, 36, 0.8)'
                    : user.active_effects?.includes('neon_theme')
                    ? '0 0 12px rgba(6, 182, 212, 0.8)'
                    : 'none',
                }}
              >
                {displayName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {user.email}
              </Typography>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEditOpen}
                fullWidth
                sx={{ borderRadius: 2, mb: 3 }}
              >
                Profil szerkesztése
              </Button>

              {/* Szint és XP a Profil szerkesztése alatt */}
              <Box sx={{ width: '100%', pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                    Szint {level}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#fbbf24', fontWeight: 'bold' }}>
                    Összes XP: {user.xp || 0}
                  </Typography>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, Math.max(0, (currentXP / requiredXP) * 100))}
                  sx={{
                    mb: 1,
                    height: 8,
                    borderRadius: 4,
                    bgcolor: '#1e293b',
                    '& .MuiLinearProgress-bar': {
                      backgroundImage: 'linear-gradient(90deg, #fbbf24, #00e699)'
                    }
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
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Jobb oldali oszlop: Tartalom (Fülek) */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={currentTab} onChange={handleTabChange} aria-label="profile tabs" textColor="primary" indicatorColor="primary">
              <Tab label="Áttekintés" />
              <Tab label="Kitüntetések" />
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
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: user.bio ? '#e2e8f0' : 'text.secondary' }}>
                      {user.bio || 'Még nem írtál bemutatkozást.'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>


              {/* Aktív effektek & Kozmetikák - EREDETI ELRENDEZÉS VÁLTÁSI LEHETŐSÉGGEL */}
              <Grid size={{ xs: 12 }}>
                <Card sx={{ bgcolor: '#0b1215', p: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6">Aktív effektek & Kozmetikák</Typography>
                      <Button component={Link} to="/store" size="small" startIcon={<StorefrontIcon />} sx={{ color: '#9ca3af', textTransform: 'none', '&:hover': { color: '#00e699' } }}>
                        Bolt
                      </Button>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                      Kattints egy birtokolt kozmetikára a felszereléshez vagy levételhez.
                    </Typography>

                    {inventory.length === 0 && (!user.active_effects || user.active_effects.length === 0) ? (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Még nincsenek tárgyaid vagy aktív effektjeid. Látogass el a Boltba!
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                        {inventory.map((item) => {
                          const details = getItemDetails(item.item_id, item.name, item.description);
                          const isCosmetic = item.effect_type === 'cosmetic';
                          const isEquipped = item.is_equipped && !item.is_used;
                          const isToggling = togglingItem === item.item_id;

                          const tooltipText = (
                            <Box sx={{ p: 0.5 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: details.color }}>
                                {details.label} {item.rarity ? `(${item.rarity})` : ''}
                              </Typography>
                              <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                {details.desc}
                              </Typography>
                              <Typography variant="caption" sx={{ display: 'block', mt: 0.8, color: '#00e699', fontWeight: 'bold' }}>
                                {isCosmetic
                                  ? isEquipped
                                    ? '✓ Felszerelve (Kattints a levételhez)'
                                    : '○ Tárolóban (Kattints a felszereléshez)'
                                  : item.is_used
                                  ? 'Felhasználva'
                                  : 'Passzív / Felhasználható tárgy'}
                              </Typography>
                            </Box>
                          );

                          return (
                            <Tooltip key={item.id} title={tooltipText} arrow placement="top">
                              <Chip
                                icon={details.icon}
                                label={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <span>{details.label}</span>
                                    {isEquipped && <CheckCircleIcon sx={{ fontSize: '14px !important', color: '#00e699' }} />}
                                    {item.is_used && <span style={{ fontSize: '0.7rem', color: '#64748b' }}>(Elhasználva)</span>}
                                  </Box>
                                }
                                variant={isEquipped ? 'filled' : 'outlined'}
                                onClick={isCosmetic && !item.is_used ? () => handleToggleEquip(item.item_id) : undefined}
                                onDelete={item.is_used ? () => handleDeleteInventoryItem(item.id) : undefined}
                                disabled={isToggling}
                                sx={{
                                  borderColor: isEquipped ? details.border : 'rgba(255, 255, 255, 0.2)',
                                  bgcolor: isEquipped ? details.bg : 'rgba(255, 255, 255, 0.03)',
                                  color: isEquipped ? details.color : item.is_used ? '#64748b' : '#94a3b8',
                                  fontWeight: 'bold',
                                  cursor: isCosmetic && !item.is_used ? 'pointer' : 'default',
                                  py: 2.2,
                                  px: 1,
                                  borderRadius: 2,
                                  boxShadow: isEquipped ? `0 0 10px ${details.bg}` : 'none',
                                  transition: 'all 0.2s ease',
                                  '& .MuiChip-deleteIcon': {
                                    color: '#ef4444',
                                    '&:hover': {
                                      color: '#f87171',
                                    },
                                  },
                                  '&:hover': isCosmetic && !item.is_used ? {
                                    transform: 'scale(1.05)',
                                    borderColor: details.border,
                                    bgcolor: details.bg,
                                    color: details.color,
                                  } : {},
                                }}
                              />
                            </Tooltip>
                          );
                        })}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CustomTabPanel>

          <CustomTabPanel value={currentTab} index={1}>
            <Grid container spacing={2}>
              {AVAILABLE_ACHIEVEMENTS.map(ach => {
                const earned = user.achievements?.find(a => a.id === ach.id);
                const stat = stats.find(s => s.achievement_id === ach.id);
                const percentage = stat ? stat.percentage : 0;

                return { ach, earned, percentage };
              }).sort((a, b) => {
                if (a.earned && b.earned) {
                  return new Date(b.earned.earned_at).getTime() - new Date(a.earned.earned_at).getTime();
                }
                if (a.earned) return -1;
                if (b.earned) return 1;
                return 0;
              }).map(({ ach, earned, percentage }) => (
                <Grid size={{ xs: 12, sm: 6 }} key={ach.id}>
                  <Card sx={{
                    bgcolor: '#0f172a',
                    border: '1px solid #1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    p: 2,
                    filter: earned ? 'none' : 'grayscale(100%) opacity(40%)',
                    transition: 'all 0.3s ease'
                  }}>
                    <img src={ach.icon} alt={ach.title} style={{ width: 64, height: 64, borderRadius: 8, marginRight: 16 }} />
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="h6" color={earned ? "primary.main" : "text.secondary"} sx={{ fontWeight: "bold" }}>
                        {ach.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, minHeight: 40 }}>
                        {ach.description}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          A játékosok {percentage.toFixed(1)}%-a szerezte meg
                        </Typography>
                        {earned && (
                          <Typography variant="caption" sx={{ color: '#00e699', fontWeight: 'bold' }}>
                            Megszerezve: {new Date(earned.earned_at).toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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

      {/* Achievement Modal */}
      <Dialog open={showAchievementModal} onClose={() => setShowAchievementModal(false)} maxWidth="xs" fullWidth sx={{ '& .MuiDialog-paper': { bgcolor: '#0f172a', textAlign: 'center', p: 2, borderRadius: 4, backgroundImage: 'linear-gradient(to bottom, #0f172a, #020617)' } }}>
        <DialogTitle sx={{ color: '#00e699', fontWeight: 'bold', fontSize: '1.5rem' }}>Új Kitüntetés!</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <img src="/newbie_achievement.jpg" alt="Újonc" style={{ width: 128, height: 128, borderRadius: 16, border: '4px solid #1e293b', boxShadow: '0 0 20px rgba(0, 230, 153, 0.4)' }} />
          <Typography variant="h5" color="white" sx={{ fontWeight: "bold" }}>Újonc</Typography>
          <Typography variant="body1" color="text.secondary">
            Gratulálunk! Megtetted az első lépést a CodeRealm világában és sikeresen megnyitottad a profilodat!
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button onClick={() => setShowAchievementModal(false)} variant="contained" sx={{ bgcolor: '#00e699', color: '#000', fontWeight: 'bold', '&:hover': { bgcolor: '#00cc88' } }}>
            Szuper!
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth sx={{ '& .MuiDialog-paper': { bgcolor: '#0f172a' } }}>
        <DialogTitle>Profil szerkesztése</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                src={avatarPreview || getAvatarUrl(editData.avatar_url || user.avatar_url)}
                sx={{ width: 80, height: 80 }}
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button variant="outlined" startIcon={<PhotoCamera />} onClick={() => fileInputRef.current?.click()}>
                    Kép feltöltése
                  </Button>
                  <Typography variant="caption" color="text.secondary">(Max 2MB)</Typography>
                </Box>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  hidden
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                {editData.avatar_url.startsWith('/auth/uploads/') ? (
                  <Button
                    variant="text"
                    size="small"
                    sx={{ mt: 0.5, alignSelf: 'flex-start', color: 'text.secondary' }}
                    onClick={() => setEditData(prev => ({ ...prev, avatar_url: '' }))}
                  >
                    Kép törlése külső URL megadásához
                  </Button>
                ) : (
                  <TextField
                    label="Vagy adj meg egy kép URL-t"
                    fullWidth
                    size="small"
                    value={editData.avatar_url}
                    onChange={(e) => {
                      setEditData(prev => ({ ...prev, avatar_url: e.target.value }));
                      if (avatarFile) {
                        setAvatarFile(null);
                        setAvatarPreview(null);
                      }
                    }}
                    placeholder="https://példa.hu/kép.jpg"
                  />
                )}
              </Box>
            </Box>

            <TextField
              label="Becenév"
              fullWidth
              value={editData.nickname}
              onChange={(e) => setEditData(prev => ({ ...prev, nickname: e.target.value }))}
            />

            <TextField
              label="Bemutatkozás"
              fullWidth
              multiline
              rows={4}
              value={editData.bio}
              onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditOpen(false)} color="inherit">Mégse</Button>
          <Button onClick={handleSave} variant="contained" color="primary" disabled={saving}>
            {saving ? 'Mentés...' : 'Mentés'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserProfile;
