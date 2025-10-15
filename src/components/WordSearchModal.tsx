import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Input, Tooltip } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import TLanguage from "../database/TLanguage";
import Bot from "../functions/Bot";

interface Props {
  isOpen: boolean;
  setIsOpen: (x: boolean) => void;
  language: TLanguage;
}

const WordSearchModal = ({ isOpen, setIsOpen, language }: Props) => {
  const [inputBoxContent, setInputBoxContent] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [translation, setTranslation] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Translate from English to the given language
  const handleTranslateText = (text: string) => {
    Bot.TranslateEnglishToLanguage(text, language).then((result) => {
      setTranslation(result);
      setIsLoading(false);
    });
  }

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (inputBoxContent.trim().length > 0) {
        setInputBoxContent('');
        setIsLoading(true);
        handleTranslateText(inputBoxContent);
      }
    }
  }

  const onClose = () => {
    setIsOpen(false);
    setInputBoxContent('');
    setTranslation('');
  }

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    setTranslation('');
    setInputBoxContent('');
  }, [isOpen])

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      aria-labelledby="info-dialog-title"
      aria-describedby="info-dialog-description"
      sx={{
        '& .MuiDialog-paper': {
          minWidth: 'min(425px, 80vw)',
        },
      }}
    >
      <DialogTitle id="info-dialog-title"sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>Translate English To {language}</DialogTitle>
      <DialogContent sx={{ marginBottom: '0!important' }}>
        <DialogContentText id="info-dialog-description" sx={{ fontFamily: 'Comfortaa', whiteSpace: 'pre-line', lineHeight: '1', height: '25px' }}>
          {isLoading ? <CircularProgress size={22} /> : translation || ''}
        </DialogContentText>
        <Input inputRef={inputRef} value={inputBoxContent} sx={{ width: '100%', marginTop: '.5rem' }} onChange={(event) => setInputBoxContent(event.target.value)} onKeyDown={onInputKeyDown} />
      </DialogContent>
      <DialogActions sx={{ paddingTop: 0 }}>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
 
export default WordSearchModal;