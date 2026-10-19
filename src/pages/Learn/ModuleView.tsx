import React, { useEffect, useState } from "react";
import {
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Box,
  LinearProgress,
  Chip,
  TextField
} from "@mui/material";
import { motion } from 'framer-motion';
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getCourses } from "../../api";
import type { CourseListItem } from "../../api";
import { useAuth } from "../../contexts/AuthContext";

const ModuleView: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [activeFilter, setActiveFilter] = useState("Mind");
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();
  const { t: translation } = useTranslation();

  const fetchCourses = async () => {
    try {
      const data = await getCourses();
      setCourses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [translation]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const getCourseStats = (course: CourseListItem) => {
    // Determine completed lessons from localStorage
    let completedLessonIds: string[] = [];
    if (user) {
      const saved = localStorage.getItem('coderealm_progress') || localStorage.getItem('bootdevclone_progress');
      if (saved) {
        try {
          completedLessonIds = JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }

    // Count how many lesson_ids of this course are completed
    let completedCount = 0;
    const courseLessonIds = course.lesson_ids || [];
    courseLessonIds.forEach(id => {
      if (completedLessonIds.includes(id)) {
        completedCount++;
      }
    });

    const tasks = course.tasks_count || 0;
    const chapters = course.chapters_count || 0;
    const progress = tasks > 0 ? Math.round((completedCount / tasks) * 100) : 0;

    let tag = course.difficulty || course.category || '';
    if (!tag) {
      tag = 'Kezdő';
      if (course.title.toLowerCase().includes('go') || course.title.toLowerCase().includes('typescript')) {
        tag = 'Haladó';
      } else if (course.title.toLowerCase().includes('rust') || course.title.toLowerCase().includes('algoritmusok')) {
        tag = 'Profi';
      }
    }

    return { chapters, tasks, progress, tag };
  };

  return (
    <Box sx={{ p: 4, pt: 8, maxWidth: 1200, width: "100%" }}>
      <Typography variant="overline" sx={{ color: '#00e699', fontWeight: 'bold', letterSpacing: 2 }}>
        {translation("courseList.title") || "TANANYAG"}
      </Typography>
      <Typography variant="h2" sx={{ mt: 1, mb: 2, color: '#ffffff', fontWeight: 'bold' }}>
        Tanulási modulok
      </Typography>
      <Typography variant="body1" sx={{ mb: 6, maxWidth: 600, color: '#94a3b8' }}>
        Minden nyelv fejezetekre bomlik, a fejezetek pedig elméleti leckékre, futtatott kódfeladatokra, feleletválasztós kvízekre és kódkiegészítésre.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          label="Keresés név szerint"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            minWidth: 300,
            '& .MuiOutlinedInput-root': {
              color: '#fff',
              '& fieldset': { borderColor: '#1e293b' },
              '&:hover fieldset': { borderColor: '#3b82f6' },
              '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
            },
            '& .MuiInputLabel-root': { color: '#64748b' },
            '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' }
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, mb: 6, flexWrap: 'wrap' }}>
        {['Mind', 'Kezdő', 'Haladó', 'Profi', 'Backend', 'Adatbázis'].map((filter) => {
          const isActive = filter === activeFilter;
          return (
            <Chip
              key={filter}
              label={filter}
              onClick={() => setActiveFilter(filter)}
              variant={isActive ? "filled" : "outlined"}
              sx={{
                bgcolor: isActive ? 'rgba(0, 230, 153, 0.1)' : 'transparent',
                color: isActive ? '#00e699' : '#64748b',
                borderColor: isActive ? '#00e699' : '#1e293b',
                px: 1,
                py: 2,
                borderRadius: 2,
                cursor: 'pointer',
                fontWeight: 500,
                border: isActive ? '1px solid #00e699' : '1px solid #1e293b',
                '&:hover': { bgcolor: 'rgba(0, 230, 153, 0.05)' }
              }}
            />
          );
        })}
      </Box>

      <Grid container spacing={3}>
        {(() => {
          const filteredCourses = courses.filter(c => {
            const q = searchQuery.toLowerCase();
            const matchesSearch = c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
            if (!matchesSearch) return false;
            if (activeFilter === 'Mind') return true;

            let tag = c.difficulty || c.category || '';
            if (!tag) {
              tag = 'Kezdő';
              if (c.title.toLowerCase().includes('go') || c.title.toLowerCase().includes('typescript')) {
                tag = 'Haladó';
              } else if (c.title.toLowerCase().includes('rust') || c.title.toLowerCase().includes('algoritmusok')) {
                tag = 'Profi';
              }
            }
            return tag === activeFilter;
          });

          if (filteredCourses.length === 0) {
            return (
              <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
                <Box sx={{ p: 4, color: '#64748b', bgcolor: '#0f172a', border: '1px dashed #1e293b', borderRadius: 3 }}>
                  <Typography variant="h6" sx={{ mb: 1, color: '#94a3b8' }}>
                    Nem találtunk a keresésnek megfelelő modult.
                  </Typography>
                  <Typography variant="body2">
                    Próbálkozz más kifejezéssel vagy válassz megengedőbb kategóriát!
                  </Typography>
                </Box>
              </Grid>
            );
          }

          return filteredCourses.map((course, index) => {
            const stats = getCourseStats(course);


            return (
              <Grid size={{ xs: 12, md: 6 }} key={course.id}>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -4 }} style={{ height: '100%' }}>
                  <Card
                    onClick={() => navigate(`/courses/${course.id}`)}
                    sx={{
                      p: 2,
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      bgcolor: '#0f172a',
                      border: '1px solid #1e293b',
                      borderRadius: 3,
                      boxShadow: 'none',
                      '&:hover': { borderColor: '#334155', bgcolor: '#1e293b' }
                    }}
                  >
                    <CardContent sx={{ p: 1, pb: '8px !important' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 'bold' }}>{course.title}</Typography>
                        <Chip
                          label={stats.tag}
                          size="small"
                          sx={{
                            bgcolor: 'transparent',
                            border: '1px solid #1e293b',
                            color: '#64748b',
                            fontSize: '0.75rem',
                            height: 24
                          }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ mb: 4, minHeight: 40, color: '#94a3b8' }}>
                        {course.description}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontFamily: 'monospace' }}>
                          {stats.chapters} fejezet • {stats.tasks} feladat • {stats.progress}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={stats.progress}
                        sx={{
                          bgcolor: '#1e293b',
                          height: 4,
                          borderRadius: 2,
                          '& .MuiLinearProgress-bar': {
                            bgcolor: stats.progress > 0 ? '#00e699' : 'transparent',
                            backgroundImage: stats.progress > 0 ? 'linear-gradient(90deg, #fbbf24, #00e699)' : 'none',
                            borderRadius: 2
                          }
                        }}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            );
          })
        })()}
      </Grid>
    </Box>
  );
};

export default ModuleView;
