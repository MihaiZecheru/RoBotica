import { Tooltip } from "@mui/material";
import TLanguage from "../database/TLanguage";
import TranslateIcon from '@mui/icons-material/Translate';
import Bot from "../functions/Bot";
import { useState } from "react";
import useInfoModal from "./base/useInfoModal";
import Database from "../database/Database";
import '../styles/translate-sentence-icon.css';
import { StoryID } from "../database/ID";

interface Props {
  language: TLanguage;
  sentence: string;
  story_id: StoryID;
}

const ClickableSentence = ({ language, sentence, story_id }: Props) => {
  const showInfoModal = useInfoModal();
  const [canBeClicked, setCanBeClicked] = useState(true);

  // Translate on click
  const handleClick = async () => {
    if (!canBeClicked) return;
    setCanBeClicked(false);

    const min_duration = 500;
    const startTime = new Date().getTime();

    let translation: string | null = await Database.GetStorySentenceTranslation(sentence, language, story_id);

    if (translation === null) {
      translation = await Bot.GenerateMessageTranslation(sentence, language);
      Database.AddStorySentenceTranslation(sentence, language, story_id, translation);
    }

    const showResult = () => {
      showInfoModal(`${language} Sentence Translation`, `${sentence}\n\n${translation}`);
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
      <Tooltip title="Translate sentence" placement="right-end">
        <TranslateIcon onClick={handleClick} className="translate-sentence-icon" />
      </Tooltip>
      {'. '}
    </span>
  );
}
 
export default ClickableSentence;