import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Typography, IconButton,
  Stepper, Step, StepLabel,
  Alert, Tooltip, Tabs, Tab
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CodeIcon from '@mui/icons-material/Code';
import QuizIcon from '@mui/icons-material/Quiz';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DescriptionIcon from '@mui/icons-material/Description';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import MDEditor from '@uiw/react-md-editor';
import Editor from '@monaco-editor/react';
import { Autocomplete } from '@mui/material';
import { uploadDocumentFile } from '../api';

interface Option {
  id: string;
  text: string;
  is_correct: boolean;
}

interface AddLessonDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: LessonFormData) => Promise<void>;
  defaultOrder: number;
  chapterTitle: string;
  availableLanguages: string[];
}

export interface LessonFormData {
  title: string;
  description: string;
  order: number;
  type: string;
  language?: string;
  starter_code?: string;
  solution_code?: string;
  test_code?: string;
  expected_output?: string;
  document_url?: string;
  options?: { text: string; is_correct: boolean }[];
}

const LESSON_TYPES = [
  { value: 'multiple_choice', label: 'Feleletválasztós', icon: <QuizIcon />, desc: 'Több válaszlehetőség, egy helyes' },
  { value: 'code_challenge', label: 'Kód feladat', icon: <CodeIcon />, desc: 'Programozási feladat kódszerkesztővel' },
  { value: 'theory', label: 'Elmélet', icon: <AutoStoriesIcon />, desc: 'Olvasmány, magyarázat, leírás' },
  { value: 'document', label: 'Dokumentum', icon: <DescriptionIcon />, desc: 'PDF, Word vagy PPT feltöltése' },
];

const STEPS = ['Alap adatok', 'Tartalom', 'Ellenőrzés'];

const defaultOptions = (): Option[] => [
  { id: '1', text: '', is_correct: true },
  { id: '2', text: '', is_correct: false },
];

