import { Button, Paper, Stack } from "@mui/material";
import BotMessage from "./BotMessage";
import UserMessage from "./UserMessage";
import { ConversationID } from "../database/ID";
import { useNavigate } from "react-router-dom";
import TLanguage from "../database/TLanguage";

interface Props {
  conversation_id: ConversationID;
  last_bot_msg: string;
  last_user_msg: string;
  all_messages: Array<{ content: string, is_bot: boolean }>;
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
    <Paper elevation={3} sx={{
      padding: '1rem',
      width: 'calc(100% - 2rem)',
    }}>
      <Stack direction='column' sx={{ display: 'flex', justifyContent: 'center', height: '100%' }}>
        <UserMessage content={last_user_msg} language={language} avatar_url={avatar_url} />
        <BotMessage content={last_bot_msg} language={language} />
        <Button variant="contained" color="primary" sx={{ width: '100%' }} onClick={goToChat}>View Chat</Button>
        <Button variant="contained" color="error" sx={{ width: '100%', marginTop: '.5rem' }} onClick={deleteChat}>Delete Chat</Button>
      </Stack>
    </Paper>
  );
}
 
export default SavedChat;