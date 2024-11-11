import { Avatar, Paper, Tooltip } from "@mui/material";
import ClickableWord from "./ClickableWord";
import TLanguage from "../database/TLanguage";
import useInfoModal from "./base/useInfoModal";
import Bot from "../functions/Bot";

interface Props {
  content: string;
  language: TLanguage;
}

const BotMessage = ({ content, language }: Props) => {
  const showInfoModal = useInfoModal();

  /**
   * Translate the entire bot's message. To be used on the Avatar's onClick event.
   */
  const translateBotMessageOnAvatarClick = async () => {
    const translation = await Bot.GenerateMessageTranslation(content, language);
    showInfoModal(`${language} Message Translation`, `${content}\n\n${translation}`);
  };

  return (
    <Paper className="bot-message" elevation={2} sx={{ borderRadius: '1rem', padding: '.5rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title="Translate message" placement="top-start">
          <Avatar
            className="chat-avatar"
            alt='pfp'
            src='/robotica.png'
            onClick={translateBotMessageOnAvatarClick}
            sx={{ cursor: 'pointer' }}
          />
        </Tooltip>
        <div style={{ margin: '.25rem', fontWeight: 900 }}>
          {
            content.split(' ').map((word: string, index: number) => 
              <ClickableWord key={index} word={word} language={language} />
            )
          }
        </div>
      </div>
    </Paper>
  );
}
 
export default BotMessage;