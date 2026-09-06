import { Avatar, Paper } from "@mui/material";
import ClickableWord from "./ClickableWord";
import TLanguage from "../database/TLanguage";
import { TGrammarCheckData } from "../database/TGrammarAndSpellcheck";
import GrammarCheckIcon from "./GrammarCheckIcon";

interface Props {
  content: string;
  language: TLanguage;
  avatar_url?: string;
  grammar_check?: TGrammarCheckData | null;
}

const UserMessage = ({ content, language, avatar_url, grammar_check }: Props) => {
  return (
    <Paper className="user-message" elevation={2} sx={{ borderRadius: '1rem', padding: '.5rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        {grammar_check && (
          <div style={{ marginRight: '0.275rem', display: 'flex', alignItems: 'center' }}>
            <GrammarCheckIcon
              mistake_count={grammar_check.mistake_count}
              modal_message={grammar_check.modal_message}
              language={language}
            />
          </div>
        )}
        <div style={{ margin: '.25rem', marginLeft: '.5rem', fontWeight: 900 }}>
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
            src={ avatar_url || '/default-user-avatar.png' }
            sx={{ width: "27px!important", height: "27px!important" }}
          />
        </div>
      </div>
    </Paper>
  );
}
 
export default UserMessage;