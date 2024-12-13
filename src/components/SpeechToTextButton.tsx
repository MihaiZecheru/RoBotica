import MicNoneIcon from '@mui/icons-material/MicNone';
import SettingsVoiceIcon from '@mui/icons-material/SettingsVoice';
import { IconButton, Tooltip } from '@mui/material';
import { useRef, useState } from 'react';
import TLanguage from '../database/TLanguage';
import { SpeechToTextAPI } from '../functions/TextToSpeechAPI';
import useInfoModal from './base/useInfoModal';

interface Props {
  onTranscriptionComplete: (transcribed_text: string) => void;
  language?: TLanguage;
}

const SpeechToTextButton = ({ onTranscriptionComplete, language }: Props) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const showInfoModal = useInfoModal();

  const startRecording = async () => {
    if (!language) return; // Component still loading
  
    if (isRecording) {
      mediaRecorder.current?.stop();
      mediaStream.current?.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      return;
    }

    let audioChunks: any[] = [];

    // Get user media (audio)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStream.current = stream;
      mediaRecorder.current = new MediaRecorder(stream);
      setIsRecording(true);
  
      mediaRecorder.current.ondataavailable = event => {
        audioChunks.push(event.data);
      };
  
      mediaRecorder.current.onstop = () => {
        const audio: Blob = new Blob(audioChunks, { type: 'audio/wav' });
        SpeechToTextAPI(audio, language).then((transcribed_text: string) => {
          onTranscriptionComplete(transcribed_text);
        });
        
        // Cleanup
        mediaStream.current?.getTracks().forEach(track => track.stop());
        mediaStream.current = null;
      };
  
      mediaRecorder.current.start();
    } catch (error) {
      showInfoModal('Error accessing microphone', 'Please allow access to the microphone to use this feature.');
      console.error(error);
    }
  };
  

  return (
    <Tooltip title={isRecording ? "Stop recording" : "Start recording"}>
      <IconButton aria-label="speech to text" onClick={startRecording}>
        {isRecording ? <SettingsVoiceIcon /> : <MicNoneIcon />}
      </IconButton>
    </Tooltip>
  );
}

export default SpeechToTextButton;