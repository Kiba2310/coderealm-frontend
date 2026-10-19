import { useId, useState } from 'react';
import { Alert, Box, Button, Chip, FormControl, InputLabel, LinearProgress, MenuItem, Paper, Select, Stack, Typography } from '@mui/material';
import { useAIMentor } from '../../hooks/useAIMentor';
import type { AIMentorService, HintLevel, MentorContext } from '../../services/aiMentor/types';

interface Props {
  exerciseId: string;
  context: Omit<MentorContext, 'hintLevel'>;
  /** Injectable for tests; ordinary exercises use the shared per-tab service. */
  service?: AIMentorService;
}

export default function AIMentorPanel({ exerciseId, context, service }: Props) {
  const mentor = useAIMentor(exerciseId, service);
  const [hintLevel, setHintLevel] = useState<HintLevel>(1);
  const [actionError, setActionError] = useState('');
  const id = useId();
  const busy = ['checking', 'loading', 'generating', 'stopping', 'disposing'].includes(mentor.status);
  const loading = mentor.status === 'loading' || mentor.status === 'checking';
  const generating = mentor.status === 'generating' || mentor.status === 'stopping';
  const requestHint = async (level: HintLevel) => {
    setActionError('');
    try { await mentor.generateHint({ ...context, hintLevel: level }); }
    catch { setActionError('Egy művelet már folyamatban van. Kérlek, várj a következő tippig.'); }
  };

  return (
    <Paper component="section" aria-labelledby={`${id}-title`} variant="outlined" sx={{ p: 2, mt: 3, minWidth: 0 }}>
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography id={`${id}-title`} component="h2" variant="h6">AI Programozási Mentor</Typography>
          <Chip size="small" variant="outlined" color={mentor.supported ? 'success' : 'default'}
            label={mentor.supported === undefined ? 'GPU: még nincs ellenőrizve' : mentor.supported ? 'WebGPU elérhető' : 'Helyi tippek'} />
        </Box>
        <Typography variant="body2" color="text.secondary">
          A modell a böngésződben fut. Az első bekapcsolás nagy, akár 1 GB feletti letöltéssel és jelentős memóriaigénnyel járhat.
          AI nélkül is kérhetsz helyi tippeket.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Integrált GPU-val is működhet. Kevés memória esetén válaszd a kisebb modellt; annak magyarázatai egyszerűbbek lehetnek.
        </Typography>
        <Typography role="status" aria-live="polite" variant="body2">{mentor.message}</Typography>
        {loading && (
          <Box>
            <LinearProgress aria-label="AI modell betöltése" variant={mentor.status === 'checking' ? 'indeterminate' : 'determinate'} value={mentor.progress * 100} />
            {mentor.status === 'loading' && <Typography variant="caption">{Math.round(mentor.progress * 100)}%</Typography>}
          </Box>
        )}
        {(mentor.error || actionError) && <Alert severity="warning">{actionError || mentor.error}</Alert>}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {!mentor.ready && !loading && (
            <>
              <Button variant="outlined" disabled={busy} onClick={() => { void mentor.initialize('standard').catch(() => {}); }}>
                AI mentor bekapcsolása
              </Button>
              <Button variant="outlined" disabled={busy} onClick={() => { void mentor.initialize('compact').catch(() => {}); }}>
                Kisebb modell bekapcsolása
              </Button>
            </>
          )}
          {(mentor.ready || loading) && (
            <Button variant="text" disabled={mentor.status === 'disposing'} onClick={() => { void mentor.dispose(); }}>
              AI mentor kikapcsolása
            </Button>
          )}
        </Box>
        {mentor.ready && mentor.modelProfile === 'compact' && (
          <Typography variant="caption" color="text.secondary">Kisebb memóriaigényű AI modell aktív.</Typography>
        )}
        <FormControl size="small" fullWidth>
          <InputLabel id={`${id}-level-label`}>Segítség szintje</InputLabel>
          <Select labelId={`${id}-level-label`} label="Segítség szintje" value={hintLevel} disabled={busy}
            onChange={event => setHintLevel(Number(event.target.value) as HintLevel)}>
            <MenuItem value={1}>1 – Fogalmi irány</MenuItem>
            <MenuItem value={2}>2 – Érintett kódrész</MenuItem>
            <MenuItem value={3}>3 – Magyarázat és kis példa</MenuItem>
            <MenuItem value={4}>4 – Megoldási stratégia</MenuItem>
          </Select>
        </FormControl>
        <Box aria-live="polite" aria-atomic="true" sx={{ overflowWrap: 'anywhere' }}>
          {mentor.response && (
            <>
              <Typography variant="caption" color="text.secondary">
                {mentor.source === 'fallback' ? 'Helyi, előre meghatározott tipp' : 'AI-tipp – ellenőrizd a saját példáiddal'}
              </Typography>
              <Typography sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>{mentor.response}</Typography>
            </>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="contained" disabled={busy} onClick={() => { void requestHint(hintLevel); }}>Segítséget kérek</Button>
          <Button variant="outlined" disabled={busy || hintLevel === 4} onClick={() => {
            const next = (hintLevel + 1) as HintLevel;
            setHintLevel(next);
            void requestHint(next);
          }}>Következő tipp</Button>
          {generating && <Button disabled={mentor.status === 'stopping'} onClick={() => { void mentor.cancel(); }}>Válasz leállítása</Button>}
        </Box>
      </Stack>
    </Paper>
  );
}
