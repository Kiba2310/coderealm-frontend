import React, { useState, useEffect, useRef, Component, type ErrorInfo, type ReactNode } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Chip,
  Tabs,
  Tab,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Divider,
  Collapse,
  Alert,
} from '@mui/material';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SendIcon from '@mui/icons-material/Send';
import TimerIcon from '@mui/icons-material/Timer';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import TerminalIcon from '@mui/icons-material/Terminal';
import CodeIcon from '@mui/icons-material/Code';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CheckIcon from '@mui/icons-material/Check';
import RefreshIcon from '@mui/icons-material/Refresh';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';

import {
  getTodayChallenge,
  startDailyChallenge,
  runDailyChallengeCode,
  submitDailyChallenge,
  getAvatarUrl,
  type TodayChallengeResponse,
  type TestResultItem,
  type DailyChallengeLeaderboardEntry,
} from '../api';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class DailyChallengeErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('DailyChallenge ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
          <Card sx={{ bgcolor: '#0b1215', border: '1px solid #ef4444', p: 4, borderRadius: 3 }}>
            <Typography variant="h5" color="error" sx={{ fontWeight: 800, mb: 2 }}>
              Hiba történt a Napi Kihívás megjelenítésekor
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {this.state.error?.message || 'Ismeretlen hiba lépett fel.'}
            </Typography>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              sx={{ bgcolor: '#00e699', color: '#000', fontWeight: 800 }}
            >
              Oldal Újratöltése
            </Button>
          </Card>
        </Container>
      );
    }

    return this.props.children;
  }
}

const LANGUAGE_MAP: Record<string, { name: string; monaco: string; ext: string; color: string }> = {
  python: { name: 'Python', monaco: 'python', ext: 'py', color: '#3b82f6' },
  javascript: { name: 'JavaScript', monaco: 'javascript', ext: 'js', color: '#f59e0b' },
  csharp: { name: 'C#', monaco: 'csharp', ext: 'cs', color: '#8b5cf6' },
  php: { name: 'PHP', monaco: 'php', ext: 'php', color: '#6366f1' },
  go: { name: 'Go', monaco: 'go', ext: 'go', color: '#00e699' },
};

