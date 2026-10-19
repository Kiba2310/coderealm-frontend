import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Typography, IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';

interface AddChapterDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (title: string, order: number) => Promise<void>;
  defaultOrder: number;
}

const AddChapterDialog: React.FC<AddChapterDialogProps> = ({ open, onClose, onSubmit, defaultOrder }) => {
  const [title, setTitle] = useState('');
  const [order, setOrder] = useState(defaultOrder);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setTitle('');
      setOrder(defaultOrder);
      setError('');
    }
  }, [open, defaultOrder]);

  const handleSubmit = async () => {
    if (!title.trim()) { setError('A fejezet neve kötelező!'); return; }
    setLoading(true);
    try {
      await onSubmit(title.trim(), order);
      onClose();
    } catch (err: any) {
      setError(err?.response?.status === 403 ? 'Nincs jogosultságod!' : 'Hiba a létrehozáskor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      sx={{ '& .MuiDialog-paper': { bgcolor: '#0f1923', border: '1px solid #1e293b', borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 2 }}>
        <FolderOpenIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Új fejezet</Typography>
        <IconButton onClick={onClose} sx={{ ml: 'auto', color: 'text.secondary' }} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          fullWidth
          label="Fejezet neve"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          error={!!error}
          helperText={error}
          placeholder="pl. Bevezetés a változókba"
          sx={{ mb: 1 }}
        />
        <TextField
          margin="dense"
          fullWidth
          label="Sorrend"
          type="number"
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
          slotProps={{ htmlInput: { min: 1 } }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none' }}>Mégsem</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!title.trim() || loading}
          sx={{ textTransform: 'none', fontWeight: 700, px: 3, color: '#000' }}
        >
          {loading ? 'Létrehozás...' : 'Fejezet létrehozása'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddChapterDialog;
