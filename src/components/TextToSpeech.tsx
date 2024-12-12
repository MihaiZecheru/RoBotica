import { IconButton } from "@mui/material";
import CampaignIcon from '@mui/icons-material/Campaign';
import TLanguage from "../database/TLanguage";
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { useState } from "react";
import TextToSpeechAPI from "../functions/TextToSpeechAPI";

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

  const getSpeech = async () => {
    if (isLoading) return;
    setIsLoading(true);

    const blob: Blob = await TextToSpeechAPI(text, language, ssml || false);
    const _audio = new Audio(URL.createObjectURL(blob));
    if (document.querySelector("audio")) document.querySelector("audio")?.remove();
    document.body.appendChild(_audio);
    setIsLoading(false);
    setAudio(_audio);
    _audio.play();
    _audio.onended = () => { document.querySelector("audio")?.remove(); setIsPlaying(false); }
    setIsPlaying(true);
  };

  const stopAudio = () => {
    if (audio) {
      audio.pause();
      audio.remove();
      setIsPlaying(false);
    }
  };

  return (
    <IconButton aria-label="read text" onClick={isPlaying ? stopAudio : getSpeech}>
      {
        isPlaying ? <VolumeOffIcon /> : <CampaignIcon />
      }
    </IconButton>
  );
}
 
export default TextToSpeech;