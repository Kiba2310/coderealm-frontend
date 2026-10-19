import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  IconButton,
  Switch,
  FormControlLabel,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';

interface AddCourseDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
}

const AddCourseDialog: React.FC<AddCourseDialogProps> = ({ open, onClose, onSave, initialData }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('Kezdő');
  const [order, setOrder] = useState(1);
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setTitle(initialData.title || '');
        setDescription(initialData.description || '');
        setCategory(initialData.category || '');
        setDifficulty(initialData.difficulty || 'Kezdő');
        setOrder(initialData.order || 1);
        setIsPublished(initialData.is_published || false);
      } else {
        setTitle('');
        setDescription('');
        setCategory('');
        setDifficulty('Kezdő');
        setOrder(1);
        setIsPublished(false);
      }
    }
  }, [open, initialData]);

  const handleSave = () => {
    onSave({
      title,
      description,
      category,
      difficulty,
      order,
      is_published: isPublished
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      sx={{ '& .MuiDialog-paper': { bgcolor: '#0f1923', border: '1px solid #1e293b', borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 2 }}>
        <AutoStoriesIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {initialData ? 'Kurzus szerkesztése' : 'Új kurzus'}
        </Typography>
        <IconButton onClick={onClose} sx={{ ml: 'auto', color: 'text.secondary' }} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
        <TextField
          autoFocus
          label="Kurzus címe"
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          variant="outlined"
        />

        <TextField
          label="Leírás"
          fullWidth
          multiline
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          variant="outlined"
        />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Kategória"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            sx={{ flex: 1 }}
          />
          <TextField
            label="Nehézség"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            sx={{ flex: 1 }}
          />
          <TextField
            label="Sorrend"
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            slotProps={{ htmlInput: { min: 1 } }}
            sx={{ width: 120 }}
          />
        </Box>

        <FormControlLabel
          control={<Switch checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} color="primary" />}
          label="Publikálva (Látható a diákok számára)"
        />
      </DialogContent>

      <DialogActions sx={{ p: 2.5, pt: 0 }}>
        <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none' }}>
          Mégse
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!title.trim()}
          sx={{ textTransform: 'none', px: 3, fontWeight: 600, borderRadius: 2 }}
        >
          {initialData ? 'Mentés' : 'Létrehozás'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddCourseDialog;
