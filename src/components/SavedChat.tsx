import { Button, Paper, Stack } from "@mui/material";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import BotMessage from "./BotMessage";
import UserMessage from "./UserMessage";
import { ConversationID, MessageID } from "../database/ID";
import { useNavigate } from "react-router-dom";
import TLanguage from "../database/TLanguage";
import { TGrammarCheckData } from "../database/TGrammarAndSpellcheck";

interface Props {
  conversation_id: ConversationID;
  last_bot_msg: string;
  last_user_msg: string;
  all_messages: Array<{
    id?: MessageID;
    content: string;
    is_bot: boolean;
    grammar_check?: TGrammarCheckData | null;
  }>;
  avatar_url?: string;
  deleteChat: () => void;
  language: TLanguage;
}

const SavedChat = ({ conversation_id, last_bot_msg, last_user_msg, avatar_url, all_messages, deleteChat, language }: Props) => {
  const navigate = useNavigate();

  const goToChat = () => {
    window.sessionStorage.setItem('conversation_id', conversation_id);
    window.sessionStorage.setItem('messages', JSON.stringify(all_messages));
    navigate('/chat');
  };

  return (
    <Paper elevation={2} sx={{
      padding: '1rem',
      width: 'calc(100% - 2rem)',
      borderRadius: '14px',
    }}>
      <Stack direction='column' sx={{ display: 'flex', justifyContent: 'center', height: '100%' }}>
        <UserMessage content={last_user_msg} language={language} avatar_url={avatar_url} />
        <BotMessage content={last_bot_msg} language={language} />
        <Stack direction="row" spacing={1} sx={{ width: '100%', mt: 0.5 }}>
          <Button
            onClick={goToChat}
            sx={{
              flex: '3 1 0%',
              minWidth: 0,
              py: 1,
              backgroundColor: '#eaf2ff',
              color: 'var(--primary-blue)',
              textTransform: 'none',
              fontSize: '0.95rem',
              fontWeight: 700,
              borderRadius: '10px',
              boxShadow: 'none',
              border: '1px solid transparent',
              '&:hover': {
                backgroundColor: '#dbeafe',
                boxShadow: 'none',
              },
            }}
          >
            View Chat
          </Button>
          <Button
            onClick={deleteChat}
            aria-label="Delete chat"
            title="Delete chat"
            sx={{
              flex: '1 1 0%',
              minWidth: 0,
              py: 1,
              backgroundColor: '#fef2f2',
              color: '#ef4444',
              border: '1px solid #fee2e2',
              borderRadius: '10px',
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                borderColor: '#fca5a5',
                boxShadow: 'none',
              },
            }}
          >
            <DeleteOutlineIcon sx={{ fontSize: 21 }} />
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
 
export default SavedChat;