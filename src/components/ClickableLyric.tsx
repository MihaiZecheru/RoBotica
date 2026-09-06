import { useState } from "react";
import TLanguage from "../database/TLanguage";
import useInfoModal from "./base/useInfoModal";
import isMobile from "../functions/isMobile";
import { Tooltip } from "@mui/material";
import TranslateIcon from '@mui/icons-material/Translate';
import Database from "../database/Database";
import Bot from "../functions/Bot";
import TSong from "../database/TSong";
import Loading from "./Loading";

interface Props {
  language: TLanguage;
  /**
   * The lyric itself
   */
  lyric: string;
  /**
   * The song the lyric belongs to.
   */
  song: TSong;
	full_lyrics: string;
  onTranslate?: () => void;
  onCloseModal?: () => void;
}

const ClickableLyric = ({ language, lyric, song, onTranslate, onCloseModal, full_lyrics }: Props) => {
  const showInfoModal = useInfoModal();  
  const [canBeClicked, setCanBeClicked] = useState(true);

  // Translate on click
  const handleClick = async (event: React.MouseEvent) => {
    if (!canBeClicked) return;
    onTranslate?.();

    setCanBeClicked(false);
    const min_duration = 500;
    const startTime = new Date().getTime();

    try {
      let translationAndMeaning: { translation: string, meaning: string } | null
        = await Database.GetLyricTranslationAndMeaning(lyric, language, song.id);

      if (translationAndMeaning === null) {
        translationAndMeaning = await Bot.GenerateLyricTranslationAndMeaning(lyric, language, song, full_lyrics);
        Database.AddLyricTranslation(lyric, language, song.id, translationAndMeaning!.translation, translationAndMeaning!.meaning);
      }

      const showResult = () => {
        showInfoModal(
          `${language} Lyric Translation`,
          `${lyric}\n\n${translationAndMeaning?.translation}\n\n${translationAndMeaning?.meaning}`,
          undefined,
          onCloseModal
        );
        setCanBeClicked(true);
      };

      if (new Date().getTime() - startTime < min_duration) {
        setTimeout(showResult, min_duration - (new Date().getTime() - startTime));
      } else {
        showResult();
      }
    } catch (err: any) {
      showInfoModal('Error', err?.message || 'Failed to translate lyric', undefined, onCloseModal);
      setCanBeClicked(true);
    }
  };

  return (
    <>
      <Tooltip title={isMobile() ? "Translate lyric" : "Translate lyric"} placement="right-end">
        <TranslateIcon onClick={handleClick} className="translate-sentence-icon" />
      </Tooltip>
      { !canBeClicked && <Loading /> }
    </>
  );
}
 
export default ClickableLyric;