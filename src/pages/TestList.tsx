import React, { useEffect, useState } from "react";
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Box,
  Chip
} from "@mui/material";
import { motion } from 'framer-motion';
import AddIcon from "@mui/icons-material/Add";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import EditIcon from "@mui/icons-material/Edit";
import TerminalIcon from "@mui/icons-material/Terminal";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getTests, createTest, updateTest, getCourses, getTeacherGroups } from "../api";
import type { TestModel, CourseListItem, GroupModel } from "../api";
import { useAuth } from "../contexts/AuthContext";
import AddTestDialog, { type TestFormData } from "../components/AddTestDialog";

const TestList: React.FC = () => {
  const { hasRole } = useAuth();
  const [tests, setTests] = useState<TestModel[]>([]);
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [groups, setGroups] = useState<GroupModel[]>([]);
  const [loading, setLoading] = useState(true);

  const [openDialog, setOpenDialog] = useState(false);
  const [currentTest, setCurrentTest] = useState<TestFormData | null>(null);
  const [currentTestId, setCurrentTestId] = useState<string | null>(null);

  const navigate = useNavigate();
  const { t: translation } = useTranslation();

  const fetchData = async () => {
    try {
      const isTeacherOrAdmin = hasRole('teacher') || hasRole('admin');

      const promises: Promise<any>[] = [getTests(), getCourses()];
      if (isTeacherOrAdmin) {
        promises.push(getTeacherGroups());
      }

      const results = await Promise.all(promises);
      setTests(results[0] || []);
      setCourses(results[1] || []);
      if (isTeacherOrAdmin) {
        setGroups(results[2] || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setCurrentTest(null);
    setCurrentTestId(null);
    setOpenDialog(true);
  };

  const handleOpenEdit = (test: TestModel) => {
    setCurrentTestId(test.id);
    setCurrentTest({
      title: test.title,
      description: test.description,
      course_id: test.course_id,
      group_id: (test as any).group_id, // casting because group_id isn't in TestModel in api.ts yet
      is_visible: test.is_visible,
      open_date: test.open_date,
      language: test.language || 'python',
      starter_code: test.starter_code || '',
      solution_code: test.solution_code || '',
      test_code: test.test_code || '',
      expected_output: test.expected_output || ''
    });
    setOpenDialog(true);
  };

  const handleSave = async (data: TestFormData) => {
    try {
      if (currentTestId) {
        await updateTest(currentTestId, { ...data, status: 'open' });
      } else {
        await createTest({ ...data, status: 'open' });
      }
      await fetchData();
      setOpenDialog(false);
    } catch (error) {
      console.error("Failed to save test", error);
      throw error;
    }
  };

  const isLocked = (dateStr?: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return date > new Date();
  };

  const stripMarkdown = (md: string) => {
    if (!md) return "";
    return md.replace(/[#_*~`>]/g, "").substring(0, 150) + (md.length > 150 ? "..." : "");
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <CircularProgress size={60} thickness={4} sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 6 }, minHeight: '100vh' }}>

      {/* Header Section */}
      <Box sx={{ mb: 6, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 3 }}>
        <Box>
          <Typography variant="overline" color="primary" sx={{ fontWeight: 800, letterSpacing: 2, display: 'block', mb: 1 }}>
            {translation("tests.title") || "TESZTEK ÉS VIZSGÁK"}
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 900, background: 'linear-gradient(45deg, #fff, #9ca3af)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Kiadott Tesztek
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1, maxWidth: 600 }}>
            Itt találod a tanulási modulokhoz kiadott felmérőket és vizsgákat. Kezeld őket egyszerűen.
          </Typography>
        </Box>
        {(hasRole('admin') || hasRole('teacher')) && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            size="large"
            sx={{
              borderRadius: '12px',
              px: 4,
              py: 1.5,
              fontWeight: 'bold',
              boxShadow: '0 4px 14px 0 rgba(96, 165, 250, 0.39)',
              textTransform: 'none',
              fontSize: '1rem'
            }}
          >
            Új teszt létrehozása
          </Button>
        )}
      </Box>

      {/* Grid of Tests */}
      <Grid container spacing={4}>
        {tests.map((test, index) => {
          const courseName = courses.find((c) => c.id === test.course_id)?.title || "Ismeretlen modul";
          const locked = isLocked(test.open_date);

          return (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={test.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                whileHover={{ y: -8, scale: 1.02 }}
                style={{ height: '100%' }}
              >
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: 'rgba(17, 25, 31, 0.6)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid',
                    borderColor: 'rgba(255,255,255,0.05)',
                    borderRadius: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    opacity: test.is_visible ? 1 : 0.6,
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                      '& .action-buttons': { opacity: 1, transform: 'translateY(0)' }
                    }
                  }}
                >
                  {/* Glass Top Gradient */}
                  <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: locked ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }} />

                  <CardContent sx={{ p: 4, flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        <Chip
                          label={courseName}
                          size="small"
                          sx={{ bgcolor: 'rgba(96, 165, 250, 0.1)', color: 'primary.main', fontWeight: 600, borderRadius: 1 }}
                        />
                        {test.group_id && (
                          <Chip
                            label={`Tanterem: ${groups.find(g => g.id === test.group_id)?.name || 'Ismeretlen'}`}
                            size="small"
                            sx={{ bgcolor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', fontWeight: 600, borderRadius: 1 }}
                          />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                          icon={test.is_visible ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                          label={test.is_visible ? "Látható" : "Rejtett"}
                          size="small"
                          sx={{ bgcolor: 'transparent', border: '1px solid', borderColor: test.is_visible ? 'success.main' : 'text.secondary', color: test.is_visible ? 'success.main' : 'text.secondary' }}
                        />
                        {locked && (
                          <Chip
                            icon={<LockIcon fontSize="small" />}
                            label="Zárva"
                            size="small"
                            sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', color: 'warning.main', border: '1px solid', borderColor: 'warning.main' }}
                          />
                        )}
                      </Box>
                    </Box>

                    <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2, color: '#fff', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <TerminalIcon color="primary" />
                      {test.title}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, minHeight: 60, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {stripMarkdown(test.description) || "Nincs megadva leírás."}
                    </Typography>

                    {test.open_date && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'auto', p: 1.5, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                          {locked ? "NYITÁS:" : "NYITVA:"}
                        </Typography>
                        <Typography variant="caption" color={locked ? "warning.main" : "success.main"} sx={{ fontWeight: 'bold' }}>
                          {new Date(test.open_date).toLocaleString()}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>

                  {/* Actions overlay */}
                  <Box
                    className="action-buttons"
                    sx={{
                      p: 2,
                      pt: 0,
                      display: 'flex',
                      gap: 1.5,
                      opacity: { xs: 1, md: 0 },
                      transform: { xs: 'none', md: 'translateY(10px)' },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {(hasRole('admin') || hasRole('teacher')) && (
                      <Button
                        fullWidth
                        variant="outlined"
                        color="inherit"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenEdit(test)}
                        sx={{ borderRadius: 2, borderColor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.2)' } }}
                      >
                        Szerkesztés
                      </Button>
                    )}
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      disabled={locked || !test.is_visible}
                      onClick={() => navigate(`/tests/${test.id}`)}
                      sx={{ borderRadius: 2, fontWeight: 'bold' }}
                    >
                      {locked ? "Zárolva" : "Megnyitás"}
                    </Button>
                  </Box>
                </Card>
              </motion.div>
            </Grid>
          );
        })}
      </Grid>

      {tests.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Box sx={{ textAlign: 'center', py: 12, bgcolor: 'rgba(17,25,31,0.4)', borderRadius: 4, mt: 4, border: '1px dashed', borderColor: 'rgba(255,255,255,0.1)' }}>
            <TerminalIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
            <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 'bold', mb: 2 }}>Nincsenek tesztek</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>Kezdd el a tanulók értékelését egy új teszt létrehozásával.</Typography>
            <Button variant="outlined" color="primary" startIcon={<AddIcon />} onClick={handleOpenCreate}>
              Első teszt létrehozása
            </Button>
          </Box>
        </motion.div>
      )}

      {/* New Wizard Dialog */}
      <AddTestDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSubmit={handleSave}
        courses={courses}
        groups={groups}
        initialData={currentTest}
      />
    </Box>
  );
};

export default TestList;
