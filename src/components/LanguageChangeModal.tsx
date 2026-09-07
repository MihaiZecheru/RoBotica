import React, { useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import TLanguage from '../database/TLanguage';

interface Props {
  isOpen: boolean;
  targetLanguage: TLanguage | null;
  onCancel: () => void;
  onConfirm: () => void;
}

const LanguageChangeModal: React.FC<Props> = ({
  isOpen,
  targetLanguage,
  onCancel,
  onConfirm,
}) => {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onCancel}
      onKeyDown={handleKeyDown}
      aria-labelledby="language-change-dialog-title"
      aria-describedby="language-change-dialog-description"
      sx={{
        '& .MuiDialog-paper': {
          minWidth: 'min(440px, 90vw)',
          borderRadius: '16px',
          padding: '0.75rem',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
        },
      }}
    >
      <DialogTitle
        id="language-change-dialog-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          paddingBottom: '0.5rem',
          fontFamily: 'Comfortaa',
          fontWeight: 700,
          fontSize: '1.25rem',
          color: '#1a1a1a',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: '#FFF4E5',
            color: '#ED6C02',
            flexShrink: 0,
          }}
        >
          <WarningAmberRoundedIcon sx={{ fontSize: '26px' }} />
        </Box>
        <span>Change Language?</span>
      </DialogTitle>

      <DialogContent sx={{ paddingTop: '0.5rem !important' }}>
        <DialogContentText
          id="language-change-dialog-description"
          component="div"
          sx={{
            fontFamily: 'Comfortaa',
            color: '#444',
            fontSize: '0.95rem',
            lineHeight: 1.55,
          }}
        >
          <Typography sx={{ fontFamily: 'Comfortaa', marginBottom: '0.75rem' }}>
            Changing your language{targetLanguage ? ` to ${targetLanguage}` : ''} will{' '}
            <strong style={{ color: '#d32f2f' }}>permanently wipe all of your saved chats</strong> and chat history.
          </Typography>
          <Typography sx={{ fontFamily: 'Comfortaa', fontSize: '0.875rem', color: '#666' }}>
            This action cannot be undone. Are you sure you want to proceed?
          </Typography>
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ padding: '0.75rem 1.5rem 1rem', gap: '0.5rem' }}>
        <Button
          onClick={onCancel}
          variant="outlined"
          sx={{
            textTransform: 'none',
            fontFamily: 'Comfortaa',
            fontWeight: 600,
            borderRadius: '8px',
            borderColor: '#ccc',
            color: '#555',
            padding: '6px 18px',
            '&:hover': {
              borderColor: '#999',
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          ref={confirmButtonRef}
          onClick={onConfirm}
          variant="contained"
          color="error"
          sx={{
            textTransform: 'none',
            fontFamily: 'Comfortaa',
            fontWeight: 600,
            borderRadius: '8px',
            backgroundColor: '#e53935',
            padding: '6px 20px',
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: '#d32f2f',
              boxShadow: 'none',
            },
          }}
        >
          Understood
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LanguageChangeModal;