const formatSecondsToMMSS = (totalSec: number) => {
  const safeSec = Math.max(0, Math.floor(totalSec || 0));
  const mins = Math.floor(safeSec / 60);
  const secs = safeSec % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatSecondsToHHMMSS = (totalSec: number) => {
  const safeSec = Math.max(0, Math.floor(totalSec || 0));
  const hours = Math.floor(safeSec / 3600);
  const mins = Math.floor((safeSec % 3600) / 60);
  const secs = safeSec % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const DailyChallengeContent: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [data, setData] = useState<TodayChallengeResponse | null>(null);

  // Challenge Start state (Lobby vs Workspace)
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [isStarting, setIsStarting] = useState<boolean>(false);

  // Language & Code
  const [selectedLanguage, setSelectedLanguage] = useState<string>('python');
  const [code, setCode] = useState<string>('');

  // Timers
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [secondsUntilReset, setSecondsUntilReset] = useState<number>(0);
  const timerIntervalRef = useRef<any>(null);
  const resetIntervalRef = useRef<any>(null);

  // Execution states
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<TestResultItem[]>([]);
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [outputTab, setOutputTab] = useState<number>(0);

  // UI state
  const [clarificationOpen, setClarificationOpen] = useState<boolean>(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<DailyChallengeLeaderboardEntry[]>([]);

  // Fetch today challenge
  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await getTodayChallenge();
      setData(res);
      setLeaderboard(res?.leaderboard || []);
      setSecondsUntilReset(res?.seconds_until_reset || 0);

      const lang = res?.user_language || 'python';
      const safeLang = LANGUAGE_MAP[lang] ? lang : 'python';
      setSelectedLanguage(safeLang);

      if (res?.user_submitted_code) {
        setCode(res.user_submitted_code);
      } else if (res?.challenge?.starter_codes?.[safeLang]) {
        setCode(res.challenge.starter_codes[safeLang]);
      } else if (res?.challenge?.starter_codes?.['python']) {
        setCode(res.challenge.starter_codes['python']);
      } else {
        setCode('');
      }

      // Check if user has already started or completed today's challenge
      if (res?.is_completed) {
        setIsStarted(true);
        if (res.solve_time_seconds) setElapsedSeconds(res.solve_time_seconds);
      } else if (res?.started_at) {
        setIsStarted(true);
        const start = new Date(res.started_at).getTime();
        const now = Date.now();
        const diffSec = Math.max(0, Math.floor((now - start) / 1000));
        setElapsedSeconds(diffSec);
      } else {
        setIsStarted(false);
      }
    } catch (err: any) {
      console.error('Error fetching today challenge:', err);
      setLoadError(err.response?.data?.error || err.message || 'Nem sikerült betölteni a mai napi kihívást.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Countdown timer until reset (midnight)
  useEffect(() => {
    if (resetIntervalRef.current) clearInterval(resetIntervalRef.current);
    resetIntervalRef.current = setInterval(() => {
      setSecondsUntilReset((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(resetIntervalRef.current);
  }, []);

  // Solve stopwatch timer
  useEffect(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    if (isStarted && !data?.is_completed && !loading) {
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => clearInterval(timerIntervalRef.current);
  }, [isStarted, data?.is_completed, loading]);

  // Handle Start Challenge Click
  const handleStartChallenge = async () => {
    setIsStarting(true);
    try {
      await startDailyChallenge(selectedLanguage);
      setIsStarted(true);
      setElapsedSeconds(0);
      if (data) {
        setData({
          ...data,
          started_at: new Date().toISOString(),
          user_language: selectedLanguage,
        });
      }
    } catch (err: any) {
      console.error('Error starting challenge:', err);
      // Fallback: still let the user solve locally
      setIsStarted(true);
    } finally {
      setIsStarting(false);
    }
  };

  // Handle Language Change
  const handleLanguageChange = async (newLang: string) => {
    setSelectedLanguage(newLang);
    if (!data?.is_completed && data?.challenge) {
      const newStarter = data.challenge.starter_codes?.[newLang] || '';
      setCode(newStarter);
      if (isStarted) {
        try {
          await startDailyChallenge(newLang);
        } catch (e) {
          console.error('Error updating challenge language:', e);
        }
      }
    }
  };

  // Run tests without submitting
  const handleRunCode = async () => {
    if (!code.trim()) return;
    setIsRunning(true);
    setSubmitError(null);
    try {
      const res = await runDailyChallengeCode(selectedLanguage, code);
      setTestResults(res?.test_results || []);
      setConsoleOutput(res?.console_output || res?.error || 'Nincs kimenet');
      setOutputTab(0);
    } catch (err: any) {
      setConsoleOutput(err.response?.data?.error || err.message || 'Hiba a kódfuttatás során');
      setOutputTab(1);
    } finally {
      setIsRunning(false);
    }
  };

  // Submit final solution
  const handleSubmitCode = async () => {
    if (!code.trim()) return;
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitMessage(null);
    try {
      const res = await submitDailyChallenge(selectedLanguage, code);
      setTestResults(res?.test_results || []);
      setConsoleOutput(res?.console_output || '');
      setOutputTab(0);

      if (res?.success) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
        });

        setSubmitMessage(`🎉 Gratulálunk! Sikeresen megoldottad a mai kihívást ${formatSecondsToMMSS(res.solve_time_seconds)} alatt! (+${res.points_earned} Pont, +${res.xp_earned} XP)`);
        setLeaderboard(res.leaderboard || []);

        if (data) {
          setData({
            ...data,
            is_completed: true,
            solve_time_seconds: res.solve_time_seconds,
            current_streak: res.streak,
            user_submitted_code: code,
          });
        }
      } else {
        setSubmitError('Nem minden teszteset ment át sikeresen. Javítsd a kódodat a hibajelzések alapján!');
      }
    } catch (err: any) {
      setSubmitError(err.response?.data?.error || err.message || 'Hiba a beküldés során');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={50} sx={{ color: '#00e699', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Napi Kihívás betöltése...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (loadError || !data?.challenge) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Card sx={{ bgcolor: '#0b1215', border: '1px solid rgba(239, 68, 68, 0.4)', p: 4, borderRadius: 3 }}>
          <Typography variant="h5" color="error" sx={{ fontWeight: 800, mb: 2 }}>
            {loadError || 'Nem sikerült betölteni a mai napi kihívást.'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Kérlek ellenőrizd a hálózati kapcsolatot vagy próbáld újra!
          </Typography>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={fetchData}
            sx={{ bgcolor: '#00e699', color: '#000', fontWeight: 800 }}
          >
            Újrapróbálkozás
          </Button>
        </Card>
      </Container>
    );
  }

  const challenge = data.challenge;
  const safeTestCases = Array.isArray(challenge.test_cases) ? challenge.test_cases : [];
  const safeLeaderboard = Array.isArray(leaderboard) ? leaderboard : [];
  const safeTestResults = Array.isArray(testResults) ? testResults : [];
  const cleanExplanation = (challenge.explanation || challenge.description || '')
    .replace(/💡 \*\*Magyarázat & Megoldási Tippek:\*\*\n\n/g, '')
    .replace(/\(O\(n²?\)\)|\(O\(1\)\s*memória\)/g, '');

  // --- LOBBY SCREEN (Ha még nem indította el a Start gombbal) ---
  if (!isStarted && !data.is_completed) {
    return (
      <Container maxWidth="md" sx={{ py: 6, minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Card
          sx={{
            width: '100%',
            bgcolor: '#0b1215',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: 4,
            p: { xs: 3, md: 5 },
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(251, 191, 36, 0.08)',
            textAlign: 'center',
          }}
        >
          <Box sx={{ display: 'inline-flex', bgcolor: 'rgba(251, 191, 36, 0.15)', p: 2, borderRadius: '50%', color: '#fbbf24', mb: 2 }}>
            <LocalFireDepartmentIcon sx={{ fontSize: 48 }} />
          </Box>

          <Typography variant="overline" sx={{ color: '#fbbf24', fontWeight: 800, letterSpacing: 2, display: 'block' }}>
            MAI NAPI KIHÍVÁS
          </Typography>

          <Typography variant="h3" sx={{ fontWeight: 900, color: '#fff', mb: 2 }}>
            {challenge.title}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap', mb: 4 }}>
            <Chip
              label={challenge.difficulty}
              sx={{
                fontWeight: 800,
                fontSize: '0.9rem',
                bgcolor:
                  challenge.difficulty === 'Könnyű'
                    ? 'rgba(0, 230, 153, 0.15)'
                    : challenge.difficulty === 'Nehéz'
                    ? 'rgba(239, 68, 68, 0.15)'
                    : 'rgba(251, 191, 36, 0.15)',
                color:
                  challenge.difficulty === 'Könnyű'
                    ? '#00e699'
                    : challenge.difficulty === 'Nehéz'
                    ? '#ef4444'
                    : '#fbbf24',
                border: '1px solid currentColor',
                px: 1,
              }}
            />
            <Chip
              label={`+${challenge.points_reward} Pont & +${challenge.xp_reward} XP`}
              sx={{ fontWeight: 800, fontSize: '0.9rem', bgcolor: 'rgba(0, 230, 153, 0.1)', color: '#00e699', border: '1px solid rgba(0, 230, 153, 0.3)', px: 1 }}
            />
            <Chip
              label={`Streak: ${data.current_streak || 0} nap`}
              icon={<LocalFireDepartmentIcon sx={{ color: '#fbbf24 !important' }} />}
              sx={{ fontWeight: 800, fontSize: '0.9rem', bgcolor: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.3)', px: 1 }}
            />
          </Box>

          <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 3, p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: '#60a5fa', mb: 2 }}>
              <HourglassEmptyIcon />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Hátralévő idő az aznapi feladatból: <strong style={{ fontFamily: 'monospace' }}>{formatSecondsToHHMMSS(secondsUntilReset)}</strong>
              </Typography>
            </Box>

            <Typography variant="body1" sx={{ color: '#cbd5e1', lineHeight: 1.6, maxWidth: 600, mx: 'auto', mb: 3 }}>
              A feladat részletes leírása és a kódoló felület a <b>Start</b> gomb megnyomásakor válik láthatóvá. A megnyitás pillanatában elindul a megoldási idődet mérő stopper!
            </Typography>

            {/* Nyelvválasztó a Start előtt */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                Válaszd ki a programozási nyelvet:
              </Typography>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <Select
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  sx={{
                    bgcolor: '#06090e',
                    color: '#fff',
                    borderRadius: 2,
                    fontWeight: 700,
                    '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#00e699' },
                  }}
                >
                  {Object.entries(LANGUAGE_MAP).map(([key, langInfo]) => (
                    <MenuItem key={key} value={key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: langInfo.color }} />
                      <Typography sx={{ fontWeight: 600 }}>{langInfo.name}</Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Card>

          <Button
            variant="contained"
            size="large"
            disabled={isStarting}
            onClick={handleStartChallenge}
            startIcon={isStarting ? <CircularProgress size={24} color="inherit" /> : <RocketLaunchIcon sx={{ fontSize: '1.8rem !important' }} />}
            sx={{
              bgcolor: '#00e699',
              color: '#0b1215',
              fontWeight: 900,
              fontSize: '1.2rem',
              py: 2,
              px: 6,
              borderRadius: 3,
              boxShadow: '0 8px 30px rgba(0, 230, 153, 0.4)',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: '#00c784',
                transform: 'scale(1.03)',
                boxShadow: '0 10px 35px rgba(0, 230, 153, 0.6)',
              },
            }}
          >
            {isStarting ? 'Indítás...' : '🚀 KIHÍVÁS INDÍTÁSA'}
          </Button>
        </Card>
      </Container>
    );
  }

  // --- WORKSPACE SCREEN (Amikor elindította vagy már megoldotta) ---
  return (
    <Container maxWidth="xl" sx={{ py: 3, minHeight: '90vh' }}>
      {/* Top Header Card */}
      <Card
        sx={{
          bgcolor: '#0b1215',
          border: '1px solid rgba(0, 230, 153, 0.2)',
          borderRadius: 3,
          mb: 3,
          p: 2.5,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ bgcolor: 'rgba(251, 191, 36, 0.15)', p: 1.2, borderRadius: 2, display: 'flex', color: '#fbbf24' }}>
              <LocalFireDepartmentIcon sx={{ fontSize: 32 }} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff' }}>
                  {challenge.title || 'Napi Kihívás'}
                </Typography>
                <Chip
                  label={challenge.difficulty || 'Normál'}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    bgcolor:
                      challenge.difficulty === 'Könnyű'
                        ? 'rgba(0, 230, 153, 0.15)'
                        : challenge.difficulty === 'Nehéz'
                        ? 'rgba(239, 68, 68, 0.15)'
                        : 'rgba(251, 191, 36, 0.15)',
                    color:
                      challenge.difficulty === 'Könnyű'
                        ? '#00e699'
                        : challenge.difficulty === 'Nehéz'
                        ? '#ef4444'
                        : '#fbbf24',
                    border: '1px solid currentColor',
                  }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Napi Kihívás • +{challenge.points_reward || 0} Pont & +{challenge.xp_reward || 0} XP
              </Typography>
            </Box>
          </Box>

          {/* Timers & Streak Header Row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {/* Countdown until midnight */}
            <Tooltip title="Ennyi időd van még megoldani a mai kihívást" arrow>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  bgcolor: 'rgba(255, 255, 255, 0.04)',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <HourglassEmptyIcon sx={{ color: '#60a5fa', fontSize: 20 }} />
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem', fontWeight: 700 }}>
                    HÁTRALÉVŐ IDŐ
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#60a5fa', fontFamily: 'monospace' }}>
                    {formatSecondsToHHMMSS(secondsUntilReset)}
                  </Typography>
                </Box>
              </Box>
            </Tooltip>

            {/* Solve Stopwatch Timer */}
            <Tooltip title={data.is_completed ? "Megoldási időd" : "Megoldási idő mérő stopper"} arrow>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  bgcolor: data.is_completed ? 'rgba(0, 230, 153, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                  border: data.is_completed ? '1px solid rgba(0, 230, 153, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                }}
              >
                <TimerIcon sx={{ color: data.is_completed ? '#00e699' : '#eab308', fontSize: 20 }} />
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem', fontWeight: 700 }}>
                    {data.is_completed ? 'MEGOLDVA' : 'STOPPER'}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 800,
                      color: data.is_completed ? '#00e699' : '#eab308',
                      fontFamily: 'monospace',
                    }}
                  >
                    {formatSecondsToMMSS(elapsedSeconds)}
                  </Typography>
                </Box>
              </Box>
            </Tooltip>

            {/* Streak Counter */}
            <Tooltip title="Egymást követő napokon megoldott kihívások sorozata" arrow>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  bgcolor: 'rgba(251, 191, 36, 0.1)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                }}
              >
                <LocalFireDepartmentIcon sx={{ color: '#fbbf24', fontSize: 22 }} />
                <Box>
                  <Typography variant="caption" sx={{ color: '#fbbf24', display: 'block', fontSize: '0.7rem', fontWeight: 700 }}>
                    STREAK
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#fbbf24', fontFamily: 'monospace' }}>
                    {data.current_streak || 0} Nap
                  </Typography>
                </Box>
              </Box>
            </Tooltip>

            {data.is_completed && (
              <Chip
                icon={<CheckIcon sx={{ color: '#00e699 !important' }} />}
                label="Mai Feladat Teljesítve"
                sx={{
                  bgcolor: 'rgba(0, 230, 153, 0.15)',
                  border: '1px solid #00e699',
                  color: '#00e699',
                  fontWeight: 800,
                  py: 2,
                  borderRadius: 2,
                }}
              />
            )}
          </Box>
        </Box>
      </Card>

      {/* Notifications */}
      {submitMessage && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2, fontWeight: 600, bgcolor: 'rgba(0, 230, 153, 0.15)', color: '#00e699', border: '1px solid #00e699' }}>
          {submitMessage}
        </Alert>
      )}

      {submitError && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontWeight: 600, bgcolor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid #ef4444' }}>
          {submitError}
        </Alert>
      )}

      {/* Main Workspace Area (Playground style) */}
      <Grid container spacing={3}>
        {/* Left Column: Problem Description & Clarification */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ bgcolor: '#0b1215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff', mb: 2 }}>
                Feladatleírás
              </Typography>

              <Typography variant="body1" sx={{ color: '#e2e8f0', lineHeight: 1.7, mb: 2.5, whiteSpace: 'pre-line', fontSize: '0.95rem' }}>
                {challenge.description}
              </Typography>

              {/* Inline Clarification Toggle & Box with ReactMarkdown */}
              <Box sx={{ mb: 3 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setClarificationOpen(!clarificationOpen)}
                  startIcon={<InfoOutlinedIcon sx={{ color: '#38bdf8' }} />}
                  endIcon={clarificationOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                  sx={{
                    borderColor: 'rgba(56, 189, 248, 0.3)',
                    color: '#38bdf8',
                    fontWeight: 700,
                    textTransform: 'none',
                    borderRadius: 2,
                    fontSize: '0.85rem',
                    py: 0.6,
                    px: 1.5,
                    '&:hover': { borderColor: '#38bdf8', bgcolor: 'rgba(56, 189, 248, 0.08)' },
                  }}
                >
                  {clarificationOpen ? 'Részletes pontosítás elrejtése' : '🔍 Feladatpontosítás & Részletek (Clarification)'}
                </Button>

                <Collapse in={clarificationOpen}>
                  <Box
                    sx={{
                      mt: 1.5,
                      p: 2.5,
                      bgcolor: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      borderRadius: 2,
                      '& p, & li': { color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.6, mb: 1 },
                      '& strong': { color: '#38bdf8' },
                      '& code': { bgcolor: 'rgba(255,255,255,0.1)', px: 0.8, py: 0.2, borderRadius: 1, color: '#00e699', fontFamily: 'monospace' },
                    }}
                  >
                    <Typography variant="caption" sx={{ color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                      💡 Feladat Értelmezése & Tippek
                    </Typography>
                    <ReactMarkdown>{cleanExplanation}</ReactMarkdown>
                  </Box>
                </Collapse>
              </Box>

              <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)', my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 1.5, fontSize: '0.8rem', letterSpacing: 0.5 }}>
                Példa Tesztesetek
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {safeTestCases.map((tc, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      p: 1.5,
                      bgcolor: '#06090e',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: 2,
                      fontSize: '0.85rem',
                      fontFamily: 'monospace',
                    }}
                  >
                    <Box sx={{ color: '#94a3b8', mb: 0.5 }}>
                      <b style={{ color: '#60a5fa' }}>Bemenet:</b> {tc.input}
                    </Box>
                    <Box sx={{ color: '#00e699' }}>
                      <b>Elvárt kimenet:</b> {tc.expected}
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Code Editor & Execution Results (Playground style) */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ bgcolor: '#0b1215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 3, display: 'flex', flexDirection: 'column' }}>
            {/* Editor Toolbar */}
            <Box
              sx={{
                p: 2,
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              {/* Language Selector */}
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel sx={{ color: '#94a3b8' }}>Programozási Nyelv</InputLabel>
                <Select
                  value={selectedLanguage}
                  label="Programozási Nyelv"
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  sx={{
                    bgcolor: '#06090e',
                    color: '#fff',
                    borderRadius: 2,
                    '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#00e699' },
                  }}
                >
                  {Object.entries(LANGUAGE_MAP).map(([key, langInfo]) => (
                    <MenuItem key={key} value={key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: langInfo.color }} />
                      <Typography sx={{ fontWeight: 600 }}>{langInfo.name}</Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Button
                  variant="outlined"
                  startIcon={isRunning ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
                  disabled={isRunning || isSubmitting}
                  onClick={handleRunCode}
                  sx={{
                    borderColor: 'rgba(0, 230, 153, 0.5)',
                    color: '#00e699',
                    fontWeight: 700,
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 2.5,
                    '&:hover': { borderColor: '#00e699', bgcolor: 'rgba(0, 230, 153, 0.08)' },
                  }}
                >
                  {isRunning ? 'Tesztelés...' : 'Futtatás & Tesztelés'}
                </Button>

                <Button
                  variant="contained"
                  startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                  disabled={isRunning || isSubmitting}
                  onClick={handleSubmitCode}
                  sx={{
                    bgcolor: '#00e699',
                    color: '#0b1215',
                    fontWeight: 800,
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 3,
                    boxShadow: '0 4px 14px rgba(0, 230, 153, 0.3)',
                    '&:hover': { bgcolor: '#00c784' },
                  }}
                >
                  {isSubmitting ? 'Beküldés...' : data.is_completed ? 'Újraküldés' : 'Végleges Beküldés'}
                </Button>
              </Box>
            </Box>

            {/* Monaco Editor Container */}
            <Box sx={{ height: 420, position: 'relative', bgcolor: '#1e1e1e', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <Editor
                key={`${selectedLanguage}-${challenge.id}`}
                height="420px"
                theme="vs-dark"
                language={LANGUAGE_MAP[selectedLanguage]?.monaco || 'python'}
                value={code}
                onChange={(val) => setCode(val || '')}
                loading={
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', gap: 1 }}>
                    <CircularProgress size={20} sx={{ color: '#00e699' }} />
                    <Typography variant="body2">Szerkesztő betöltése...</Typography>
                  </Box>
                }
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  fontFamily: "'Fira Code', Consolas, 'Courier New', monospace",
                  padding: { top: 12 },
                }}
              />
            </Box>

            {/* Output & Test Results Panel */}
            <Box sx={{ p: 2, bgcolor: '#06090e' }}>
              <Tabs
                value={outputTab}
                onChange={(_, v) => setOutputTab(v)}
                sx={{
                  minHeight: 36,
                  mb: 1.5,
                  '& .MuiTab-root': {
                    minHeight: 36,
                    py: 0,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                  },
                }}
              >
                <Tab
                  icon={<CodeIcon sx={{ fontSize: 18 }} />}
                  iconPosition="start"
                  label={`Teszteredmények ${safeTestResults.length > 0 ? `(${safeTestResults.filter((t) => t.passed).length}/${safeTestResults.length})` : ''}`}
                />
                <Tab
                  icon={<TerminalIcon sx={{ fontSize: 18 }} />}
                  iconPosition="start"
                  label="Konzol Kimenet"
                />
              </Tabs>

              {/* Tab 0: Test Results */}
              {outputTab === 0 && (
                <Box>
                  {safeTestResults.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center', color: '#64748b' }}>
                      <Typography variant="body2">
                        Kattints a <b>Futtatás & Tesztelés</b> gombra a tesztesetek ellenőrzéséhez!
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {safeTestResults.map((tr) => (
                        <Paper
                          key={tr.index}
                          sx={{
                            p: 1.5,
                            bgcolor: tr.passed ? 'rgba(0, 230, 153, 0.05)' : 'rgba(239, 68, 68, 0.08)',
                            border: tr.passed ? '1px solid rgba(0, 230, 153, 0.3)' : '1px solid rgba(239, 68, 68, 0.4)',
                            borderRadius: 2,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {tr.passed ? (
                                <CheckCircleIcon sx={{ color: '#00e699', fontSize: 18 }} />
                              ) : (
                                <CancelIcon sx={{ color: '#ef4444', fontSize: 18 }} />
                              )}
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: tr.passed ? '#00e699' : '#ef4444' }}>
                                #{tr.index}. Teszteset: {tr.passed ? 'SIKERES' : 'ELBUKOTT'}
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, fontSize: '0.85rem', fontFamily: 'monospace' }}>
                            <Box sx={{ color: '#94a3b8' }}>
                              <span style={{ color: '#60a5fa' }}>Bemenet:</span> {tr.input}
                            </Box>
                            <Box sx={{ color: '#94a3b8' }}>
                              <span style={{ color: '#00e699' }}>Elvárt:</span> {tr.expected}
                            </Box>
                            {!tr.passed && (
                              <>
                                <Box sx={{ color: '#ef4444' }}>
                                  <span>Kapott:</span> {tr.actual || '(üres)'}
                                </Box>
                                {tr.error && (
                                  <Box sx={{ color: '#f87171', bgcolor: 'rgba(0,0,0,0.3)', p: 1, borderRadius: 1, mt: 0.5, whiteSpace: 'pre-wrap' }}>
                                    <b>Hiba:</b> {tr.error}
                                  </Box>
                                )}
                              </>
                            )}
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  )}
                </Box>
              )}

              {/* Tab 1: Raw Console Output */}
              {outputTab === 1 && (
                <Box
                  sx={{
                    p: 2,
                    bgcolor: '#000',
                    color: '#e2e8f0',
                    fontFamily: "'Fira Code', Consolas, monospace",
                    fontSize: '0.85rem',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    maxHeight: 220,
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {consoleOutput || 'Nincs konzol kimenet.'}
                </Box>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Daily Challenge Leaderboard Card */}
      <Card sx={{ mt: 4, bgcolor: '#0b1215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 3, p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <EmojiEventsIcon sx={{ color: '#fbbf24', fontSize: 28 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff' }}>
                Napi Gyorsasági Ranglista (Mai nap)
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                A mai feladatot leggyorsabban beküldő programozók
              </Typography>
            </Box>
          </Box>

          <Chip
            icon={<MilitaryTechIcon sx={{ color: '#fbbf24' }} />}
            label="🥇 1. Hely: +100p | 🥈 2. Hely: +50p | 🥉 3. Hely: +25p"
            sx={{
              fontWeight: 700,
              bgcolor: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              color: '#fbbf24',
              py: 2,
              borderRadius: 2,
            }}
          />
        </Box>

        <TableContainer component={Paper} sx={{ bgcolor: '#06090e', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'rgba(255, 255, 255, 0.02)' }}>
              <TableRow>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700, width: '15%' }}>Helyezés</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700, width: '40%' }}>Kódoló</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700, width: '20%' }}>Nyelv</TableCell>
                <TableCell align="right" sx={{ color: 'text.secondary', fontWeight: 700, width: '25%' }}>Megoldási Idő</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {safeLeaderboard.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    Még senki sem küldte be a mai feladatot. Légy te a legelső!
                  </TableCell>
                </TableRow>
              ) : (
                safeLeaderboard.map((entry) => {
                  const isTop1 = entry.rank === 1;
                  const isTop2 = entry.rank === 2;
                  const isTop3 = entry.rank === 3;

                  return (
                    <TableRow
                      key={entry.user_id}
                      sx={{
                        bgcolor: isTop1 ? 'rgba(251, 191, 36, 0.05)' : 'transparent',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.03)' },
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {isTop1 && <span style={{ fontSize: '1.2rem' }}>🥇</span>}
                          {isTop2 && <span style={{ fontSize: '1.2rem' }}>🥈</span>}
                          {isTop3 && <span style={{ fontSize: '1.2rem' }}>🥉</span>}
                          <Typography
                            sx={{
                              fontWeight: 800,
                              color: isTop1 ? '#fbbf24' : isTop2 ? '#cbd5e1' : isTop3 ? '#cd7f32' : 'text.secondary',
                            }}
                          >
                            #{entry.rank}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box
                          onClick={() => navigate(`/profile/${entry.user_id}`)}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            cursor: 'pointer',
                            width: 'fit-content',
                            '&:hover': { opacity: 0.85 },
                          }}
                        >
                          <Avatar
                            src={getAvatarUrl(entry.avatar_url)}
                            sx={{
                              width: 32,
                              height: 32,
                              border: entry.active_effects?.includes('fire_avatar')
                                ? '2px solid #ef4444'
                                : entry.active_effects?.includes('dragon_crest')
                                ? '2px solid #fbbf24'
                                : entry.active_effects?.includes('neon_theme')
                                ? '2px solid #06b6d4'
                                : '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                          />
                          <Box>
                            <Typography
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                color: entry.active_effects?.includes('dragon_crest') ? '#fbbf24' : '#fff',
                              }}
                            >
                              {entry.nickname || 'Névtelen Hacker'}
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
                          label={(entry.language || 'python').toUpperCase()}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            bgcolor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#60a5fa',
                            fontSize: '0.75rem',
                          }}
                        />
                      </TableCell>

                      <TableCell align="right">
                        <Typography sx={{ fontWeight: 800, fontFamily: 'monospace', color: '#00e699' }}>
                          {formatSecondsToMMSS(entry.solve_time_seconds)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Container>
  );
};

const DailyChallenge: React.FC = () => {
  return (
    <DailyChallengeErrorBoundary>
      <DailyChallengeContent />
    </DailyChallengeErrorBoundary>
  );
};

export default DailyChallenge;
