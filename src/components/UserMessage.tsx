import { Avatar, Paper, Tooltip } from "@mui/material";
import ClickableWord from "./ClickableWord";
import TLanguage from "../database/TLanguage";
import useInfoModal from "./base/useInfoModal";
import Bot from "../functions/Bot";
import { useState } from "react";

interface Props {
  content: string;
  language: TLanguage;
  avatar_url?: string;
}

const UserMessage = ({ content, language, avatar_url }: Props) => {
  const showInfoModal = useInfoModal();
  const [avatarCanBeClicked, setAvatarCanBeClicked] = useState<boolean>(true);

  /**
   * Perform a grammar and spelling check on the user's message. To be used on the Avatar's onClick event.
   */
  const performGrammarAndSpellingCheckOnAvatarClick = async () => {
    if (!avatarCanBeClicked) return;
    setAvatarCanBeClicked(false);

    const { mistake_count, corrected_message } = await Bot.PerformGrammarAndSpellingCheck(content, language);

    if (mistake_count === 0) {
      showInfoModal(
        `${language} Grammar & Spelling Check`,
        `Your message contains no mistakes. Great job!\nCorrected vs original:\n\nC: ${corrected_message}\n\nO: ${content}\n\nNote that the bot sometimes makes wrong corrections.`,
      );
    } else {
      const s = mistake_count > 1 ? 's' : '';
      showInfoModal(
        `${language} Grammar & Spelling Check`,
        `Your message contains ${mistake_count} mistake${s}. Corrected vs original:\n\nC: ${corrected_message}\n\nO:${content}\n\nNote that the bot sometimes makes wrong corrections.`,
      );
    }

    setAvatarCanBeClicked(true);
  };

  return (
    <Paper className="user-message" elevation={2} sx={{ borderRadius: '1rem', padding: '.5rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <div style={{ margin: '.25rem', marginLeft: '.5rem', fontWeight: 900 }}>
          {
            content.split(' ').map((word: string, index: number) => 
              <ClickableWord key={index} word={word} language={language} />
            )
          }
        </div>
        <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Tooltip title="Perform grammar & spelling check" placement="top-end">
            <Avatar
              className="chat-avatar"
              alt='pfp'
              src={ avatar_url || '/default-user-avatar.png' }
              sx={{ width: "27px!important", height: "27px!important", cursor: 'pointer' }}
              onClick={performGrammarAndSpellingCheckOnAvatarClick}
            />
          </Tooltip>
        </div>
      </div>
    </Paper>
  );
}
 
export default UserMessage;