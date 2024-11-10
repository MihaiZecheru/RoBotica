import { Avatar, Paper } from "@mui/material";
import '../styles/blue-highlight-color.css';
import ClickableWord from "./ClickableWord";
import TLanguage from "../database/TLanguage";

interface Props {
  content: string;
  language: TLanguage;
}

const BotMessage = ({ content, language }: Props) => {
  return (
    <Paper className="bot-message" elevation={2} sx={{ borderRadius: '1rem', padding: '.5rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Avatar className="chat-avatar" alt='pfp' src='./robotica.png' />
        <div style={{ margin: '.25rem', fontWeight: 900 }} className="blue-highlight-color">
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