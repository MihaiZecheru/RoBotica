import React from 'react';
import { Tooltip } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import TLanguage from '../database/TLanguage';
import useInfoModal from './base/useInfoModal';
import TextToSpeech from './TextToSpeech';

interface Props {
  mistake_count: number;
  modal_message?: string | null;
  language: TLanguage;
}

const GrammarCheckIcon: React.FC<Props> = ({ mistake_count, modal_message, language }) => {
  const showInfoModal = useInfoModal();

  if (mistake_count === 0) {
    return (
      <Tooltip title="No grammar mistakes" placement="top">
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: 'rgba(76, 175, 80, 0.15)',
            color: '#2e7d32',
            cursor: 'default',
            userSelect: 'none',
            flexShrink: 0,
          }}
        >
          <CheckIcon sx={{ fontSize: 14, stroke: '#2e7d32', strokeWidth: 0.5 }} />
        </span>
      </Tooltip>
    );
  }

  const handleClick = () => {
    if (!modal_message) return;

    // Extract corrected message if available for TTS button in modal
    let correctedText = '';
    const correctedMatch = modal_message.match(/Corrected:\s*([\s\S]+?)(?:\n\n|$)/i);
    if (correctedMatch && correctedMatch[1]) {
      correctedText = correctedMatch[1].trim();
    }

    const formattedMessage = modal_message.trim().replace(/\n+Original:/g, '\n\n\nOriginal:');
    const fullMessage = `${formattedMessage}\n\n\nDouble check results; bot can sometimes be incorrect.`;

    showInfoModal(
      `${language} Grammar & Spelling Check`,
      fullMessage,
      correctedText ? <TextToSpeech text={correctedText} language={language} /> : undefined
    );
  };

  const mistakesLabel = `${mistake_count} mistake${mistake_count > 1 ? 's' : ''} - click to view`;

  return (
    <Tooltip title={mistakesLabel} placement="top">
      <span
        onClick={handleClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          userSelect: 'none',
          flexShrink: 0,
        }}
      >
        <svg
          width="20"
          height="18"
          viewBox="0 0 24 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10.268 2.5a2 2 0 0 1 3.464 0l8.66 15A2 2 0 0 1 20.66 20.5H3.34a2 2 0 0 1-1.732-3l8.66-15z"
            fill="#FFF3C4"
            stroke="#E0A800"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <text
            x="12"
            y="16.5"
            textAnchor="middle"
            fill="#664D03"
            fontSize="11"
            fontWeight="bold"
            fontFamily="Comfortaa, sans-serif"
          >
            {mistake_count}
          </text>
        </svg>
      </span>
    </Tooltip>
  );
};

export default GrammarCheckIcon;
