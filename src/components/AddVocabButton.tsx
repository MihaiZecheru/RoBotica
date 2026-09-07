import React, { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import Database from '../database/Database';
import TLanguage from '../database/TLanguage';

interface Props {
  word: string;
  language: TLanguage;
}

const AddVocabButton: React.FC<Props> = ({ word, language }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'added' | 'already_in_vocab' | 'error'>('idle');

  useEffect(() => {
    let isMounted = true;
    Database.IsWordInVocabList(word, language).then((inList) => {
      if (isMounted && inList) {
        setStatus((prev) => (prev === 'idle' ? 'already_in_vocab' : prev));
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [word, language]);

  const handleAddVocab = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (status !== 'idle' && status !== 'error') return;
    setStatus('loading');
    try {
      await Database.AddWordToVocabList(word, language);
      setStatus('added');
      setTimeout(() => {
        document.getElementById('info-modal-close-button')?.focus();
      }, 50);
    } catch (err: any) {
      if (
        err?.message?.includes('unique_user_word') ||
        err?.message?.includes('duplicate key') ||
        err?.code === '23505'
      ) {
        setStatus('already_in_vocab');
        setTimeout(() => {
          document.getElementById('info-modal-close-button')?.focus();
        }, 50);
      } else {
        setStatus('error');
      }
    }
  };

  const getButtonText = () => {
    switch (status) {
      case 'loading':
        return 'Adding...';
      case 'added':
        return 'Added ✓';
      case 'already_in_vocab':
        return 'In vocab ✓';
      case 'error':
        return 'Failed to add';
      default:
        return '+ vocab';
    }
  };

  return (
    <Button
      onClick={handleAddVocab}
      disabled={status === 'loading' || status === 'added' || status === 'already_in_vocab'}
      disableRipple
      tabIndex={0}
      title={status === 'error' ? 'Click to retry' : undefined}
      sx={{
        textTransform: 'none',
        fontFamily: 'Comfortaa',
        fontWeight: 600,
        fontSize: '0.875rem',
        color:
          status === 'added'
            ? '#16a34a'
            : status === 'already_in_vocab'
            ? '#64748b'
            : status === 'error'
            ? '#dc2626'
            : 'var(--primary-blue, #0084FF)',
        transition: 'background-color 0.15s ease-in-out, color 0.15s ease-in-out',
        outline: 'none',
        padding: '6px 8px',
        '&:focus, &:focus-visible, &.Mui-focusVisible': {
          backgroundColor: 'var(--secondary-blue, #D3E9FF)',
          outline: 'none',
          boxShadow: 'none',
        },
        '&:hover': {
          backgroundColor:
            status === 'added' || status === 'already_in_vocab'
              ? 'transparent'
              : 'var(--secondary-blue, #D3E9FF)',
        },
        '&.Mui-disabled': {
          color:
            status === 'added'
              ? '#16a34a'
              : status === 'already_in_vocab'
              ? '#64748b'
              : undefined,
        },
      }}
    >
      {getButtonText()}
    </Button>
  );
};

export default AddVocabButton;
