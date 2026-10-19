import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, CircularProgress, Button, Paper, Radio, RadioGroup, FormControlLabel, FormControl, Alert } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import Editor from '@monaco-editor/react';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SendIcon from '@mui/icons-material/Send';
import { getLesson, submitAnswer, runCode, getCourse, requestLessonHelp, recordLessonTime, consumeHelper } from '../api';
import { markLessonComplete, getCompletedLessons } from '../utils/progress';
import { useAuth } from '../contexts/AuthContext';
import type { LessonDetail, SubmitAnswerResponse, CourseDetail } from '../api';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Snackbar from '@mui/material/Snackbar';
import { useAntiCheat } from '../hooks/useAntiCheat';
import AIMentorPanel from '../components/Editor/AIMentorPanel';
import { lessonMentorContext } from '../services/aiMentor/lessonContext';

const Lesson: React.FC = () => {
  const { courseId, chapterId, lessonId } = useParams<{ courseId: string; chapterId: string; lessonId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated, updatePoints, updateUserContext } = useAuth();
  

  
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [courseDetails, setCourseDetails] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNextDialog, setShowNextDialog] = useState(false);
  
  // State for Code Challenge
  const [code, setCode] = useState<string>('');
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [mentorRunFailure, setMentorRunFailure] = useState<{ exerciseId: string; code: string; message: string } | undefined>();
  
  // State for Multiple Choice
  const [selectedOption, setSelectedOption] = useState<string>('');
  
  // Submission Feedback
  const [feedback, setFeedback] = useState<SubmitAnswerResponse | null>(null);
  const [pointsEarned, setPointsEarned] = useState<number>(0);

  // Help feature
  const [helpHint, setHelpHint] = useState<string>('');
  const [helpCount, setHelpCount] = useState<number>(0);
  const [isRequestingHelp, setIsRequestingHelp] = useState(false);
  const [isHelperActiveForLesson, setIsHelperActiveForLesson] = useState(false);

  // Track time spent
  useEffect(() => {
    if (!lessonId) return;
    setIsHelperActiveForLesson(false);
    const startTime = Date.now();
    return () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      if (timeSpent > 0) {
        recordLessonTime(lessonId, timeSpent).catch(console.error);
      }
    };
  }, [lessonId]);
  
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastSeverity, setToastSeverity] = useState<'warning' | 'error' | 'success'>('warning');

  const { isBlurred } = useAntiCheat({ 
    enabled: lesson !== null && lesson.type !== 'theory' && lesson.type !== 'document', 
    onBlurWarning: (count) => {
      if (count >= 3) {
        console.log('Focus lost 3 times! Resetting code to prevent cheating.');
        setCode(lesson?.starter_code || '');
        setToastMessage("Túl sokszor hagytad el az ablakot! A kódod visszaállt az eredeti állapotra.");
        setToastSeverity('error');
        setToastOpen(true);
      } else {
        setToastMessage(`Figyelem! Ne válts ablakot feladatmegoldás közben! (${count}/3)`);
        setToastSeverity('warning');
        setToastOpen(true);
      }
    }
  });

  useEffect(() => {
    const fetchLesson = async () => {
      if (!courseId || !chapterId || !lessonId) return;
      try {
        setLoading(true);
        const data = await getLesson(courseId, chapterId, lessonId);
        setLesson(data);
        setCode(data.starter_code || '');
        setSelectedOption('');
        setFeedback(null);
        setConsoleOutput('');
        setMentorRunFailure(undefined);
        setHelpHint('');
        setHelpCount(0);
        setIsHelperActiveForLesson(false);

        // Fetch course details if not fetched
        if (!courseDetails) {
          const cData = await getCourse(courseId);
          setCourseDetails(cData);
        }
      } catch {
        console.error('Failed to load lesson');
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [courseId, chapterId, lessonId, t]);

  const allLessons = useMemo(() => {
    if (!courseDetails) return [];
    const list: { chapterId: string; lessonId: string }[] = [];
    courseDetails.chapters.forEach(ch => {
      ch.lessons.forEach(l => {
        list.push({ chapterId: ch.id, lessonId: l.id });
      });
    });
    return list;
  }, [courseDetails]);

  const currentIndex = allLessons.findIndex(
    l => l.chapterId === chapterId && l.lessonId === lessonId
  );

  const getNextLesson = () => {
    if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
      return allLessons[currentIndex + 1];
    }
    return null;
  };

  const getPrevLesson = () => {
    if (currentIndex > 0) {
      return allLessons[currentIndex - 1];
    }
    return null;
  };

  const handleRun = async () => {
    if (!lesson || !courseId || !chapterId || !lessonId) return;
    setIsEvaluating(true);
    setFeedback(null);
    setMentorRunFailure(undefined);
    try {
      const res = await runCode(courseId, chapterId, lessonId, { code });
      setConsoleOutput(res.console_output || t('lesson.noOutput'));
      // This endpoint runs only the student's code; submission output may contain hidden tests.
      if (res.exit_code !== 0) setMentorRunFailure({ exerciseId: lesson.id, code, message: res.console_output });
    } catch (err: any) {
      setConsoleOutput(err.message || t('lesson.errorRunning'));
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSubmit = async () => {
    if (!lesson || !courseId || !chapterId || !lessonId) return;
    setIsEvaluating(true);
    try {
      const reqData = lesson.type === 'code_challenge' 
        ? { code } 
        : (lesson.type === 'multiple_choice' ? { selected_option_id: selectedOption } : {});
        
      const res = await submitAnswer(courseId, chapterId, lessonId, reqData);
      setFeedback(res);
      if (res.console_output) {
        setConsoleOutput(res.console_output);
      }
      if (res.correct) {
        const completed = getCompletedLessons();
        const alreadyCompleted = completed.includes(lessonId);

        markLessonComplete(lessonId);
        
        // Calculate points with helper item and amulet effects
        if (isAuthenticated && !alreadyCompleted) {
          const basePoints = lesson.type === 'code_challenge' ? 10 : lesson.type === 'multiple_choice' ? 5 : 1;
          let effectiveHelp = helpCount;
          if (isHelperActiveForLesson && effectiveHelp > 0) {
            effectiveHelp--;
          }
          let expectedPoints = basePoints;
          if (effectiveHelp > 0) {
            expectedPoints = Math.floor(basePoints * (100 - (effectiveHelp * 20)) / 100);
            if (expectedPoints < 0) expectedPoints = 0;
          }
          if (user?.active_effects?.includes('xp_amulet')) {
            expectedPoints = Math.floor(expectedPoints * 1.1);
          }
          setPointsEarned(expectedPoints);
          updatePoints((user?.points || 0) + expectedPoints);
        }
        setShowNextDialog(true);
      }
    } catch {
      setFeedback({ correct: false, feedback: t('lesson.errorRunning') });
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleHelpRequest = async () => {
    if (!lesson || !courseId || !chapterId || !lessonId || !isAuthenticated) return;
    setIsRequestingHelp(true);
    try {
      const res = await requestLessonHelp(courseId, chapterId, lessonId);
      setHelpHint(res.hint);
      setHelpCount(res.help_count);

      // After successful help request, try to consume helper item if available
      if (user?.active_effects?.includes('helper')) {
        try {
          await consumeHelper(lessonId);
          setIsHelperActiveForLesson(true);
          updateUserContext({
            active_effects: user.active_effects.filter((e: string) => e !== 'helper')
          });
          setToastMessage("Helper tárgy aktiválva! Nem veszítesz pontot a segítségkérésért.");
          setToastSeverity("success");
          setToastOpen(true);
        } catch (consumeErr) {
          // Helper consumption failed silently - don't overwrite the hint
          console.error('Helper consumption failed:', consumeErr);
        }
      }
    } catch (err: any) {
      let errMsg = "Hiba történt a segítségkérés során.";
      if (err.response?.data?.error) {
        if (typeof err.response.data.error === 'string') {
          errMsg = err.response.data.error;
        } else if (err.response.data.error.message) {
          errMsg = err.response.data.error.message;
        }
      }
      setHelpHint(errMsg);
    } finally {
      setIsRequestingHelp(false);
    }
  };

  const handleEditorMount = (editor: any, monaco: any) => {
    // Block keyboard shortcuts natively inside Monaco
    editor.onKeyDown((e: any) => {
      if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyC' || e.code === 'KeyV' || e.code === 'KeyX' || e.code === 'Insert')) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
    // Also disable via command overriding as a fallback
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => {});
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {});
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX, () => {});
  };

  const getLessonDisplayTitle = () => {
    if (!lesson) return '';
    const clean = lesson.title.replace(/^(\d+[\.:]\s*(Lecke:\s*)?|L\d+[\.:]\s*|(Elmélet|Kódfeladat|Kvíz|Kódkiegészítés|Dokumentum):\s*)/i, '').trim();
    if (courseDetails && chapterId) {
      const ch = courseDetails.chapters.find(c => c.id === chapterId);
      if (ch) {
        const idx = ch.lessons.findIndex(l => l.id === lessonId);
        if (idx >= 0) {
          return `${idx + 1}. Lecke: ${clean}`;
        }
      }
    }
    return clean;
  };

  if (loading || !lesson) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexGrow: 1 }}>
        <CircularProgress />
      </Box>
    );
  }

  const mentorContext = lesson.type === 'code_challenge'
    ? lessonMentorContext(lesson, code, mentorRunFailure?.exerciseId === lesson.id ? mentorRunFailure : undefined)
    : undefined;

  return (
    <Box sx={{ 
      display: 'flex', 
      flexGrow: 1, 
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Solid warning overlay for instant anti-cheat */}
      {isBlurred && (
        <Box sx={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 2147483647,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a', // Solid slate-900
        }}>
          <Typography variant="h4" color="error" sx={{ fontWeight: 'bold' }}>
            Fókusz elvesztve!
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
            Kérlek, kattints ide a visszatéréshez.
          </Typography>
        </Box>
      )}

      {/* Left Pane: Markdown Content */}
      <Box sx={{ 
        width: (lesson.type === 'theory' || lesson.type === 'document') ? '100%' : '50%', 
        bgcolor: '#0b1215', 
        p: 4, 
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Box sx={{ maxWidth: (lesson.type === 'theory' || lesson.type === 'document') ? '800px' : 'none', width: '100%', mx: (lesson.type === 'theory' || lesson.type === 'document') ? 'auto' : 0 }}>
          
          <Box sx={{ mb: 4, display: 'flex', alignItems: 'baseline', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
              {getLessonDisplayTitle()}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'primary.main',
                fontWeight: 700,
                fontFamily: 'monospace',
                bgcolor: 'rgba(0,230,153,0.1)',
                border: '1px solid rgba(0,230,153,0.25)',
                borderRadius: 1.5,
                px: 1,
                py: 0.25,
                whiteSpace: 'nowrap',
                fontSize: '0.9rem',
              }}
            >
              +{lesson.type === 'theory' ? 1 : lesson.type === 'multiple_choice' ? 5 : 10} pont
            </Typography>
          </Box>
          <Box sx={{ 
            '& p, & li': { fontSize: '1.05rem', lineHeight: 1.7, mb: 3, color: 'text.primary' }, 
            '& code': { bgcolor: 'rgba(255,255,255,0.1)', p: '2px 6px', borderRadius: 1, color: 'primary.main', fontFamily: 'monospace', fontSize: '0.9em' },
            '& pre': { bgcolor: '#11191f', p: 2, borderRadius: 2, overflowX: 'auto', border: '1px solid', borderColor: 'divider', mb: 3 },
            '& pre code': { bgcolor: 'transparent', p: 0, color: 'text.primary', fontSize: '0.95em' },
            '& h1, & h2, & h3, & h4': { color: 'text.primary', mt: 5, mb: 2, fontWeight: 600 },
            '& blockquote': { borderLeft: '4px solid', borderColor: 'primary.main', pl: 2, ml: 0, color: 'text.secondary', fontStyle: 'italic' }
          }}>
            <ReactMarkdown>{lesson.description}</ReactMarkdown>
          </Box>
          
          {feedback && (
            <Alert severity={feedback.correct ? 'success' : 'error'} sx={{ mt: 4, borderRadius: 2, bgcolor: feedback.correct ? 'rgba(0,230,153,0.1)' : 'rgba(255,75,75,0.1)', color: 'text.primary' }}>
              {feedback.feedback}
            </Alert>
          )}

          {helpHint && (
            <Alert severity="info" sx={{ mt: 2, borderRadius: 2, bgcolor: 'rgba(96, 165, 250, 0.1)', color: 'text.primary', border: '1px solid rgba(96, 165, 250, 0.3)' }}>
              <ReactMarkdown>{helpHint}</ReactMarkdown>
            </Alert>
          )}

          {mentorContext && <AIMentorPanel key={lesson.id} exerciseId={lesson.id} context={mentorContext} />}

          {lesson.document_url && (
            <Box sx={{ mt: 4, mb: 4, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', bgcolor: '#11191f' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Csatolt dokumentum</Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={() => {
                    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';
                    window.open(`${API_URL}${lesson.document_url}`, '_blank');
                  }}
                >
                  Letöltés / Megnyitás új lapon
                </Button>
              </Box>
              <Box sx={{ height: 600, width: '100%', bgcolor: '#fff', display: 'flex', flexDirection: 'column' }}>
                {lesson.document_url.endsWith('.pdf') ? (
                  <iframe 
                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:8081'}${lesson.document_url}`}
                    width="100%" 
                    height="100%" 
                    style={{ border: 'none' }}
                    title="Document Viewer"
                  />
                ) : (
                  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', bgcolor: '#11191f', p: 4, textAlign: 'center' }}>
                      <Typography variant="h6" color="text.primary" gutterBottom>
                        Beágyazás nem támogatott (Localhost)
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500 }}>
                        A Word (DOC/DOCX) és PowerPoint (PPT/PPTX) dokumentumok beágyazott megjelenítését a Google Docs Viewer végzi. Ez az eszköz nem tud hozzáférni a te helyi (localhost) hálózatodon lévő fájlokhoz.
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Éles (publikus) szerveren a dokumentum meg fog jelenni. Teszteléshez kérlek használd a fenti <strong>Letöltés / Megnyitás</strong> gombot!
                      </Typography>
                    </Box>
                  ) : (
                    <iframe 
                      src={`https://docs.google.com/gview?url=${encodeURIComponent(`${import.meta.env.VITE_API_URL || 'http://localhost:8081'}${lesson.document_url}`)}&embedded=true`}
                      width="100%" 
                      height="100%" 
                      style={{ border: 'none' }}
                      title="Document Viewer"
                    />
                  )
                )}
              </Box>
            </Box>
          )}

          {(lesson.type === 'theory' || lesson.type === 'document') && (
            <Box sx={{ textAlign: 'center', mt: 8, pt: 4, borderTop: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="h5" gutterBottom sx={{ mb: 3, color: 'text.primary' }}>
                {t('lesson.theoryCompletedText', 'Elolvastam és megértettem az elméletet')}
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                size="large"
                onClick={handleSubmit}
                disabled={isEvaluating}
                sx={{ py: 2, px: 6, fontWeight: 'bold', fontSize: '1.1rem', textTransform: 'none', mb: 4 }}
              >
                {t('lesson.completeTheory', 'Befejezés és tovább')}
              </Button>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  size="small"
                  disabled={!getPrevLesson()}
                  onClick={() => {
                    const p = getPrevLesson();
                    if (p) navigate(`/courses/${courseId}/chapters/${p.chapterId}/lessons/${p.lessonId}`);
                  }}
                  sx={{ textTransform: 'none', color: 'text.secondary' }}
                >
                  &larr; Előző
                </Button>
                {getNextLesson() && (getCompletedLessons().includes(lessonId || '') || feedback?.correct) && (
                  <Button 
                    size="small"
                    onClick={() => {
                      const n = getNextLesson();
                      if (n) navigate(`/courses/${courseId}/chapters/${n.chapterId}/lessons/${n.lessonId}`);
                    }}
                    sx={{ textTransform: 'none', color: 'text.secondary' }}
                  >
                    Következő &rarr;
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Right Pane: Interactive Area */}
      {(lesson.type !== 'theory' && lesson.type !== 'document') && (
        <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column', bgcolor: '#0b1215', borderLeft: '1px solid', borderColor: 'divider' }}>
          {lesson.type === 'code_challenge' ? (
            <>
              {/* Top Toolbar */}
              <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#11191f', borderBottom: '1px solid', borderColor: 'divider', overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
                <Box sx={{ px: 2, py: 1, borderRight: '1px solid', borderBottom: '2px solid', borderColor: 'primary.main', bgcolor: '#0b1215', color: 'primary.main', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                  main.{lesson.language === 'javascript' ? 'js' : 'py'}
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center', flexGrow: 1, px: 2, gap: 1, minWidth: 'max-content' }}>
                  <Button 
                    size="small"
                    disabled={!getPrevLesson()}
                    onClick={() => {
                      const p = getPrevLesson();
                      if (p) navigate(`/courses/${courseId}/chapters/${p.chapterId}/lessons/${p.lessonId}`);
                    }}
                    sx={{ color: '#9ca3af', textTransform: 'none', fontSize: '0.75rem', minWidth: 0, px: 1, '&:hover': { color: '#fff' } }}
                  >
                    &larr; Előző
                  </Button>
                  {isAuthenticated && helpCount < 3 && (
                    <Button
                      size="small"
                      onClick={handleHelpRequest}
                      disabled={isRequestingHelp || isEvaluating}
                      sx={{ color: '#fbbf24', textTransform: 'none', fontSize: '0.75rem', minWidth: 0, px: 1, '&:hover': { color: '#f59e0b' } }}
                    >
                      ? (-20%)
                    </Button>
                  )}
                  <Button 
                    variant="outlined" 
                    color="inherit" 
                    size="small" 
                    startIcon={<PlayArrowIcon sx={{ fontSize: '1rem !important' }} />}
                    onClick={handleRun}
                    disabled={isEvaluating}
                    sx={{ borderRadius: 1, px: 1, py: 0.25, borderColor: '#334155', color: '#9ca3af', textTransform: 'none', fontSize: '0.75rem', minWidth: 0, '&:hover': { borderColor: '#f3f4f6', color: '#f3f4f6' } }}
                  >
                    {t('lesson.run', 'Futtatás')}
                  </Button>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    size="small"
                    startIcon={<SendIcon sx={{ fontSize: '0.9rem !important' }} />}
                    onClick={handleSubmit}
                    disabled={isEvaluating}
                    sx={{ borderRadius: 1, px: 1, py: 0.25, fontWeight: 'bold', color: '#000', textTransform: 'none', fontSize: '0.75rem', minWidth: 0 }}
                  >
                    {t('lesson.submit', 'Beküldés')}
                  </Button>
                  {getNextLesson() && (getCompletedLessons().includes(lessonId || '') || feedback?.correct) && (
                    <Button 
                      size="small"
                      onClick={() => {
                        const n = getNextLesson();
                        if (n) navigate(`/courses/${courseId}/chapters/${n.chapterId}/lessons/${n.lessonId}`);
                      }}
                      sx={{ color: '#9ca3af', textTransform: 'none', fontSize: '0.75rem', minWidth: 0, px: 1, '&:hover': { color: '#fff' } }}
                    >
                      Következő &rarr;
                    </Button>
                  )}
                </Box>
              </Box>
  
              {/* Editor Area */}
              <Box sx={{ flexGrow: 1, position: 'relative', pt: 1 }}>
                <Editor
                  height="100%"
                  language={lesson.language || 'python'}
                  theme="vs-dark"
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  onMount={handleEditorMount}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 15,
                    padding: { top: 8 },
                    scrollBeyondLastLine: false,
                    contextmenu: false,
                    quickSuggestions: false,
                  }}
                />
              </Box>
  
              {/* Terminal Header */}
              <Box sx={{ bgcolor: '#11191f', px: 2, py: 0.8, color: '#9ca3af', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
                TERMINAL
              </Box>
              
              {/* Output */}
              <Box sx={{ height: '30%', minHeight: 200, p: 2, overflowY: 'auto', color: '#e5e7eb', fontFamily: '"Fira Code", monospace', whiteSpace: 'pre-wrap', fontSize: '0.9rem', bgcolor: '#000000', '&::-webkit-scrollbar': { width: '8px' }, '&::-webkit-scrollbar-thumb': { background: '#334155' } }}>
                {consoleOutput || `> ${t('lesson.ready')}`}
              </Box>
            </>
          ) : (
            /* Interactive Area */
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center', bgcolor: '#11191f', borderBottom: '1px solid', borderColor: 'divider', px: 2, py: 1, overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' }, gap: 1, minWidth: 'max-content' }}>
                <Button 
                  size="small"
                  disabled={!getPrevLesson()}
                  onClick={() => {
                    const p = getPrevLesson();
                    if (p) navigate(`/courses/${courseId}/chapters/${p.chapterId}/lessons/${p.lessonId}`);
                  }}
                  sx={{ color: '#9ca3af', textTransform: 'none', fontSize: '0.75rem', minWidth: 0, px: 1, '&:hover': { color: '#fff' } }}
                >
                  &larr; Előző
                </Button>
                {isAuthenticated && helpCount < 3 && (
                  <Button
                    size="small"
                    onClick={handleHelpRequest}
                    disabled={isRequestingHelp || isEvaluating}
                    sx={{ color: '#fbbf24', textTransform: 'none', fontSize: '0.75rem', minWidth: 0, px: 1, '&:hover': { color: '#f59e0b' } }}
                  >
                    ? (-20%)
                  </Button>
                )}
                {getNextLesson() && (getCompletedLessons().includes(lessonId || '') || feedback?.correct) && (
                  <Button 
                    size="small"
                    onClick={() => {
                    const n = getNextLesson();
                    if (n) navigate(`/courses/${courseId}/chapters/${n.chapterId}/lessons/${n.lessonId}`);
                  }}
                  sx={{ color: '#9ca3af', textTransform: 'none', fontSize: '0.75rem', minWidth: 0, px: 1, '&:hover': { color: '#fff' } }}
                >
                  Következő &rarr;
                </Button>
                )}
              </Box>
              <Box sx={{ p: 6, display: 'flex', flexDirection: 'column', justifyContent: 'center', flexGrow: 1, bgcolor: 'background.default' }}>
                <Typography variant="h5" gutterBottom sx={{ mb: 4 }}>
                  {t('lesson.selectCorrectAnswer')}
                </Typography>

              <FormControl component="fieldset">
                <RadioGroup
                  value={selectedOption}
                  onChange={(e) => setSelectedOption(e.target.value)}
                >
                  {lesson.options?.map((opt) => (
                    <Paper 
                      key={opt.id} 
                      elevation={0} 
                      sx={{ 
                        mb: 2, 
                        border: '1px solid', 
                        borderColor: selectedOption === opt.id ? 'primary.main' : 'divider',
                        bgcolor: selectedOption === opt.id ? 'rgba(96, 165, 250, 0.08)' : 'transparent',
                        transition: 'all 0.2s'
                      }}
                    >
                      <FormControlLabel 
                        value={opt.id} 
                        control={<Radio />} 
                        label={opt.text} 
                        sx={{ width: '100%', m: 0, p: 2 }}
                      />
                    </Paper>
                  ))}
                </RadioGroup>
              </FormControl>
              <Box sx={{ mt: 4 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  size="large"
                  fullWidth
                  onClick={handleSubmit}
                  disabled={!selectedOption || isEvaluating}
                  sx={{ py: 1.5 }}
                >
                  {t('lesson.submitAnswer')}
                </Button>
              </Box>
            </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Success Dialog */}
      <Dialog open={showNextDialog} onClose={() => setShowNextDialog(false)}>
        <DialogTitle>{t('lesson.successTitle', 'Sikeres megoldás!')}</DialogTitle>
        <DialogContent>
          <Typography>{t('lesson.successMessage', 'Gratulálok, helyesen oldottad meg a feladatot! Szeretnél továbbhaladni a következő leckére?')}</Typography>
          {pointsEarned > 0 && (
            <Typography sx={{ mt: 2, fontWeight: 'bold', color: 'primary.main', fontSize: '1.1rem' }}>
              +{pointsEarned} pont! 🎉
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNextDialog(false)} color="inherit" sx={{ textTransform: 'none' }}>
            {t('lesson.stayHere', 'Maradok')}
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            disabled={!getNextLesson()}
            onClick={() => {
              setShowNextDialog(false);
              const nextLesson = getNextLesson();
              if (nextLesson) {
                navigate(`/courses/${courseId}/chapters/${nextLesson.chapterId}/lessons/${nextLesson.lessonId}`);
              }
            }}
            sx={{ textTransform: 'none', fontWeight: 'bold' }}
          >
            {getNextLesson() ? t('lesson.nextLesson', 'Tovább a következőre') : t('lesson.courseCompleted', 'Kurzus befejezve')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={toastOpen} 
        autoHideDuration={5000} 
        onClose={(_, reason) => {
          if (reason === 'clickaway') return;
          setToastOpen(false);
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={() => setToastOpen(false)} severity={toastSeverity} sx={{ width: '100%', fontSize: '1.2rem', fontWeight: 'bold' }}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Lesson;
