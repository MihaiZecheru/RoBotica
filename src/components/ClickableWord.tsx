import Database from "../database/Database";
import TLanguage from "../database/TLanguage";
import TTranslationAndExamples from "../database/TTranslationAndExamples";
import Bot from "../functions/Bot";
import useInfoModal from "./base/useInfoModal";
import '../styles/clickable-word.css';
import { Tooltip } from "@mui/material";
import { MouseEventHandler, useState } from "react";
import Loading from "./Loading";
import TextToSpeech from "./TextToSpeech";
import TextToSpeechAPI from "../functions/TextToSpeechAPI";
import isMobile from "../functions/isMobile";

interface Props {
  /**
   * The word itself
   */
  word: string;
  language: TLanguage;
}

/**
 * Represents a word in a message that can be clicked on to get a translation and example sentence.
 */
const ClickableWord = ({ word, language }: Props) => {
  const showInfoModal = useInfoModal();
  const [canBeClicked, setCanBeClicked] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  /**
   * When the word is clicked, get the translation and example sentence for the word
   * from the database, if it exists, otherwise generate it and add it to the database.
   * 
   * Note: if ctrl+click, then the word is pronounced 
   */
  const handleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    if (!canBeClicked) return;
    
    // If ctrl+click, then pronounce the word using the text to speech API
    if (e.ctrlKey) {
      if (isPlaying) return;
      setIsPlaying(false);
      return TextToSpeechAPI(word, language, false).then(blob => {
        const audio = new Audio(URL.createObjectURL(blob));
        if (document.querySelector("audio")) document.querySelector("audio")?.remove();
        document.body.appendChild(audio);
        audio.play();
        audio.onended = () => { audio.remove(); setIsPlaying(true); };
      });
    }
    
    // Open the modal with the translation and example sentences
    
    setCanBeClicked(false);
    const min_duration = 500;
    const startTime = new Date().getTime();

    const word_cleaned = word.replace(/[\.\,\/\\\#\!\?\$\%\^\&\*\;\:\{\}\=\_\`\~\(\)\¡\¿\"\”]/g, '').toLowerCase().trim();
    Database.GetTranslationAndExamples(word_cleaned, language).then(async (response: TTranslationAndExamples | null) => {
      if (response === null) {
        try {
          response = await Bot.GenerateTranslationAndExamplesForWord(word_cleaned, language);
          Database.AddTranslationAndExample(response);
        } catch (e: any) {
          showInfoModal('Error', e.message);
          return;
        }
      }

      const showResult = () => {
        showInfoModal(
          `${language} Translation`,
          `"${word_cleaned}" means "${response!.translation}".\n\n
          ${response!.example_sentence1}\n
          (${response!.example_sentence1_translation})\n\n
          ${response!.example_sentence2}\n
          (${response!.example_sentence2_translation})`,
          <TextToSpeech
            text={`<speak>${word_cleaned}.<break time="1s" />${response!.example_sentence1}<break time="1s" />${response!.example_sentence2}</speak>`}
            language={language}
            ssml={true}
          />
        );
        setCanBeClicked(true);
      };

      if (new Date().getTime() - startTime < min_duration) {
        setTimeout(showResult, min_duration - (new Date().getTime() - startTime));
      } else {
        showResult();
      }
    });
  };
  
  return (
    <>
      <Tooltip title={isMobile() ? "Translate word" : "Translate word. +ctrl to pronounce"} placement="right-end">
        <span onClick={handleClick} className="clickable-word">{word}{' '}</span>
      </Tooltip>
      { !canBeClicked && <Loading /> }
    </>
  );
}
 
export default ClickableWord;