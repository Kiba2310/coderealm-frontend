import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Button,
  Chip,
} from "@mui/material";
import { motion } from "framer-motion";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech";
import {
  getLeaderboard,
  getDailyStats,
  getDailyChallengeLeaderboard,
  getAvatarUrl,
  type LeaderboardUser,
  type DailyStats,
  type DailyChallengeLeaderboardEntry,
} from "../api";
import { useAuth } from "../contexts/AuthContext";

const formatSecondsToMMSS = (totalSec: number) => {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const Leaderboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [dailyLeaderboard, setDailyLeaderboard] = useState<DailyChallengeLeaderboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [board, dailyBoard] = await Promise.all([
          getLeaderboard(),
          getDailyChallengeLeaderboard().catch(() => []),
        ]);
        setUsers(board);
        setDailyLeaderboard(dailyBoard);

        if (user) {
          try {
            const stats = await getDailyStats();
            setDailyStats(stats);
          } catch (err) {
            console.error("Napi statisztikák betöltése sikertelen", err);
          }
        }
      } catch (err) {
        console.error("Hiba a ranglista betöltésekor", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
        }}
      >
        <CircularProgress size={60} sx={{ color: '#00e699' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 6 }, minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography
            variant="overline"
            color="primary"
            sx={{ fontWeight: "800", letterSpacing: 2, display: "block", mb: 0.5 }}
          >
            DICSŐSÉGFAL
          </Typography>
          <Typography
            variant="h3"
            sx={{
              fontWeight: "900",
              mb: 1,
              background: "linear-gradient(45deg, #fff, #9ca3af)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Ranglisták
          </Typography>
        </Box>

        {activeTab === 1 && (
          <Button
            variant="contained"
            startIcon={<LocalFireDepartmentIcon />}
            onClick={() => navigate('/daily-challenge')}
            sx={{
              bgcolor: 'rgba(0, 230, 153, 0.15)',
              border: '1px solid #00e699',
              color: '#00e699',
              fontWeight: 800,
              borderRadius: 2,
              px: 2.5,
              py: 1,
              textTransform: 'none',
              '&:hover': { bgcolor: '#00e699', color: '#0b1215' },
            }}
          >
            Mai Napi Kihívás Megoldása
          </Button>
        )}
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, val) => setActiveTab(val)}
        sx={{
          mb: 4,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          '& .MuiTab-root': {
            fontWeight: 800,
            textTransform: 'none',
            fontSize: '1rem',
            color: '#94a3b8',
            '&.Mui-selected': { color: '#00e699' },
          },
          '& .MuiTabs-indicator': { bgcolor: '#00e699', height: 3 },
        }}
      >
        <Tab icon={<EmojiEventsIcon />} iconPosition="start" label="Globális Ranglista" />
        <Tab icon={<LocalFireDepartmentIcon />} iconPosition="start" label="Napi Kihívás Ranglista" />
      </Tabs>

      {/* Global Tab Stats */}
      {activeTab === 0 && user && dailyStats && (
        <Grid container spacing={3} sx={{ mb: 6 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card
                sx={{
                  bgcolor: "rgba(17, 25, 31, 0.6)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 3,
                }}
              >
                <CardContent
                  sx={{ display: "flex", alignItems: "center", gap: 3, p: 4 }}
                >
                  <Box
                    sx={{
                      bgcolor: "rgba(234, 179, 8, 0.2)",
                      p: 2,
                      borderRadius: 2,
                    }}
                  >
                    <FlashOnIcon sx={{ fontSize: 40, color: "#eab308" }} />
                  </Box>
                  <Box>
                    <Typography
                      variant="subtitle1"
                      color="text.secondary"
                      sx={{ fontWeight: 600 }}
                    >
                      Megszerzett XP
                    </Typography>
                    <Typography
                      variant="h3"
                      color="#fff"
                      sx={{ fontWeight: 800 }}
                    >
                      {dailyStats.daily_xp}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card
                sx={{
                  bgcolor: "rgba(17, 25, 31, 0.6)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 3,
                }}
              >
                <CardContent
                  sx={{ display: "flex", alignItems: "center", gap: 3, p: 4 }}
                >
                  <Box
                    sx={{
                      bgcolor: "rgba(59, 130, 246, 0.2)",
                      p: 2,
                      borderRadius: 2,
                    }}
                  >
                    <AutoStoriesIcon sx={{ fontSize: 40, color: "#3b82f6" }} />
                  </Box>
                  <Box>
                    <Typography
                      variant="subtitle1"
                      color="text.secondary"
                      sx={{ fontWeight: 600 }}
                    >
                      Ma teljesített leckék
                    </Typography>
                    <Typography
                      variant="h3"
                      color="#fff"
                      sx={{ fontWeight: 800 }}
                    >
                      {dailyStats.daily_lessons}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      )}

      {/* Daily Challenge Info Banner */}
      {activeTab === 1 && (
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Chip
            icon={<MilitaryTechIcon sx={{ color: '#fbbf24' }} />}
            label="A mai nap Top 3 leggyorsabb kódolója extra pontjutalmat kap: 🥇 +100 Pont, 🥈 +50 Pont, 🥉 +25 Pont"
            sx={{
              fontWeight: 700,
              bgcolor: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              color: '#fbbf24',
              py: 2.2,
              px: 1,
              borderRadius: 2,
            }}
          />
        </Box>
      )}

      {/* Table Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <TableContainer
          component={Paper}
          sx={{
            bgcolor: "rgba(17, 25, 31, 0.6)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          {activeTab === 0 ? (
            /* Global Leaderboard Table */
            <Table>
              <TableHead sx={{ bgcolor: "rgba(0,0,0,0.3)" }}>
                <TableRow>
                  <TableCell sx={{ color: "text.secondary", fontWeight: "bold" }}>
                    Helyezés
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary", fontWeight: "bold" }}>
                    Diák
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ color: "text.secondary", fontWeight: "bold" }}
                  >
                    Összes XP
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      align="center"
                      sx={{ py: 6, color: "text.secondary" }}
                    >
                      Még nincs adat a ranglistán.
                    </TableCell>
                  </TableRow>
                ) : (
                  users?.map((u, i) => (
                    <TableRow
                      key={u.id}
                      sx={{
                        bgcolor:
                          u.id === user?.id
                            ? "rgba(59, 130, 246, 0.1)"
                            : "transparent",
                        "&:hover": { bgcolor: "rgba(255,255,255,0.02)" },
                      }}
                    >
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          {i === 0 && (
                            <EmojiEventsIcon sx={{ color: "#fbbf24" }} />
                          )}
                          {i === 1 && (
                            <EmojiEventsIcon sx={{ color: "#94a3b8" }} />
                          )}
                          {i === 2 && (
                            <EmojiEventsIcon sx={{ color: "#b45309" }} />
                          )}
                          {i > 2 && (
                            <Typography
                              variant="h6"
                              color="text.secondary"
                              sx={{ ml: 1 }}
                            >
                              {u.rank}.
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box
                          onClick={() => {
                            if (u.id === user?.id) {
                              navigate('/dashboard');
                            } else {
                              navigate(`/profile/${u.id}`);
                            }
                          }}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            cursor: "pointer",
                            width: "fit-content",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              opacity: 0.85,
                              transform: "translateX(4px)",
                            },
                          }}
                        >
                          <Avatar
                            src={getAvatarUrl(u.avatar_url)}
                            sx={{ 
                              width: 40, 
                              height: 40,
                              border: u.active_effects?.includes('fire_avatar')
                                ? '2px solid #ef4444'
                                : u.active_effects?.includes('dragon_crest')
                                ? '2px solid #fbbf24'
                                : u.active_effects?.includes('neon_theme')
                                ? '2px solid #06b6d4'
                                : 'none',
                              boxShadow: u.active_effects?.includes('fire_avatar')
                                ? '0 0 10px #ef4444'
                                : u.active_effects?.includes('dragon_crest')
                                ? '0 0 10px #fbbf24'
                                : u.active_effects?.includes('neon_theme')
                                ? '0 0 10px #06b6d4'
                                : 'none',
                            }}
                          />
                          <Typography
                            color={
                              u.id === user?.id ? "primary.main" : "text.primary"
                            }
                            sx={{ 
                              fontWeight: u.id === user?.id ? 800 : 600,
                              textShadow: u.active_effects?.includes('dragon_crest') ? '0 0 8px #fbbf24, 0 0 12px #fbbf24' : 'none',
                              color: u.active_effects?.includes('dragon_crest') ? '#fbbf24' : (u.id === user?.id ? "primary.main" : "text.primary"),
                              "&:hover": {
                                textDecoration: "underline",
                              }
                            }}
                          >
                            {u.nickname || "Névtelen Hacker"}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          color="secondary.main"
                          sx={{ fontWeight: "bold" }}
                        >
                          {u.points}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          ) : (
            /* Daily Challenge Speed Leaderboard Table */
            <Table>
              <TableHead sx={{ bgcolor: "rgba(0,0,0,0.3)" }}>
                <TableRow>
                  <TableCell sx={{ color: "text.secondary", fontWeight: "bold", width: "15%" }}>
                    Helyezés
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary", fontWeight: "bold", width: "40%" }}>
                    Kódoló
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary", fontWeight: "bold", width: "20%" }}>
                    Nyelv
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ color: "text.secondary", fontWeight: "bold", width: "25%" }}
                  >
                    Megoldási Idő
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dailyLeaderboard.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      align="center"
                      sx={{ py: 6, color: "text.secondary" }}
                    >
                      Még senki sem küldte be a mai napi kihívást. Légy te a leggyorsabb ma!
                    </TableCell>
                  </TableRow>
                ) : (
                  dailyLeaderboard.map((entry) => {
                    const isTop1 = entry.rank === 1;
                    const isTop2 = entry.rank === 2;
                    const isTop3 = entry.rank === 3;

                    return (
                      <TableRow
                        key={entry.user_id}
                        sx={{
                          bgcolor: entry.user_id === user?.id ? "rgba(0, 230, 153, 0.08)" : "transparent",
                          "&:hover": { bgcolor: "rgba(255,255,255,0.02)" },
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            {isTop1 && <span style={{ fontSize: "1.3rem" }}>🥇</span>}
                            {isTop2 && <span style={{ fontSize: "1.3rem" }}>🥈</span>}
                            {isTop3 && <span style={{ fontSize: "1.3rem" }}>🥉</span>}
                            <Typography
                              sx={{
                                fontWeight: 800,
                                color: isTop1 ? "#fbbf24" : isTop2 ? "#cbd5e1" : isTop3 ? "#cd7f32" : "text.secondary",
                              }}
                            >
                              #{entry.rank}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Box
                            onClick={() => {
                              if (entry.user_id === user?.id) {
                                navigate('/dashboard');
                              } else {
                                navigate(`/profile/${entry.user_id}`);
                              }
                            }}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                              cursor: "pointer",
                              width: "fit-content",
                              "&:hover": { opacity: 0.85 },
                            }}
                          >
                            <Avatar
                              src={getAvatarUrl(entry.avatar_url)}
                              sx={{
                                width: 36,
                                height: 36,
                                border: entry.active_effects?.includes('fire_avatar')
                                  ? '2px solid #ef4444'
                                  : entry.active_effects?.includes('dragon_crest')
                                  ? '2px solid #fbbf24'
                                  : entry.active_effects?.includes('neon_theme')
                                  ? '2px solid #06b6d4'
                                  : '1px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: entry.active_effects?.includes('fire_avatar')
                                  ? '0 0 10px #ef4444'
                                  : entry.active_effects?.includes('dragon_crest')
                                  ? '0 0 10px #fbbf24'
                                  : entry.active_effects?.includes('neon_theme')
                                  ? '0 0 10px #06b6d4'
                                  : 'none',
                              }}
                            />
                            <Box>
                              <Typography
                                sx={{
                                  fontWeight: 700,
                                  color: entry.active_effects?.includes('dragon_crest') ? '#fbbf24' : '#fff',
                                }}
                              >
                                {entry.nickname}
                              </Typography>
                              {entry.bonus_points > 0 && (
                                <Typography variant="caption" sx={{ color: '#00e699', fontWeight: 700 }}>
                                  +{entry.bonus_points} Bónusz Pont
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={entry.language.toUpperCase()}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              bgcolor: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              color: '#60a5fa',
                            }}
                          />
                        </TableCell>

                        <TableCell align="right">
                          <Typography sx={{ fontWeight: 800, fontFamily: 'monospace', color: '#00e699', fontSize: '1rem' }}>
                            {formatSecondsToMMSS(entry.solve_time_seconds)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </motion.div>
    </Box>
  );
};

export default Leaderboard;
