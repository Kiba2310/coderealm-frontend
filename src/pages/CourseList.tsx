import React, { useEffect, useState } from "react";
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Box,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  LinearProgress,
  Chip
} from "@mui/material";
import { motion } from 'framer-motion';
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MDEditor from "@uiw/react-md-editor";
import { getCourses, createCourse, getLanguages } from "../api";
import type { CourseListItem } from "../api";

const CourseList: React.FC = () => {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [openDialog, setOpenDialog] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newLanguage, setNewLanguage] = useState("python");
  const [newCategory, setNewCategory] = useState("");
  const [newDifficulty, setNewDifficulty] = useState("Kezdő");
  const [isCreating, setIsCreating] = useState(false);

  // Filter & Search states
  const [activeFilter, setActiveFilter] = useState("Mind");
  const [searchQuery, setSearchQuery] = useState("");


  const navigate = useNavigate();
  const { t: translation } = useTranslation();

  const fetchCourses = async () => {
    try {
      const [data, langs] = await Promise.all([getCourses(), getLanguages()]);
      setCourses(data);
      setAvailableLanguages(langs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [translation]);

  const handleCreateCourse = async () => {
    try {
      setIsCreating(true);
      const newCourse = await createCourse({
        title: newTitle,
        description: newDescription,
        language: newLanguage,
        category: newCategory,
        difficulty: newDifficulty,
      });
      setCourses([...courses, newCourse]);
      setOpenDialog(false);
      setNewTitle("");
      setNewDescription("");
      setNewLanguage("python");
      setNewCategory("");
      setNewDifficulty("Kezdő");
    } catch (error) {
      console.error("Failed to create course", error);
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, pt: 8, maxWidth: 1200, width: "100%" }}>
      <Typography variant="overline" color="primary" sx={{ fontWeight: 'bold', letterSpacing: 2 }}>
        KÉPZÉSI ÚTVONALAK
      </Typography>
      <Typography variant="h2" sx={{ mt: 1, mb: 2 }}>
        Tanulási modulok
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 6, maxWidth: 600 }}>
        Minden nyelv fejezetekre bomlik, a fejezetek pedig elméleti leckékre, futtatott kódfeladatokra, feleletválasztós kvízekre és kódkiegészítésre.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          label="Keresés név szerint"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ minWidth: 300 }}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 6, flexWrap: 'wrap' }}>
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
                color: isActive ? 'primary.main' : 'text.secondary',
                borderColor: isActive ? 'primary.main' : 'divider',
                px: 1,
                py: 2,
                cursor: 'pointer',
                borderRadius: 2
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
            return c.category === activeFilter || c.difficulty === activeFilter;
          });

          if (filteredCourses.length === 0) {
            return (
              <Grid size={{ xs: 12 }} sx={{ mt: 4 }}>
                <Box sx={{ p: 4, color: '#64748b', bgcolor: 'rgba(0, 230, 153, 0.05)', border: '1px dashed', borderColor: 'primary.main', borderRadius: 3 }}>
                  <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>
                    Nincs a kért feltételeknek megfelelő kurzus.
                  </Typography>
                  <Typography variant="body2">
                    Kérlek változtass a keresési feltételeken.
                  </Typography>
                </Box>
              </Grid>
            );
          }

          return filteredCourses.map((course, index) => {
            const tag = course.difficulty || course.category || "Haladó";
            const chaptersCount = course.chapters_count || 0;
            const tasksCount = course.tasks_count || 0;
            const progress = 0;

            return (
              <Grid size={{ xs: 12, md: 6 }} key={course.id}>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -4 }} style={{ height: '100%' }}>
                  <Card
                    onClick={() => navigate(`/courses/${course.id}`)}
                    sx={{ p: 2, height: '100%', cursor: 'pointer', transition: 'border-color 0.2s', '&:hover': { borderColor: 'primary.main' } }}
                  >
                    <CardContent sx={{ p: 1, pb: '8px !important' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h5">{course.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{tag}</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 4, minHeight: 40 }}>
                        {course.description}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {chaptersCount} fejezet • {tasksCount} feladat
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {progress > 0 ? `${progress}%` : ''}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                          bgcolor: '#1e293b',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: progress > 50 ? 'primary.main' : (progress > 0 ? '#fbbf24' : 'transparent'),
                            backgroundImage: progress > 50 ? 'linear-gradient(90deg, #fbbf24, #00e699)' : 'none'
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

      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: "fixed", bottom: 32, right: 32 }}
        onClick={() => setOpenDialog(true)}
      >
        <AddIcon />
      </Fab>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>{translation("admin.createCourse")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={translation("admin.title")}
            type="text"
            fullWidth
            variant="outlined"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Autocomplete
            options={availableLanguages}
            value={newLanguage}
            onChange={(_, newValue) => setNewLanguage(newValue || "")}
            freeSolo
            renderInput={(params) => (
              <TextField
                {...params}
                margin="dense"
                label={translation("admin.language")}
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                placeholder="e.g. python, go, javascript"
              />
            )}
          />
          <TextField
            margin="dense"
            label="Kategória (pl. Backend, Adatbázis)"
            variant="outlined"
            fullWidth
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Autocomplete
            options={["Kezdő", "Haladó", "Profi"]}
            value={newDifficulty}
            onChange={(_, newValue) => setNewDifficulty(newValue || "Kezdő")}
            freeSolo
            renderInput={(params) => (
              <TextField
                {...params}
                margin="dense"
                label="Nehézség (Difficulty)"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
              />
            )}
          />
          <Typography
            variant="subtitle2"
            sx={{ mb: 1, color: "text.secondary" }}
          >
            {translation("admin.description")}
          </Typography>
          <Box data-color-mode="dark">
            <MDEditor
              value={newDescription}
              onChange={(val) => setNewDescription(val || "")}
              height={300}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={isCreating}>
            {translation("admin.cancel")}
          </Button>
          <Button
            onClick={handleCreateCourse}
            variant="contained"
            disabled={!newTitle || isCreating}
          >
            {isCreating ? (
              <CircularProgress size={24} />
            ) : (
              translation("admin.create")
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CourseList;
