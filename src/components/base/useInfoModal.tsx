import React, { createContext, ReactElement, useContext, useState } from 'react';
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
  return (
    <Dialog
      open={state?.open || false}
      onClose={onClose}
      aria-labelledby="info-dialog-title"
      aria-describedby="info-dialog-description"
      sx={{
        '& .MuiDialog-paper': {
          minWidth: 'min(425px, 80vw)',
        },
      }}
    >
      <DialogTitle id="info-dialog-title"sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>{state?.title || ''} {state?.translate_button && state.translate_button}</DialogTitle>
      <DialogContent>
        <DialogContentText id="info-dialog-description" sx={{ fontFamily: 'Comfortaa', whiteSpace: 'pre-line', lineHeight: '1' }}>
          {state?.message || ''}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default useInfoModal;
