import React, { createContext, ReactElement, useContext, useEffect, useRef, useState } from 'react';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from '@mui/material';
import { stopActiveTTS, TTS_AUDIO_ID } from '../TextToSpeech';

export interface InfoModalState {
  open: boolean;
  title: string;
  message: string;
  translate_button?: ReactElement;
  onClose?: () => void;
}

interface ModalContextType {
  showInfoModal: (
    title: string,
    message: string,
    translate_button?: ReactElement,
    onClose?: () => void
  ) => void;
}

// Create a context for the modal
const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<InfoModalState | null>(null);

  /**
   * Display the modal to the screen with the given title and message.
   */
  const showInfoModal = (
    title: string,
    message: string,
    translate_button?: ReactElement,
    onClose?: () => void
  ) => {
    setModalState({ open: true, title, message, translate_button, onClose });
  };

  const handleClose = () => {
    // Stop and remove any playing TTS audio by ID when the modal is closed
    stopActiveTTS();
    const ttsAudio = document.getElementById(TTS_AUDIO_ID) as HTMLAudioElement | null;
    if (ttsAudio) {
      ttsAudio.pause();
      ttsAudio.remove();
    }
    const onCloseCallback = modalState?.onClose;
    setModalState(null);
    try {
      onCloseCallback?.();
    } catch (err) {
      console.warn("Error executing modal onClose callback:", err);
    }
  };

  return (
    <ModalContext.Provider value={{ showInfoModal: showInfoModal }}>
      {children}
      <InfoModal state={modalState} onClose={handleClose} />
    </ModalContext.Provider>
  );
};

/**
 * Hook that returns the showInfoModal function which can be used to display the modal with a title and body message.
 */
const useInfoModal = () => {
  const context = useContext(ModalContext);
  
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }

  return context.showInfoModal;
};

interface InfoModalProps {
  state: InfoModalState | null;
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ state, onClose }) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (state?.open) {
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [state?.open]);

  return (
    <Dialog
      open={state?.open || false}
      onClose={onClose}
      aria-labelledby="info-dialog-title"
      aria-describedby="info-dialog-description"
      TransitionProps={{
        onEntered: () => {
          closeButtonRef.current?.focus();
        },
      }}
      sx={{
        '& .MuiDialog-paper': {
          minWidth: 'min(425px, 80vw)',
          borderRadius: '12px',
          outline: 'none',
        },
      }}
    >
      <DialogTitle id="info-dialog-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {state?.title || ''} {state?.translate_button && state.translate_button}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="info-dialog-description" sx={{ fontFamily: 'Comfortaa', whiteSpace: 'pre-line', lineHeight: '1.4' }}>
          {state?.message || ''}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          ref={closeButtonRef}
          autoFocus
          onClick={onClose}
          color="primary"
          disableRipple
          sx={{
            transition: 'background-color 0.15s ease-in-out',
            outline: 'none',
            '&:focus, &:focus-visible, &.Mui-focusVisible': {
              backgroundColor: 'var(--secondary-blue, #D3E9FF)',
              outline: 'none',
              boxShadow: 'none',
            },
            '&:hover': {
              backgroundColor: 'var(--secondary-blue, #D3E9FF)',
            },
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onClose();
            }
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default useInfoModal;
