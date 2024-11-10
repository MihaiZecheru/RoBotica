import { Avatar, Paper } from "@mui/material";
import ClickableWord from "./ClickableWord";
import TLanguage from "../database/TLanguage";

interface Props {
  content: string;
  language: TLanguage;
  avatar_url?: string;
}

const UserMessage = ({ content, language, avatar_url }: Props) => {
  return (
    <Paper className="user-message" elevation={2} sx={{ borderRadius: '1rem', padding: '.5rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <div style={{ margin: '.25rem', marginLeft: '.5rem', fontWeight: 900 }} className="blue-highlight-color">
          {
            content.split(' ').map((word: string, index: number) => 
              <ClickableWord key={index} word={word} language={language} />
            )
          }
        </div>
        <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Avatar
            className="chat-avatar"
            alt='pfp'
            src={ avatar_url || './user-avatar.png' }
            sx={{ width: "27px!important", height: "27px!important" }}
          />
        </div>
      </div>
    </Paper>
  );
}
 
export default UserMessage;