import Database from "../database/Database";
import TLanguage from "../database/TLanguage";
import TTranslationAndExamples from "../database/TTranslationAndExamples";
import Bot from "../functions/Bot";
import useInfoModal from "./base/useInfoModal";
import '../styles/clickable-word.css';

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
  /**
   * When the word is clicked, get the translation and example sentence for the word
   * from the database, if it exists, otherwise generate it and add it to the database.
   */
  const handleClick = () => {
    const word_no_punctuation = word.replace(/[.,\/#!\?$%\^&\*;:{}=\-_`~()]/g, '').toLowerCase();
    Database.GetTranslationAndExamples(word_no_punctuation, language).then(async (response: TTranslationAndExamples | null) => {
      if (response === null) {
        response = await Bot.GenerateTranslationAndExamplesForWord(word_no_punctuation, language);
        Database.AddTranslationAndExample(response);
      }

      showInfoModal(
        `${language} Translation`,
        `"${word_no_punctuation}" means "${response.translation}".\n\n
        ${response.example_sentence1}\n
        (${response.example_sentence1_translation})\n\n
        ${response.example_sentence2}\n
        (${response.example_sentence2_translation})`
      );
    });
  };
  
  return (
    <span onClick={handleClick} className="clickable-word">{word} </span>
  );
}
 
export default ClickableWord;