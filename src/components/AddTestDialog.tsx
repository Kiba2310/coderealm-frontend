import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Typography, IconButton,
  Stepper, Step, StepLabel, FormControlLabel, Switch, Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TerminalIcon from '@mui/icons-material/Terminal';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MDEditor from '@uiw/react-md-editor';
import Editor from '@monaco-editor/react';
import { Autocomplete } from '@mui/material';
import type { CourseListItem, GroupModel } from '../api';

export interface TestFormData {
  title: string;
  course_id: string;
  group_id?: string;
  description: string;
  is_visible: boolean;
  open_date?: string;
  language: string;
  starter_code: string;
  solution_code: string;
  test_code: string;
  expected_output: string;
}

interface AddTestDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TestFormData) => Promise<void>;
  courses: CourseListItem[];
  groups?: GroupModel[];
  initialData?: TestFormData | null;
}

const STEPS = ['Alap adatok', 'Tartalom és Kód', 'Összefoglalás'];
const LANGUAGES = ['python', 'javascript', 'go'];

const AddTestDialog: React.FC<AddTestDialogProps> = ({ open, onClose, onSubmit, courses, groups = [], initialData }) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [title, setTitle] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<CourseListItem | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupModel | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [openDate, setOpenDate] = useState('');

  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('python');
  const [starterCode, setStarterCode] = useState('');
  const [solutionCode, setSolutionCode] = useState('');
  const [testCode, setTestCode] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');

  useEffect(() => {
    if (open) {
      setStep(0);
      setError('');
      if (initialData) {
        setTitle(initialData.title);
        setSelectedCourse(courses.find(c => c.id === initialData.course_id) || null);
        setSelectedGroup(groups.find(g => g.id === initialData.group_id) || null);
        setIsVisible(initialData.is_visible);
        setOpenDate(initialData.open_date ? new Date(initialData.open_date).toISOString().slice(0, 16) : '');
        setDescription(initialData.description);
        setLanguage(initialData.language || 'python');
        setStarterCode(initialData.starter_code || '');
        setSolutionCode(initialData.solution_code || '');
        setTestCode(initialData.test_code || '');
        setExpectedOutput(initialData.expected_output || '');
      } else {
        setTitle('');
        setSelectedCourse(null);
        setSelectedGroup(null);
        setIsVisible(false);
        setOpenDate('');
        setDescription('');
        setLanguage('python');
        setStarterCode('');
        setSolutionCode('');
        setTestCode('');
        setExpectedOutput('');
      }
    }
  }, [open, initialData, courses, groups]);

  const validateStep = (currentStep: number) => {
    if (currentStep === 0) {
      if (!title.trim() || !selectedCourse) return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep(s => s + 1);
  };

  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const data: TestFormData = {
        title: title.trim(),
        course_id: selectedCourse!.id,
        group_id: selectedGroup?.id,
        is_visible: isVisible,
        open_date: openDate ? new Date(openDate).toISOString() : undefined,
        description: description.trim(),
        language,
        starter_code: starterCode,
        solution_code: solutionCode,
        test_code: testCode,
        expected_output: expectedOutput,
      };
      await onSubmit(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Hiba a mentés során.');
      setStep(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg" fullWidth
      sx={{ '& .MuiDialog-paper': { bgcolor: '#0f172a', border: '1px solid #1e293b', borderRadius: 4, minHeight: 600 } }}
    >
      {/* Header */}
      <DialogTitle sx={{ pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <TerminalIcon color="primary" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {initialData ? 'Teszt szerkesztése' : 'Új teszt létrehozása'}
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'text.secondary' }} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Stepper activeStep={step} alternativeLabel sx={{ pt: 2, pb: 1, '& .MuiStepIcon-root.Mui-active': { color: 'primary.main' }, '& .MuiStepIcon-root.Mui-completed': { color: 'primary.dark' } }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </DialogTitle>

      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* ── STEP 0: Alap adatok ── */}
        {step === 0 && (
          <Box>
            <TextField
              autoFocus
              margin="dense"
              fullWidth
              label="Teszt neve"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="pl. Python alapszintű vizsga"
              sx={{ mb: 2 }}
            />

            <Autocomplete
              options={courses}
              getOptionLabel={(option) => option.title}
              value={selectedCourse}
              onChange={(_, newValue) => setSelectedCourse(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Tanulási modul (Kurzus)" margin="dense" fullWidth sx={{ mb: 2 }} />
              )}
            />

            <Autocomplete
              options={groups}
              getOptionLabel={(option) => option.name}
              value={selectedGroup}
              onChange={(_, newValue) => setSelectedGroup(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Tanterem (Opcionális)" placeholder="Válassz tantermet" margin="dense" fullWidth sx={{ mb: 2 }} />
              )}
            />

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, mt: 1 }}>
              <FormControlLabel
                control={<Switch checked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} color="primary" />}
                label="Látható a diákok számára"
              />
            </Box>

            <TextField
              label="Nyitási dátum (Opcionális)"
              type="datetime-local"
              fullWidth
              margin="dense"
              value={openDate}
              onChange={(e) => setOpenDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true, sx: { color: 'text.secondary' } } }}
              helperText="Ha beállítod, a diákok addig nem tudják megnyitni a tesztet."
              sx={{ mb: 1 }}
            />
          </Box>
        )}

        {/* ── STEP 1: Tartalom és Kód ── */}
        {step === 1 && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
              Leírás (Markdown)
            </Typography>
            <Box data-color-mode="dark" sx={{ mb: 3 }}>
              <MDEditor
                value={description}
                onChange={(val) => setDescription(val || "")}
                height={200}
              />
            </Box>

            <Autocomplete
              options={LANGUAGES}
              value={language}
              onChange={(_, newValue) => setLanguage(newValue || 'python')}
              renderInput={(params) => (
                <TextField {...params} label="Programozási nyelv" margin="dense" fullWidth sx={{ mb: 3 }} />
              )}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
                  Kezdőkód (Starter Code)
                </Typography>
                <Box sx={{ height: 200, border: "1px solid", borderColor: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
                  <Editor height="100%" language={language} theme="vs-dark" value={starterCode} onChange={(val) => setStarterCode(val || "")} options={{ minimap: { enabled: false } }} />
                </Box>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
                  Megoldás (Solution Code)
                </Typography>
                <Box sx={{ height: 200, border: "1px solid", borderColor: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
                  <Editor height="100%" language={language} theme="vs-dark" value={solutionCode} onChange={(val) => setSolutionCode(val || "")} options={{ minimap: { enabled: false } }} />
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 1 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
                  Teszt kód (Test Code)
                </Typography>
                <Box sx={{ height: 200, border: "1px solid", borderColor: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
                  <Editor height="100%" language={language} theme="vs-dark" value={testCode} onChange={(val) => setTestCode(val || "")} options={{ minimap: { enabled: false } }} />
                </Box>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
                  Várt kimenet (Expected Output)
                </Typography>
                <Box sx={{ height: 200, border: "1px solid", borderColor: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
                  <Editor height="100%" language="text" theme="vs-dark" value={expectedOutput} onChange={(val) => setExpectedOutput(val || "")} options={{ minimap: { enabled: false } }} />
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* ── STEP 2: Összefoglalás ── */}
        {step === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, textAlign: 'center' }}>
            <TerminalIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>{title}</Typography>
            <Typography color="text.secondary" sx={{ mb: 1 }}>
              Modul: {selectedCourse?.title}
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mt: 2, mb: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
              {isVisible ? (
                <Alert severity="success" sx={{ py: 0 }}>Látható a diákok számára</Alert>
              ) : (
                <Alert severity="warning" sx={{ py: 0 }}>Rejtett a diákok elől</Alert>
              )}
              {openDate && (
                <Alert severity="info" sx={{ py: 0 }}>Nyitás: {new Date(openDate).toLocaleString()}</Alert>
              )}
              <Alert severity="info" sx={{ py: 0 }}>Nyelv: {language}</Alert>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 600 }}>
              Nézd át az adatokat! Ha minden rendben van, kattints a Mentés gombra.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none' }}>
          Mégsem
        </Button>
        <Box sx={{ flex: 1 }} />
        {step > 0 && (
          <Button onClick={handleBack} startIcon={<NavigateBeforeIcon />} sx={{ textTransform: 'none' }}>
            Vissza
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button onClick={handleNext} variant="contained" endIcon={<NavigateNextIcon />} disabled={!validateStep(step)} sx={{ textTransform: 'none', fontWeight: 600, color: '#000' }}>
            Tovább
          </Button>
        ) : (
          <Button onClick={handleSubmit} variant="contained" color="primary" disabled={loading} startIcon={<CheckCircleIcon />} sx={{ textTransform: 'none', fontWeight: 700, color: '#000', px: 3 }}>
            {loading ? 'Mentés...' : (initialData ? 'Módosítások mentése' : 'Teszt létrehozása')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AddTestDialog;
