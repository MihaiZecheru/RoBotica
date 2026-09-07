import Database from "../database/Database";
import TLanguage from "../database/TLanguage";
import TTranslationAndExamples from "../database/TTranslationAndExamples";
import Bot from "../functions/Bot";
import useInfoModal from "./base/useInfoModal";
import '../styles/clickable-word.css';
import { Tooltip } from "@mui/material";
import { useState } from "react";
import Loading from "./Loading";
import TextToSpeech, { stopActiveTTS, TTS_AUDIO_ID } from "./TextToSpeech";
import TextToSpeechAPI from "../functions/TextToSpeechAPI";
import isMobile from "../functions/isMobile";
import AddVocabButton from "./AddVocabButton";

interface Props {
  /**
   * The word itself
   */
  word: string;
  language: TLanguage;
  onTranslate?: () => void;
  onCloseModal?: () => void;
}

/**
 * Represents a word in a message that can be clicked on to get a translation and example sentence.
 */
const ClickableWord = ({ word, language, onTranslate, onCloseModal }: Props) => {
  const showInfoModal = useInfoModal();
  const [canBeClicked, setCanBeClicked] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const word_cleaned = word.replace(/[.,/\\#!?$%^&*;:{}=_`~()¡¿"”„«»‘’]/g, '').toLowerCase().trim();

  /**
   * When the word is clicked, get the translation and example sentence for the word
   * from the database, if it exists, otherwise generate it and add it to the database.
   * 
   * Note: if ctrl+click, then the word is pronounced. if alt+click, then the word is added to the user's vocab list
   */
  const handleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    if (!canBeClicked) return;
    // If ctrl+click, then pronounce the word using the text to speech API
    if (e.ctrlKey) {
      if (isPlaying) return;
      stopActiveTTS();
      setIsPlaying(true);
      return TextToSpeechAPI(word_cleaned, language, false).then(blob => {
        const audio = new Audio(URL.createObjectURL(blob));
        audio.id = TTS_AUDIO_ID;
        document.body.appendChild(audio);
        audio.play().catch(() => {});
        audio.onended = () => {
          const el = document.getElementById(TTS_AUDIO_ID);
          if (el) el.remove();
          setIsPlaying(false);
        };
      }).catch((err) => {
        console.error("Failed to play TTS:", err);
        setIsPlaying(false);
      });
    // If alt+click, the word is added to the user's vocab list
    } else if (e.altKey) {
      return Database.AddWordToVocabList(word_cleaned, language).then(() => {
        showInfoModal("Success", `The word "${word_cleaned}" was added to your vocab list.`);
      }).catch((err) => {
        if (err.message === 'duplicate key value violates unique constraint "unique_user_word"') {
          showInfoModal("Info", `"${word_cleaned}" is already in your vocab list`);
        } else {
          showInfoModal("Error", `UNKNOWN ERROR: Failed to add "${word_cleaned}" to your vocab list.`);
        }
      });
    }
    
    // Open the modal with the translation and example sentences
    onTranslate?.();

    setCanBeClicked(false);
    const min_duration = 500;
    const startTime = new Date().getTime();

    Database.GetTranslationAndExamples(word_cleaned, language).then(async (response: TTranslationAndExamples | null) => {
      if (response === null) {
        try {
          response = await Bot.GenerateTranslationAndExamplesForWord(word_cleaned, language);
          Database.AddTranslationAndExample(response);
        } catch (e: any) {
          showInfoModal('Error', e.message, undefined, onCloseModal);
          setCanBeClicked(true);
          return;
        }
      }

      const showResult = () => {
        const escapeXml = (unsafe: string) => {
          return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
        };
        const cleanForSSML = (text: string) => escapeXml((text || '').replace(/<[^>]*>/g, '').trim());
        const cleanWord = cleanForSSML(word_cleaned);
        const s1 = cleanForSSML(response!.example_sentence1);
        const s2 = cleanForSSML(response!.example_sentence2);
        const ssmlParts = [cleanWord ? `${cleanWord}.` : ''];
        if (s1) ssmlParts.push(s1);
        if (s2) ssmlParts.push(s2);
        const ssmlText = `<speak>${ssmlParts.filter(Boolean).join('<break time="1s" />')}</speak>`;

        showInfoModal(
          `${language} Translation`,
          `"${word_cleaned}" means "${response!.translation.replace(/<[^>]*>/g, '').trim()}".\n\n
           ${response!.example_sentence1.replace(/<[^>]*>/g, '').trim()}\n
          (${response!.example_sentence1_translation.replace(/<[^>]*>/g, '').trim()})\n\n
           ${response!.example_sentence2.replace(/<[^>]*>/g, '').trim()}\n
          (${response!.example_sentence2_translation.replace(/<[^>]*>/g, '').trim()})`,
          <TextToSpeech
            text={ssmlText}
            language={language}
            ssml={true}
          />,
          onCloseModal,
          <AddVocabButton word={word_cleaned} language={language} />
        );
        setCanBeClicked(true);
      };

      if (new Date().getTime() - startTime < min_duration) {
        setTimeout(showResult, min_duration - (new Date().getTime() - startTime));
      } else {
        showResult();
      }
    }).catch((err: any) => {
      showInfoModal('Error', err?.message || 'Failed to translate word', undefined, onCloseModal);
      setCanBeClicked(true);
    });
  };
  
  return (
    <>
      <Tooltip title={isMobile() ? "Translate word" : "Translate word"} placement="right-end">
        <span onClick={handleClick} className="clickable-word">{word}{' '}</span>
      </Tooltip>
      { !canBeClicked && <Loading /> }
    </>
  );
}
 
export default ClickableWord;