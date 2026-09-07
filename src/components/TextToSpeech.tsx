import { CircularProgress, IconButton, Tooltip } from "@mui/material";
import CampaignIcon from '@mui/icons-material/Campaign';
import TLanguage from "../database/TLanguage";
import { useEffect, useRef, useState } from "react";
import TextToSpeechAPI from "../functions/TextToSpeechAPI";

export const TTS_AUDIO_ID = "text-to-speech-audio";
let activeTTSAudio: HTMLAudioElement | null = null;

export const stopActiveTTS = () => {
  if (activeTTSAudio) {
    activeTTSAudio.pause();
    activeTTSAudio = null;
  }
  const elements = document.querySelectorAll(`audio#${TTS_AUDIO_ID}`);
  elements.forEach((el) => {
    const audioEl = el as HTMLAudioElement;
    audioEl.pause();
    audioEl.remove();
  });
};

interface Props {
  text: string;
  language: TLanguage;
  /**
   * Whether the text is SSML or not. Default is false. SSML is the markup language for the speech API. Used for adding pauses with <break time="1s" />. The clickable word uses SSML because there's a word then two example sentences.
   */
  ssml?: boolean;
}

const TextToSpeech = ({ text, language, ssml = false }: Props) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const audioUrlRef = useRef<string | null>(null);

  // Stop active TTS audio and revoke object URL when this component unmounts
  useEffect(() => {
    return () => {
      stopActiveTTS();
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, []);

  const getSpeech = async () => {
    if (isLoading) return;
    setIsLoading(true);

    stopActiveTTS();
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    try {
      const blob: Blob = await TextToSpeechAPI(text, language, ssml);
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;

      const _audio = new Audio(url);
      _audio.id = TTS_AUDIO_ID;
      document.body.appendChild(_audio);
      activeTTSAudio = _audio;

      _audio.onended = () => {
        if (activeTTSAudio === _audio) {
          activeTTSAudio = null;
        }
        _audio.remove();
        setIsPlaying(false);
      };

      _audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        if (activeTTSAudio === _audio) {
          activeTTSAudio = null;
        }
        _audio.remove();
        setIsPlaying(false);
      };

      setIsPlaying(true);
      await _audio.play();
    } catch (err) {
      console.error("Text-to-speech error:", err);
      stopActiveTTS();
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  const stopAudio = () => {
    stopActiveTTS();
    setIsPlaying(false);
  };

  return (
    <Tooltip title={isPlaying ? "Stop listening" : (isLoading ? "Loading audio..." : "Listen")} placement="top">
      <span>
        <IconButton
          aria-label="read text"
          onClick={isPlaying ? stopAudio : getSpeech}
          disabled={isLoading}
          size="small"
        >
          {isLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <CampaignIcon color={isPlaying ? "primary" : "inherit"} />
          )}
        </IconButton>
      </span>
    </Tooltip>
  );
};

export default TextToSpeech;