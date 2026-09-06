import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Input } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import TLanguage from "../database/TLanguage";
import Bot from "../functions/Bot";

interface Props {
  isOpen: boolean;
  setIsOpen: (x: boolean) => void;
  language: TLanguage;
  onClose?: () => void;
}

const WordSearchModal = ({ isOpen, setIsOpen, language, onClose }: Props) => {
  const [inputBoxContent, setInputBoxContent] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [translation, setTranslation] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Translate from English to the given language
  const handleTranslateText = (text: string) => {
    Bot.TranslateEnglishToLanguage(text, language).then((result) => {
      setTranslation(result);
      setIsLoading(false);
    }).catch((err) => {
      console.error(err);
      setIsLoading(false);
    });
  }

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setInputBoxContent('');
    setTranslation('');
    setIsLoading(false);
    onClose?.();
  }, [setIsOpen, onClose]);

  const isEscapeKey = (e: React.KeyboardEvent | KeyboardEvent) => {
    return e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27;
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (isEscapeKey(event)) {
      event.preventDefault();
      event.stopPropagation();
      handleClose();
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (inputBoxContent.trim().length > 0) {
        const textToTranslate = inputBoxContent;
        setInputBoxContent('');
        setTranslation('');
        setIsLoading(true);
        inputRef.current?.blur();
        setTimeout(() => closeButtonRef.current?.focus(), 0);
        handleTranslateText(textToTranslate);
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleWindowKeyDown = (e: KeyboardEvent) => {
      if (isEscapeKey(e)) {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleWindowKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleWindowKeyDown, true);
    };
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    setTranslation('');
    setInputBoxContent('');
    setIsLoading(false);
  }, [isOpen]);

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      onKeyDown={(event) => {
        if (isEscapeKey(event)) {
          event.preventDefault();
          event.stopPropagation();
          handleClose();
        }
      }}
      disableRestoreFocus={true}
      TransitionProps={{
        onExited: () => {
          onClose?.();
        },
      }}
      aria-labelledby="info-dialog-title"
      aria-describedby={translation ? "info-dialog-description" : undefined}
      sx={{
        '& .MuiDialog-paper': {
          minWidth: 'min(425px, 80vw)',
        },
      }}
    >
      <DialogTitle id="info-dialog-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Translate English To {language}
      </DialogTitle>
      <DialogContent sx={{ marginBottom: '0!important' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '25px', marginBottom: '.5rem' }}>
            <CircularProgress size={22} />
          </Box>
        ) : translation ? (
          <DialogContentText id="info-dialog-description" sx={{ fontFamily: 'Comfortaa', whiteSpace: 'pre-line', lineHeight: '1.4', marginBottom: '.5rem' }}>
            {translation}
          </DialogContentText>
        ) : null}
        <Input inputRef={inputRef} value={inputBoxContent} sx={{ width: '100%', marginTop: (isLoading || translation) ? 0 : '.5rem' }} onChange={(event) => setInputBoxContent(event.target.value)} onKeyDown={onInputKeyDown} />
      </DialogContent>
      <DialogActions sx={{ paddingTop: 0 }}>
        <Button
          ref={closeButtonRef}
          onClick={handleClose}
          color="primary"
          disableRipple
          sx={{
            transition: 'background-color 0.15s ease-in-out',
            outline: 'none',
            '&:focus, &:focus-visible, &.Mui-focusVisible': {
              backgroundColor: 'var(--secondary-blue, #D3E9FF)',
              outline: 'none',
            },
            '&:hover': {
              backgroundColor: 'var(--secondary-blue, #D3E9FF)',
            },
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || isEscapeKey(e)) {
              e.preventDefault();
              handleClose();
            }
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
 
export default WordSearchModal;