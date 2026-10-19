import React from 'react';
import { Box, Typography } from '@mui/material';

interface WatermarkProps {
  text: string;
}

export const Watermark: React.FC<WatermarkProps> = ({ text }) => {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 50,
        overflow: 'hidden',
        display: 'flex',
        flexWrap: 'wrap',
        opacity: 0.06, // Increased opacity so OCR reliably catches it
        userSelect: 'none',
      }}
    >
      {/* Generate a grid of repeated text */}
      {Array.from({ length: 150 }).map((_, i) => (
        <Typography
          key={i}
          sx={{
            color: 'white',
            fontSize: '1.2rem',
            transform: 'rotate(-30deg)',
            m: 5,
            whiteSpace: 'nowrap',
            fontWeight: 'bold',
            opacity: 0.8,
          }}
        >
          {text}
        </Typography>
      ))}
    </Box>
  );
};
