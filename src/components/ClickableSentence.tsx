import { Tooltip } from "@mui/material";
import TLanguage from "../database/TLanguage";
import TranslateIcon from '@mui/icons-material/Translate';
import Bot from "../functions/Bot";
import React, { useState } from "react";
import useInfoModal from "./base/useInfoModal";
import Database from "../database/Database";
import '../styles/translate-sentence-icon.css';
import { StoryID } from "../database/ID";
import TextToSpeech, { stopActiveTTS, TTS_AUDIO_ID } from "./TextToSpeech";
import TextToSpeechAPI from "../functions/TextToSpeechAPI";
import isMobile from "../functions/isMobile";
import Loading from "./Loading";

interface Props {
  language: TLanguage;
  sentence: string;
  story_id: StoryID;
}

const ClickableSentence = ({ language, sentence, story_id }: Props) => {
  const showInfoModal = useInfoModal();
  const [canBeClicked, setCanBeClicked] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  // Translate on click
  const handleClick = async (event: React.MouseEvent) => {
    if (!canBeClicked) return;

    if (event.ctrlKey) {
      if (isPlaying) return;
      stopActiveTTS();
      setIsPlaying(true);
      return TextToSpeechAPI(sentence, language, false).then(blob => {
        const audio = new Audio(URL.createObjectURL(blob));
        audio.id = TTS_AUDIO_ID;
        document.body.appendChild(audio);
        audio.play().catch(() => {});
        audio.onended = () => {
          const el = document.getElementById(TTS_AUDIO_ID);
          if (el) el.remove();
          setIsPlaying(false);
        };
      });
    }

    setCanBeClicked(false);

    const min_duration = 500;
    const startTime = new Date().getTime();

    let translation: string | null = await Database.GetStorySentenceTranslation(sentence, language, story_id);

    if (translation === null) {
      translation = await Bot.GenerateMessageTranslation(sentence, language);
      Database.AddStorySentenceTranslation(sentence, language, story_id, translation);
    }

    const showResult = () => {
      showInfoModal(`${language} Sentence Translation`, `${sentence}\n\n\n${translation}`, <TextToSpeech text={sentence} language={language} />);
      setCanBeClicked(true);
    };

    if (new Date().getTime() - startTime < min_duration) {
      setTimeout(showResult, min_duration - (new Date().getTime() - startTime));
    } else {
      showResult();
    }
  };
  
  return (
    <span>
      <Tooltip title={isMobile() ? "Translate sentence" : "Translate sentence"} placement="right-end">
        <TranslateIcon onClick={handleClick} className="translate-sentence-icon" />
      </Tooltip>
      {'. '}
      { !canBeClicked && <Loading /> }
    </span>
  );
}
 
export default ClickableSentence;