const AddLessonDialog: React.FC<AddLessonDialogProps> = ({
  open, onClose, onSubmit, defaultOrder, chapterTitle, availableLanguages,
}) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1
  const [title, setTitle] = useState('');
  const [type, setType] = useState('multiple_choice');
  const [order, setOrder] = useState(defaultOrder);
  const [language, setLanguage] = useState('python');

  // Step 2 — description
  const [descriptionType, setDescriptionType] = useState<'text' | 'document'>('text');
  const [description, setDescription] = useState('');

  // Step 2 — code challenge
  const [starterCode, setStarterCode] = useState('');
  const [solutionCode, setSolutionCode] = useState('');
  const [testCode, setTestCode] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');

  // Step 2 — multiple choice
  const [options, setOptions] = useState<Option[]>(defaultOptions());

  // Step 2 — document
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      setStep(0);
      setTitle('');
      setType('multiple_choice');
      setOrder(defaultOrder);
      setLanguage('python');
      setDescriptionType('text');
      setDescription('');
      setStarterCode('');
      setSolutionCode('');
      setTestCode('');
      setExpectedOutput('');
      setOptions(defaultOptions());
      setDocumentFile(null);
      setError('');
    }
  }, [open, defaultOrder]);

  const canGoNext = () => {
    if (step === 0) return title.trim().length > 0;
    if (step === 1) {
      if (descriptionType === 'text' && !description.trim()) return false;
      if (descriptionType === 'document' && !documentFile) return false;
      
      if (type === 'multiple_choice') {
        const filled = options.filter(o => o.text.trim());
        return filled.length >= 2 && options.some(o => o.is_correct && o.text.trim());
      }
      if (type === 'code_challenge') return starterCode.trim().length > 0;
      return true;
    }
    return true;
  };

  const handleAddOption = () => setOptions(prev => [
    ...prev, { id: Date.now().toString(), text: '', is_correct: false }
  ]);

  const handleRemoveOption = (id: string) =>
    setOptions(prev => prev.filter(o => o.id !== id));

  const handleOptionChange = (id: string, field: 'text' | 'is_correct', value: any) =>
    setOptions(prev => prev.map(o => o.id === id ? { ...o, [field]: value } : o));

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      let uploadedUrl = '';
      if (descriptionType === 'document' && documentFile) {
        const res = await uploadDocumentFile(documentFile);
        uploadedUrl = res.url;
      }

      const finalDescription = descriptionType === 'text' ? description.trim() : '';

      const data: LessonFormData = {
        title: title.trim(),
        description: finalDescription,
        order,
        type,
        ...(type === 'code_challenge' && { language, starter_code: starterCode, solution_code: solutionCode, test_code: testCode, expected_output: expectedOutput }),
        ...(type === 'multiple_choice' && { options: options.filter(o => o.text.trim()).map(({ text, is_correct }) => ({ text, is_correct })) }),
        ...(descriptionType === 'document' && { document_url: uploadedUrl }),
      };
      await onSubmit(data);
      onClose();
    } catch (err: any) {
      setError(err?.response?.status === 403 ? 'Nincs jogosultságod!' : 'Hiba a létrehozáskor.');
    } finally {
      setLoading(false);
    }
  };

  const typeInfo = LESSON_TYPES.find(t => t.value === type)!;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={step === 2 ? "md" : "xl"} fullWidth
      sx={{ '& .MuiDialog-paper': { bgcolor: '#0f172a', border: '1px solid #1e293b', borderRadius: 4, minHeight: 600 } }}
    >
      {/* Header */}
      <DialogTitle sx={{ pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <Box sx={{ color: 'primary.main', display: 'flex' }}>
            {typeInfo.icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Új lecke</Typography>
            <Typography variant="caption" color="text.secondary">
              {chapterTitle} fejezet
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'text.secondary' }} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={step} sx={{ mt: 2, mb: 1 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel sx={{
                '& .MuiStepLabel-label': { color: 'text.secondary', fontSize: '0.8rem' },
                '& .MuiStepLabel-label.Mui-active': { color: '#fff', fontWeight: 600 },
                '& .MuiStepLabel-label.Mui-completed': { color: 'primary.main' },
              }}>
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </DialogTitle>

      <DialogContent>
        {/* ── STEP 0: Alap adatok ── */}
        {step === 0 && (
          <Box>
            <TextField
              autoFocus
              margin="dense"
              fullWidth
              label="Lecke neve"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="pl. Mi az a változó?"
              sx={{ mb: 2 }}
            />

            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
              Lecke típusa
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5, mb: 3 }}>
              {LESSON_TYPES.map(lt => (
                <Box
                  key={lt.value}
                  onClick={() => {
                    setType(lt.value);
                    setDescriptionType(lt.value === 'document' ? 'document' : 'text');
                  }}
                  sx={{
                    border: '2px solid',
                    borderColor: type === lt.value ? 'primary.main' : '#1e293b',
                    borderRadius: 2,
                    p: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    bgcolor: type === lt.value ? 'rgba(0,230,153,0.06)' : 'transparent',
                    '&:hover': { borderColor: type === lt.value ? 'primary.main' : '#334155' },
                  }}
                >
                  <Box sx={{ color: type === lt.value ? 'primary.main' : 'text.secondary', mb: 0.5 }}>
                    {lt.icon}
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: type === lt.value ? '#fff' : 'text.secondary' }}>
                    {lt.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{lt.desc}</Typography>
                </Box>
              ))}
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Sorrend"
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                slotProps={{ htmlInput: { min: 1 } }}
                size="small"
                sx={{ width: 120 }}
              />
              {type === 'code_challenge' && (
                <Autocomplete
                  options={availableLanguages.length ? availableLanguages : ['python', 'javascript', 'go', 'java', 'c', 'cpp']}
                  value={language}
                  onChange={(_, v) => setLanguage(v || 'python')}
                  freeSolo
                  sx={{ flex: 1 }}
                  renderInput={(params) => (
                    <TextField {...params} size="small" label="Programozási nyelv" />
                  )}
                />
              )}
            </Box>
          </Box>
        )}

        {/* ── STEP 1: Tartalom ── */}
        {step === 1 && (
          <Box>
            {type !== 'document' && (
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs 
                  value={descriptionType} 
                  onChange={(_, v) => setDescriptionType(v)} 
                  textColor="primary" 
                  indicatorColor="primary" 
                  sx={{ minHeight: 40 }}
                >
                  <Tab label="Szöveges leírás" value="text" sx={{ textTransform: 'none', fontWeight: 600, minHeight: 40 }} />
                  <Tab label="Dokumentum feltöltés" value="document" sx={{ textTransform: 'none', fontWeight: 600, minHeight: 40 }} />
                </Tabs>
              </Box>
            )}
            
            {type === 'document' && (
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Dokumentum feltöltése <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
            )}

            {descriptionType === 'text' && (
              <Box data-color-mode="dark" sx={{ mb: 3, '& .w-md-editor': { borderRadius: '8px !important' } }}>
                <MDEditor value={description} onChange={(v) => setDescription(v || '')} height={180} />
              </Box>
            )}

            {descriptionType === 'document' && (
              <Box sx={{ mb: 3 }}>
                <Box
                  sx={{
                    display: 'block',
                    border: '2px dashed #334155',
                    borderRadius: 2,
                    p: 4,
                    textAlign: 'center',
                    bgcolor: 'rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(0,230,153,0.02)' }
                  }}
                  component="label"
                >
                  <input
                    type="file"
                    hidden
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setDocumentFile(e.target.files[0]);
                      }
                    }}
                  />
                  {documentFile ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <AttachFileIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                      <Typography variant="body1" sx={{ color: '#fff', fontWeight: 600 }}>
                        {documentFile.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Kattints ide a cseréhez
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <CloudUploadIcon sx={{ fontSize: 48, color: '#64748b' }} />
                      <Typography variant="body1" color="text.secondary">
                        Kattints ide a fájl kiválasztásához
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Támogatott formátumok: PDF, DOC, DOCX, PPT, PPTX (max 10MB)
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            )}

            {/* Code Challenge fields */}
            {type === 'code_challenge' && (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
                {[
                  { label: 'Kezdő kód (starter_code)', key: 'starter', value: starterCode, setter: setStarterCode, required: true },
                  { label: 'Megoldás kód (solution_code)', key: 'solution', value: solutionCode, setter: setSolutionCode },
                  { label: 'Teszt kód (test_code)', key: 'test', value: testCode, setter: setTestCode },
                  { label: 'Várható kimenet (expected_output)', key: 'output', value: expectedOutput, setter: setExpectedOutput, lang: 'plaintext' },
                ].map(({ label, key, value, setter, required, lang }) => (
                  <Box key={key}>
                    <Typography variant="caption" color={required ? 'primary.main' : 'text.secondary'} sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>
                      {label}{required && ' *'}
                    </Typography>
                    <Box sx={{ height: 160, border: '1px solid', borderColor: value ? 'primary.main' : '#1e293b', borderRadius: 1, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                      <Editor
                        height="100%"
                        language={lang || language}
                        theme="vs-dark"
                        value={value}
                        onChange={(v) => setter(v || '')}
                        options={{ minimap: { enabled: false }, fontSize: 13, padding: { top: 8 } }}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            )}

            {/* Multiple Choice fields */}
            {type === 'multiple_choice' && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Válaszlehetőségek
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    (minimum 2, jelöld meg a helyes választ)
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {options.map((opt, idx) => (
                    <Box key={opt.id} sx={{
                      display: 'flex', alignItems: 'center', gap: 1,
                      bgcolor: opt.is_correct ? 'rgba(0,230,153,0.05)' : 'transparent',
                      border: '1px solid',
                      borderColor: opt.is_correct ? 'rgba(0,230,153,0.3)' : '#1e293b',
                      borderRadius: 2, p: 1, transition: 'all 0.2s',
                    }}>
                      <Tooltip title={opt.is_correct ? 'Helyes válasz' : 'Jelöld helyesnek'}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            // Toggle - only one correct at a time (for simplicity, allow multiple)
                            handleOptionChange(opt.id, 'is_correct', !opt.is_correct);
                          }}
                          sx={{ color: opt.is_correct ? 'primary.main' : '#334155' }}
                        >
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 20 }}>
                        {idx + 1}.
                      </Typography>
                      <TextField
                        size="small"
                        placeholder={`${idx + 1}. válasz`}
                        value={opt.text}
                        onChange={(e) => handleOptionChange(opt.id, 'text', e.target.value)}
                        fullWidth
                        variant="standard"
                        slotProps={{ input: { disableUnderline: true, sx: { fontSize: '0.95rem' } } }}
                      />
                      {options.length > 2 && (
                        <IconButton size="small" onClick={() => handleRemoveOption(opt.id)}
                          sx={{ color: '#475569', '&:hover': { color: '#ef4444' } }}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  ))}
                </Box>
                <Button startIcon={<AddIcon />} onClick={handleAddOption} size="small"
                  sx={{ mt: 1.5, textTransform: 'none', color: 'text.secondary' }}>
                  Válasz hozzáadása
                </Button>
              </Box>
            )}

            {/* Delete the old document upload area block, because it is now handled above */}
          </Box>
        )}

        {/* ── STEP 2: Összefoglalás ── */}
        {step === 2 && (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Összefoglalás — ellenőrizd a adatokat
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[
                { label: 'Lecke neve', value: title },
                { label: 'Típus', value: typeInfo.label },
                { label: 'Sorrend', value: order },
                ...(type === 'code_challenge' ? [{ label: 'Nyelv', value: language }] : []),
                ...(descriptionType === 'text' ? [{ label: 'Leírás', value: description.length > 80 ? description.slice(0, 80) + '...' : description }] : []),
                ...(descriptionType === 'document' ? [{ label: 'Fájl', value: documentFile?.name || '—' }] : []),
                ...(type === 'multiple_choice' ? [{
                  label: 'Válaszok',
                  value: `${options.filter(o => o.text.trim()).length} válasz, ${options.filter(o => o.is_correct && o.text.trim()).length} helyes`,
                }] : []),
                ...(type === 'code_challenge' ? [{ label: 'Kezdő kód', value: starterCode ? `${starterCode.split('\n').length} sor` : '—' }] : []),
              ].map(({ label, value }) => (
                <Box key={label} sx={{ display: 'flex', gap: 2, p: 1.5, bgcolor: '#0a1520', borderRadius: 1.5, border: '1px solid #1e293b' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ minWidth: 120, fontWeight: 600 }}>
                    {label}
                  </Typography>
                  <Typography variant="caption" color="text.primary">
                    {String(value)}
                  </Typography>
                </Box>
              ))}
            </Box>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </Box>
        )}
      </DialogContent>

      {/* Footer */}
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none', mr: 'auto' }}>
          Mégse
        </Button>
        {step > 0 && (
          <Button
            onClick={() => setStep(s => s - 1)}
            startIcon={<NavigateBeforeIcon />}
            sx={{ textTransform: 'none' }}
          >
            Vissza
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep(s => s + 1)}
            variant="contained"
            disabled={!canGoNext()}
            endIcon={<NavigateNextIcon />}
            sx={{ textTransform: 'none', fontWeight: 700, color: '#000' }}
          >
            Tovább
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            sx={{ textTransform: 'none', fontWeight: 700, px: 3, color: '#000' }}
          >
            {loading ? 'Létrehozás...' : '✓ Lecke létrehozása'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AddLessonDialog;
