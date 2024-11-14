import Database from "../database/Database";
import TLanguage from "../database/TLanguage";
import TTranslationAndExamples from "../database/TTranslationAndExamples";
import Bot from "../functions/Bot";
import useInfoModal from "./base/useInfoModal";
import '../styles/clickable-word.css';
import { Tooltip } from "@mui/material";
import { useState } from "react";
import Loading from "./Loading";

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

  /**
   * When the word is clicked, get the translation and example sentence for the word
   * from the database, if it exists, otherwise generate it and add it to the database.
   */
  const handleClick = () => {
    if (!canBeClicked) return;
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
          (${response!.example_sentence2_translation})`
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
    <Tooltip title="Translate word" placement="right-end">
      <span onClick={handleClick} className="clickable-word">{word} </span>
    </Tooltip>
    { !canBeClicked && <Loading /> }
    </>
  );
}
 
export default ClickableWord;