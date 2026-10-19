import React, { useEffect, useState } from 'react';
import {
  Typography, Box, CircularProgress, ListItemButton,
  ListItemIcon, ListItemText, Button, Card, LinearProgress, Chip,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CodeIcon from '@mui/icons-material/Code';
import QuizIcon from '@mui/icons-material/Quiz';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import DescriptionIcon from '@mui/icons-material/Description';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCourse, createChapter, createLesson, getLanguages, adminDeleteChapter, adminDeleteLesson } from '../api';
import type { CourseDetail as CourseDetailType } from '../api';
import { getCompletedLessons } from '../utils/progress';
import { useAuth } from '../contexts/AuthContext';
import AddChapterDialog from '../components/AddChapterDialog';
import AddLessonDialog, { type LessonFormData } from '../components/AddLessonDialog';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';

const CourseDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<CourseDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState<string[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);

  const [chapterDialogOpen, setChapterDialogOpen] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [targetChapter, setTargetChapter] = useState<{ id: string; title: string; count: number } | null>(null);

  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, hasRole } = useAuth();
  const isAdminOrTeacher = hasRole('admin') || hasRole('teacher');

  const fetchCourse = async () => {
    if (!courseId) return;
    try {
      const [data, langs] = await Promise.all([getCourse(courseId), getLanguages()]);
      setCourse(data);
      setAvailableLanguages(langs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (user) {
      setCompleted(getCompletedLessons());
    } else {
      setCompleted([]);
    }
  }, [user]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchCourse(); }, [courseId]);

  const handleCreateChapter = async (title: string, order: number) => {
    await createChapter(courseId!, { title, order });
    await fetchCourse();
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (window.confirm('Biztosan törölni szeretnéd ezt a fejezetet? Minden hozzá tartozó lecke elvész!')) {
      await adminDeleteChapter(courseId!, chapterId);
      await fetchCourse();
    }
  };

  const handleCreateLesson = async (data: LessonFormData) => {
    await createLesson(courseId!, targetChapter!.id, data);
    await fetchCourse();
  };

  const handleDeleteLesson = async (chapterId: string, lessonId: string) => {
    if (window.confirm('Biztosan törölni szeretnéd ezt a leckét?')) {
      await adminDeleteLesson(courseId!, chapterId, lessonId);
      await fetchCourse();
    }
  };

  if (loading || !course) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexGrow: 1 }}>
        <CircularProgress />
      </Box>
    );
  }

  const flatLessonIds = course.chapters.flatMap(ch => ch.lessons.map(l => l.id));
  const completedCount = flatLessonIds.filter(id => completed.includes(id)).length;
  const progressPercent = flatLessonIds.length > 0 ? Math.round((completedCount / flatLessonIds.length) * 100) : 0;

  return (
    <Box sx={{ p: 4, pt: 8, maxWidth: 900, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: '250px' }}>
          <Typography variant="overline" color="primary" sx={{ fontWeight: 'bold', letterSpacing: 2 }}>
            KURZUS
          </Typography>
          <Typography variant="h2" sx={{ mt: 1, mb: 2 }}>{course.title}</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>{course.description}</Typography>
        </Box>
        {isAdminOrTeacher && (
          <Button
            variant="outlined"
            onClick={() => setChapterDialogOpen(true)}
            sx={{ textTransform: 'none', fontWeight: 600, flexShrink: 0 }}
          >
            {t('admin.addChapter')}
          </Button>
        )}
      </Box>

      {/* Progress */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="caption" color="text.secondary">Haladás</Typography>
        <Typography variant="caption" color="primary.main" sx={{ fontWeight: "bold" }}>{progressPercent}%</Typography>
      </Box>
      <LinearProgress variant="determinate" value={progressPercent} sx={{
        mb: 6, bgcolor: '#1e293b',
        '& .MuiLinearProgress-bar': { backgroundImage: 'linear-gradient(90deg, #fbbf24, #00e699)' },
      }} />

      {/* Chapters */}
      {course.chapters.map((ch, idx) => {
        const chCompletedCount = ch.lessons.filter(l => completed.includes(l.id)).length;
        const chTotal = ch.lessons.length;
        const allDone = chTotal > 0 && chCompletedCount === chTotal;
        const status = allDone ? 'kész' : 'folyamatban';
        return (
          <motion.div key={ch.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}>
            <Card sx={{ mb: 4, bgcolor: 'transparent', border: `1px solid ${allDone ? '#1e293b' : '#334155'}` }}>
              {/* Chapter header */}
              <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Typography variant="body1" color="text.secondary" sx={{ fontFamily: 'monospace', minWidth: 32, fontWeight: 700 }}>
                    {String(ch.order).padStart(2, '0')}
                  </Typography>
                  <Box>
                    <Typography variant="h6">{ch.title}</Typography>
                    <Typography variant="caption" color="primary.main" sx={{ fontWeight: "bold" }}>
                      {chTotal > 0 ? Math.round((chCompletedCount / chTotal) * 100) : 0}% KÉSZ
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  {isAdminOrTeacher && (
                    <>
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => {
                          setTargetChapter({ id: ch.id, title: ch.title, count: ch.lessons.length });
                          setLessonDialogOpen(true);
                        }}
                        sx={{ textTransform: 'none', fontSize: '0.8rem' }}
                      >
                        {t('admin.addLesson')}
                      </Button>
                      <IconButton size="small" color="error" onClick={() => handleDeleteChapter(ch.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                  <Chip
                    label={status}
                    size="small"
                    variant="outlined"
                    sx={{
                      color: allDone ? 'primary.main' : '#fbbf24',
                      borderColor: allDone ? 'primary.main' : '#fbbf24',
                      bgcolor: allDone ? 'rgba(0,230,153,0.08)' : 'rgba(251,191,36,0.08)',
                    }}
                  />
                </Box>
              </Box>

              {/* Lessons list */}
              {ch.lessons.map((lesson, i) => {
                const isDone = completed.includes(lesson.id);
                const isLocked = !isDone && i > 0 && !completed.includes(ch.lessons[i - 1].id);
                const LessonIcon = isLocked ? LockIcon
                  : lesson.type === 'code_challenge' ? CodeIcon
                  : lesson.type === 'theory' ? AutoStoriesIcon
                  : lesson.type === 'document' ? DescriptionIcon
                  : lesson.type === 'multiple_choice' ? QuizIcon
                  : CheckCircleOutlinedIcon;

                return (
                  <ListItemButton
                    key={lesson.id}
                    disabled={isLocked && !isAdminOrTeacher}
                    onClick={() => (!isLocked || isAdminOrTeacher) && navigate(`/courses/${courseId}/chapters/${ch.id}/lessons/${lesson.id}`)}
                    sx={{ borderTop: '1px solid #1e293b', py: 2, px: 3, '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: isDone ? 'primary.main' : 'text.secondary' }}>
                      <LessonIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography sx={{ fontWeight: isDone ? 600 : 400, color: isDone ? '#fff' : 'text.secondary' }}>
                          {`${i + 1}. Lecke: ${lesson.title.replace(/^(\d+[\.:]\s*(Lecke:\s*)?|L\d+[\.:]\s*|(Elmélet|Kódfeladat|Kvíz|Kódkiegészítés|Dokumentum):\s*)/i, '').trim()}`}
                        </Typography>
                      }
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 70, textAlign: 'right' }}>
                        {lesson.type === 'theory' ? 'Elmélet' : lesson.type === 'code_challenge' ? 'Kódolás' : lesson.type === 'document' ? 'Dokumentum' : lesson.type === 'multiple_choice' ? 'Kvíz' : lesson.type}
                      </Typography>
                      <Typography variant="caption" color={isDone ? 'primary.main' : 'text.secondary'}
                        sx={{ minWidth: 50, textAlign: 'right', fontWeight: 'bold' }}>
                        {isDone ? `+${(lesson.type === 'theory' || lesson.type === 'document') ? 1 : lesson.type === 'multiple_choice' ? 5 : 10} pt` : ''}
                      </Typography>
                      {isAdminOrTeacher && (
                        <IconButton size="small" color="error" onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLesson(ch.id, lesson.id);
                        }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </ListItemButton>
                );
              })}

              {/* Empty chapter hint */}
              {ch.lessons.length === 0 && (
                <Box sx={{ p: 3, textAlign: 'center', borderTop: '1px solid #1e293b' }}>
                  <Typography variant="caption" color="text.secondary">
                    {isAdminOrTeacher ? 'Kattints a "+ Lecke" gombra az első lecke hozzáadásához' : 'Nincs lecke ebben a fejezetben'}
                  </Typography>
                </Box>
              )}
            </Card>
          </motion.div>
        );
      })}

      {/* Empty course hint */}
      {course.chapters.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <FolderOpenIcon sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
          <Typography variant="h6">Még nincs fejezet</Typography>
          {isAdminOrTeacher && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Kattints a "+ Fejezet" gombra a tartalom hozzáadásához
            </Typography>
          )}
        </Box>
      )}

      {/* Dialogs */}
      <AddChapterDialog
        open={chapterDialogOpen}
        onClose={() => setChapterDialogOpen(false)}
        onSubmit={handleCreateChapter}
        defaultOrder={course.chapters.length + 1}
      />

      {targetChapter && (
        <AddLessonDialog
          open={lessonDialogOpen}
          onClose={() => setLessonDialogOpen(false)}
          onSubmit={handleCreateLesson}
          defaultOrder={targetChapter.count + 1}
          chapterTitle={targetChapter.title}
          availableLanguages={availableLanguages}
        />
      )}
    </Box>
  );
};

export default CourseDetail;
