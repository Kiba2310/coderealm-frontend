import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

import TerminalIcon from '@mui/icons-material/Terminal';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../contexts/AuthContext';
import type { UserStats, PlatformStats, TrendData, CourseListItem, TestModel, GroupModel, LessonTimeStat } from '../api';
import {
  adminGetUsers,
  adminBanUser,
  adminUnbanUser,
  adminResetProgress,
  adminSetUserRoles,
  adminGetPlatformStats,
  adminGetRegistrationTrend,
  adminGetCompletionTrend,
  adminGetUserLessonTimes,
  getCourses,
  getCourse,
  createCourse,
  adminUpdateCourse,
  adminDeleteCourse,
  getTests,
  createTest,
  updateTest,
  deleteTest,
  getTeacherGroups
} from '../api';
import AddCourseDialog from '../components/AddCourseDialog';
import AddTestDialog, { type TestFormData } from '../components/AddTestDialog';

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
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AdminDashboard: React.FC = () => {
  const { hasRole, user, isInitialized } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  const [users, setUsers] = useState<UserStats[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [regTrend, setRegTrend] = useState<TrendData[]>([]);
  const [compTrend, setCompTrend] = useState<TrendData[]>([]);
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [tests, setTests] = useState<TestModel[]>([]);
  const [groups, setGroups] = useState<GroupModel[]>([]);

  const [loading, setLoading] = useState(true);

  // Dialogs
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseListItem | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<TestFormData | null>(null);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRolesUser, setEditingRolesUser] = useState<UserStats | null>(null);
  const [editingRoles, setEditingRoles] = useState<string[]>([]);

  // Time Stats state
  const [timeStatsDialogOpen, setTimeStatsDialogOpen] = useState(false);
  const [selectedUserForStats, setSelectedUserForStats] = useState<UserStats | null>(null);
  const [userTimeStats, setUserTimeStats] = useState<LessonTimeStat[]>([]);
  const [lessonTitleMap, setLessonTitleMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isInitialized && hasRole('admin')) {
      fetchData();
    } else if (isInitialized && !hasRole('admin')) {
      setLoading(false);
    }
  }, [isInitialized, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [u, p, r, c, crs, t, g] = await Promise.all([
        adminGetUsers().catch(e => { console.error('adminGetUsers error:', e); return []; }),
        adminGetPlatformStats().catch(e => { console.error('adminGetPlatformStats error:', e); return null; }),
        adminGetRegistrationTrend().catch(e => { console.error('adminGetRegistrationTrend error:', e); return []; }),
        adminGetCompletionTrend().catch(e => { console.error('adminGetCompletionTrend error:', e); return []; }),
        getCourses('all').catch(e => { console.error('getCourses error:', e); return []; }),
        getTests().catch(e => { console.error('getTests error:', e); return []; }),
        getTeacherGroups().catch(e => { console.error('getTeacherGroups error:', e); return []; })
      ]);
      setUsers(u || []);
      setStats(p);
      setRegTrend(r || []);
      setCompTrend(c || []);
      setCourses(crs || []);
      setTests(t || []);
      setGroups(g || []);

      // Load lesson titles in background
      const map: Record<string, string> = {};
      await Promise.all((crs || []).map(async (course) => {
        try {
          const detail = await getCourse(course.id);
          detail.chapters.forEach(ch => {
            ch.lessons.forEach(l => {
              map[l.id] = l.title;
            });
          });
        } catch (e) {
          console.error("Failed to fetch course details for title mapping", e);
        }
      }));
      setLessonTitleMap(map);
    } catch (err) {
      console.error('Failed to fetch admin data', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isInitialized) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!hasRole('admin')) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography variant="h4" color="error">Hozzáférés megtagadva</Typography>
        <Typography>Csak adminisztrátorok tekinthetik meg ezt az oldalt.</Typography>
      </Container>
    );
  }

  // User Actions
  const handleBan = async (userId: string, isBanned: boolean) => {
    try {
      if (isBanned) {
        await adminUnbanUser(userId);
      } else {
        await adminBanUser(userId);
      }
      fetchData();
    } catch (err) {
      console.error('Ban action failed', err);
      alert('Hiba történt a tiltás/feloldás során.');
    }
  };

  const handleReset = async (userId: string) => {
    if (!window.confirm('Biztosan törlöd a felhasználó teljes előrehaladását?')) return;
    try {
      await adminResetProgress(userId);
      alert('Haladás sikeresen törölve.');
      fetchData();
    } catch (err) {
      console.error('Reset failed', err);
      alert('Hiba történt a haladás törlésekor.');
    }
  };

  const handleOpenRoleDialog = (user: UserStats) => {
    setEditingRolesUser(user);
    setEditingRoles((user.roles || []).map(r => r.id));
    setRoleDialogOpen(true);
  };

  const handleSaveRoles = async () => {
    if (!editingRolesUser) return;
    try {
      await adminSetUserRoles(editingRolesUser.id, editingRoles);
      setRoleDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to update roles', err);
      alert('Hiba történt a szerepkörök mentésekor.');
    }
  };

  const handleRoleToggle = (roleId: string) => {
    setEditingRoles(prev =>
      prev.includes(roleId) ? prev.filter(r => r !== roleId) : [...prev, roleId]
    );
  };

  const handleOpenTimeStats = async (user: UserStats) => {
    setSelectedUserForStats(user);
    try {
      const stats = await adminGetUserLessonTimes(user.id);
      setUserTimeStats(stats);
      setTimeStatsDialogOpen(true);
    } catch (err) {
      console.error('Failed to load time stats', err);
      alert('Hiba történt a statisztikák betöltésekor.');
    }
  };

  // Course Actions
  const handleSaveCourse = async (data: any) => {
    try {
      if (editingCourse) {
        await adminUpdateCourse(editingCourse.id, data);
      } else {
        await createCourse(data);
      }
      setCourseDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error('Save course failed', err);
      alert('Hiba történt a kurzus mentésekor.');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('Biztosan törlöd ezt a kurzust? Minden fejezete és leckéje elvész!')) return;
    try {
      await adminDeleteCourse(courseId);
      fetchData();
    } catch (err) {
      console.error('Delete course failed', err);
      alert('Hiba történt a kurzus törlésekor.');
    }
  };

  // Test Actions
  const handleOpenCreateTest = () => {
    setEditingTest(null);
    setEditingTestId(null);
    setTestDialogOpen(true);
  };

  const handleOpenEditTest = (test: TestModel) => {
    setEditingTestId(test.id);
    setEditingTest({
      title: test.title,
      description: test.description,
      course_id: test.course_id,
      group_id: (test as any).group_id,
      is_visible: test.is_visible,
      open_date: test.open_date,
      language: test.language || 'python',
      starter_code: test.starter_code || '',
      solution_code: test.solution_code || '',
      test_code: test.test_code || '',
      expected_output: test.expected_output || ''
    });
    setTestDialogOpen(true);
  };

  const handleSaveTest = async (data: TestFormData) => {
    try {
      if (editingTestId) {
        await updateTest(editingTestId, { ...data, status: 'open' });
      } else {
        await createTest({ ...data, status: 'open' });
      }
      setTestDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error('Save test failed', err);
      throw err;
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!window.confirm('Biztosan törlöd ezt a tesztet?')) return;
    try {
      await deleteTest(testId);
      fetchData();
    } catch (err) {
      console.error('Delete test failed', err);
      alert('Hiba történt a teszt törlésekor.');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, pb: 8 }}>
      <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
        Admin Vezérlőpult
      </Typography>

      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, nv) => setTabValue(nv)}>
            <Tab label="Statisztikák" />
            <Tab label="Felhasználók" />
            <Tab label="Kurzusok" />
            <Tab label="Tesztek" />
          </Tabs>
        </Box>

        {/* Statistics Tab */}
        <CustomTabPanel value={tabValue} index={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, height: '80vh', alignItems: 'center' }}>
              <CircularProgress size={60} />
            </Box>
          ) : (
            <Box>
              {stats && (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card elevation={3} sx={{ bgcolor: '#0f172a', border: '1px solid #1e293b' }}>
                      <CardContent>
                        <Typography color="text.secondary" gutterBottom>Összes Felhasználó</Typography>
                        <Typography variant="h4" color="primary.main">{stats.total_users}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card elevation={3} sx={{ bgcolor: '#0f172a', border: '1px solid #1e293b' }}>
                      <CardContent>
                        <Typography color="text.secondary" gutterBottom>Aktív (Ma)</Typography>
                        <Typography variant="h4" color="primary.main">{stats.active_users_today}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card elevation={3} sx={{ bgcolor: '#0f172a', border: '1px solid #1e293b' }}>
                      <CardContent>
                        <Typography color="text.secondary" gutterBottom>Összes Teljesített Lecke</Typography>
                        <Typography variant="h4" color="primary.main">{stats.total_lessons_completed}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card elevation={3} sx={{ bgcolor: '#0f172a', border: '1px solid #1e293b' }}>
                      <CardContent>
                        <Typography color="text.secondary" gutterBottom>Letiltott Felhasználók</Typography>
                        <Typography variant="h4" color="error">{stats.banned_users}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 3, bgcolor: '#0f172a', border: '1px solid #1e293b', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ mb: 3 }}>Regisztrációs Trend (Elmúlt 30 nap)</Typography>
                    <Box sx={{ width: '100%', height: 300 }}>
                      <ResponsiveContainer>
                        <LineChart data={regTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                          <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: 8 }} />
                          <Line type="monotone" dataKey="count" stroke="#00e699" strokeWidth={3} dot={{ r: 4, fill: '#00e699' }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 3, bgcolor: '#0f172a', border: '1px solid #1e293b', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ mb: 3 }}>Lecke Teljesítési Trend (Elmúlt 30 nap)</Typography>
                    <Box sx={{ width: '100%', height: 300 }}>
                      <ResponsiveContainer>
                        <LineChart data={compTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                          <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: 8 }} />
                          <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </CustomTabPanel>

        {/* Users Tab */}
        <CustomTabPanel value={tabValue} index={1}>
          <TableContainer component={Paper} sx={{ bgcolor: '#0f172a' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Becenév</TableCell>
                  <TableCell>Szerepkörök</TableCell>
                  <TableCell>Pontok</TableCell>
                  <TableCell>Állapot</TableCell>
                  <TableCell align="center">Statisztika</TableCell>
                  <TableCell align="right">Műveletek</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.id} sx={{ opacity: u.is_banned ? 0.6 : 1 }}>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.nickname || '-'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                        {(u.roles && u.roles.length > 0) ? (
                          u.roles.map(r => {
                            const roleKey = (r.id || r.name || '').toLowerCase();
                            const isAdmin = roleKey.includes('admin');
                            const isTeacher = roleKey.includes('teach') || roleKey.includes('tanár');
                            const displayName = isAdmin ? 'Adminisztrátor' : isTeacher ? 'Tanár' : 'Diák';
                            
                            return (
                              <Chip
                                key={r.id || r.name}
                                label={displayName}
                                size="small"
                                sx={{
                                  bgcolor: isAdmin ? 'rgba(239, 68, 68, 0.15)' : isTeacher ? 'rgba(59, 130, 246, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                                  color: isAdmin ? '#f87171' : isTeacher ? '#60a5fa' : '#94a3b8',
                                  border: '1px solid currentColor',
                                  fontWeight: 600
                                }}
                              />
                            );
                          })
                        ) : (
                          <Typography variant="caption" sx={{ color: '#64748b', fontStyle: 'italic' }}>
                            Nincs szerepkör
                          </Typography>
                        )}
                        <IconButton size="small" onClick={() => handleOpenRoleDialog(u)} sx={{ ml: 0.5 }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>{u.points}</TableCell>
                    <TableCell>
                      {u.is_banned ? (
                        <Chip label="Letiltva" color="error" size="small" />
                      ) : (
                        <Chip label="Aktív" color="success" size="small" />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleOpenTimeStats(u)} title="Statisztikák" sx={{ color: '#fbbf24' }}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        color="warning"
                        onClick={() => handleReset(u.id)}
                        sx={{ mr: 1 }}
                      >
                        Reset
                      </Button>
                      <Button
                        size="small"
                        variant={u.is_banned ? "contained" : "outlined"}
                        color={u.is_banned ? "success" : "error"}
                        onClick={() => handleBan(u.id, u.is_banned)}
                      >
                        {u.is_banned ? 'Feloldás' : 'Tiltás'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CustomTabPanel>

        {/* Courses Management Tab */}
        <CustomTabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5">Kurzusok kezelése</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingCourse(null);
                setCourseDialogOpen(true);
              }}
            >
              Új Kurzus
            </Button>
          </Box>
          <TableContainer component={Paper} sx={{ bgcolor: '#0f172a' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Cím</TableCell>
                  <TableCell>Nyelv</TableCell>
                  <TableCell>Leckék</TableCell>
                  <TableCell align="right">Műveletek</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {courses.map(course => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{course.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {course.chapters_count || 0} fejezet
                      </Typography>
                    </TableCell>
                    <TableCell>{course.language || 'Általános'}</TableCell>
                    <TableCell>{course.tasks_count || 0}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(`/courses/${course.id}`)}
                        sx={{ mr: 1 }}
                      >
                        Tartalom szerkesztése
                      </Button>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => {
                          setEditingCourse(course);
                          setCourseDialogOpen(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteCourse(course.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {courses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      Nincsenek elérhető kurzusok. Hozz létre egyet!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CustomTabPanel>

        {/* Tests Management Tab */}
        <CustomTabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5">Tesztek kezelése</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateTest}
            >
              Új Teszt
            </Button>
          </Box>
          <TableContainer component={Paper} sx={{ bgcolor: '#0f172a' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Cím</TableCell>
                  <TableCell>Modul</TableCell>
                  <TableCell>Tanterem</TableCell>
                  <TableCell>Láthatóság</TableCell>
                  <TableCell>Nyitás</TableCell>
                  <TableCell align="right">Műveletek</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tests.map(test => {
                  const courseName = courses.find(c => c.id === test.course_id)?.title || '-';
                  const groupName = test.group_id ? groups.find(g => g.id === test.group_id)?.name || 'Ismeretlen' : 'Globális';
                  return (
                    <TableRow key={test.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TerminalIcon fontSize="small" color="primary" />
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{test.title}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={courseName} size="small" sx={{ bgcolor: 'rgba(96,165,250,0.1)', color: 'primary.main' }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={groupName} size="small" sx={{ bgcolor: test.group_id ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.05)', color: test.group_id ? '#8b5cf6' : 'text.secondary' }} />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={test.is_visible ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                          label={test.is_visible ? 'Látható' : 'Rejtett'}
                          size="small"
                          color={test.is_visible ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {test.open_date ? new Date(test.open_date).toLocaleDateString() : 'Azonnal'}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => navigate(`/tests/${test.id}`)}
                          sx={{ mr: 1 }}
                        >
                          Megnyitás
                        </Button>
                        <IconButton size="small" color="primary" onClick={() => handleOpenEditTest(test)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteTest(test.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {tests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      Nincsenek tesztek. Hozz létre egyet!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CustomTabPanel>
      </Box>

      {courseDialogOpen && (
        <AddCourseDialog
          open={courseDialogOpen}
          onClose={() => setCourseDialogOpen(false)}
          onSave={handleSaveCourse}
          initialData={editingCourse}
        />
      )}

      {testDialogOpen && (
        <AddTestDialog
          open={testDialogOpen}
          onClose={() => setTestDialogOpen(false)}
          onSubmit={handleSaveTest}
          courses={courses}
          groups={groups}
          initialData={editingTest}
        />
      )}

      {/* Role Editor Dialog */}
      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)}>
        <DialogTitle>Szerepkörök szerkesztése</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Felhasználó: {editingRolesUser?.email}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {[
              { id: 'admin', label: 'Adminisztrátor' },
              { id: 'teacher', label: 'Tanár' },
              { id: 'student', label: 'Diák' }
            ].map(({ id, label }) => (
              <FormControlLabel
                key={id}
                control={
                  <Checkbox
                    checked={editingRoles.includes(id)}
                    onChange={() => handleRoleToggle(id)}
                  />
                }
                label={label}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>Mégse</Button>
          <Button variant="contained" onClick={handleSaveRoles}>Mentés</Button>
        </DialogActions>
      </Dialog>

      {/* Time Stats Dialog */}
      <Dialog open={timeStatsDialogOpen} onClose={() => setTimeStatsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0f172a', color: '#f8fafc' }}>
          {selectedUserForStats?.nickname || selectedUserForStats?.email} - Lecke Idők
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#0f172a', color: '#f8fafc', mt: 2 }}>
          {userTimeStats.length === 0 ? (
            <Typography>Nincsenek még időadatok ehhez a felhasználóhoz.</Typography>
          ) : (
            <TableContainer component={Paper} sx={{ bgcolor: '#1e293b' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#94a3b8' }}>Lecke Neve</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8' }}>Eltöltött idő</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userTimeStats.map(stat => (
                    <TableRow key={stat.lesson_id}>
                      <TableCell sx={{ color: '#f8fafc' }}>{lessonTitleMap[stat.lesson_id] || stat.lesson_id}</TableCell>
                      <TableCell align="right" sx={{ color: '#f8fafc' }}>
                        {stat.time_spent_seconds < 60
                          ? `${stat.time_spent_seconds} mp`
                          : `${Math.floor(stat.time_spent_seconds / 60)} perc ${stat.time_spent_seconds % 60} mp`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#0f172a' }}>
          <Button onClick={() => setTimeStatsDialogOpen(false)}>Bezárás</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
