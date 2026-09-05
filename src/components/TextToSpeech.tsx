import { IconButton, Tooltip } from "@mui/material";
import CampaignIcon from '@mui/icons-material/Campaign';
import TLanguage from "../database/TLanguage";
import { useEffect, useState } from "react";
import TextToSpeechAPI from "../functions/TextToSpeechAPI";

export const TTS_AUDIO_ID = "text-to-speech-audio";
let activeTTSAudio: HTMLAudioElement | null = null;

export const stopActiveTTS = () => {
  if (activeTTSAudio) {
    activeTTSAudio.pause();
    activeTTSAudio = null;
  }
  const existing = document.getElementById(TTS_AUDIO_ID) as HTMLAudioElement | null;
  if (existing) {
    existing.pause();
    existing.remove();
  }
};

interface Props {
  text: string;
  language: TLanguage;
  /**
   * Whether the text is SSML or not. Default is false. SSML is the markup language for the speech API. Used for adding pauses with <break time="1s" />. The clickable word uses SSML because there's a word then two example sentences.
   */
  ssml?: boolean;
}

const TextToSpeech = ({ text, language, ssml }: Props) => {
  if (ssml === undefined) ssml = false;

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      stopActiveTTS();
    };
  }, [audio]);

  const getSpeech = async () => {
    if (isLoading) return;
    setIsLoading(true);

    stopActiveTTS();
    const blob: Blob = await TextToSpeechAPI(text, language, ssml || false);
    const _audio = new Audio(URL.createObjectURL(blob));
    _audio.id = TTS_AUDIO_ID;
    document.body.appendChild(_audio);
    activeTTSAudio = _audio;

    setIsLoading(false);
    setAudio(_audio);
    setIsPlaying(true);
    _audio.play().catch(() => {});
    _audio.onended = () => {
      if (activeTTSAudio === _audio) {
        activeTTSAudio = null;
      }
      const existing = document.getElementById(TTS_AUDIO_ID);
      if (existing) {
        existing.remove();
      }
      setIsPlaying(false);
    };
  };

  const stopAudio = () => {
    stopActiveTTS();
    setIsPlaying(false);
  };

  return (
    <Tooltip title={isPlaying ? "Stop listening" : "Listen"} placement="top">
      <IconButton aria-label="read text" onClick={isPlaying ? stopAudio : getSpeech}>
        {
          <CampaignIcon color={isPlaying ? "primary" : "inherit"} />
        }
      </IconButton>
    </Tooltip>
  );
}
 
export default TextToSpeech;