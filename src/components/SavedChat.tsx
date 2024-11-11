import { Button, Paper, Stack } from "@mui/material";
import BotMessage from "./BotMessage";
import UserMessage from "./UserMessage";
import { ConversationID } from "../database/ID";
import { useNavigate } from "react-router-dom";

interface Props {
  conversation_id: ConversationID;
  last_bot_msg: string;
  last_user_msg: string;
  all_messages: Array<{ content: string, is_bot: boolean }>;
  avatar_url?: string;
  deleteChat: () => void;
}

const SavedChat = ({ conversation_id, last_bot_msg, last_user_msg, avatar_url, all_messages, deleteChat }: Props) => {
  const navigate = useNavigate();

  const goToChat = () => {
    window.sessionStorage.setItem('conversation_id', conversation_id);
    window.sessionStorage.setItem('messages', JSON.stringify(all_messages));
    navigate('/chat');
  };

  return (
    <Paper elevation={3} sx={{
      padding: '1rem',
      width: '25vw',
    }}>
      <Stack direction='column' sx={{ display: 'flex', justifyContent: 'center', height: '100%' }}>
        { /* TODO: FIX LANGUAGE */ }
        <UserMessage content={last_user_msg} language="Romanian" avatar_url={avatar_url} />
        <BotMessage content={last_bot_msg} language="Romanian" />
        <Button variant="contained" color="primary" sx={{ width: '100%' }} onClick={goToChat}>View Chat</Button>
        <Button variant="contained" color="error" sx={{ width: '100%', marginTop: '.5rem' }} onClick={deleteChat}>Delete Chat</Button>
      </Stack>
    </Paper>
  );
}
 
export default SavedChat;