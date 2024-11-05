import React, { createContext, useContext, useState } from 'react';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from '@mui/material';

export interface InfoModalState {
  open: boolean;
  title: string;
  message: string;
}

interface ModalContextType {
  showInfoModal: (title: string, message: string) => void;
}

// Create a context for the modal
const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<InfoModalState | null>(null);

  /**
   * Display the modal to the screen with the given title and message.
   */
  const showInfoModal = (title: string, message: string) => {
    setModalState({ open: true, title, message });
  };

  const handleClose = () => {
    setModalState(null);
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
      aria-labelledby="error-dialog-title"
      aria-describedby="error-dialog-description"
      sx={{
        '& .MuiDialog-paper': {
          minWidth: 'min(425px, 80vw)',
        },
      }}
    >
      <DialogTitle id="error-dialog-title">{state?.title || ''}</DialogTitle>
      <DialogContent>
        <DialogContentText id="error-dialog-description">
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
