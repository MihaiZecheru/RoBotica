import { Avatar, Input, Paper } from '@mui/material';
import '../styles/chat-page.css';
import { useRef } from 'react';
import SendButton from './SendButton';
import TLanguage from '../database/TLanguage';
import BotMessage from './BotMessage';
import GetStartingGreeting from '../functions/GetStartingGreeting';
import Database from '../database/Database';
import UserMessage from './UserMessage';
import { AuthenticatedComponentDefaultProps } from './base/Authenticator';

interface Props extends AuthenticatedComponentDefaultProps {
  language: TLanguage;
}

const Chat = ({ language, user }: Props) => {
  const chatInputRef = useRef<HTMLInputElement>(null);

  const send_message = () => {
    const msg = chatInputRef.current!.value;
    console.log(msg);
    chatInputRef.current!.value = '';
    if (msg === '') return;
    Database.AddMessageToConversation(msg);
  };

  return (
    <div className="chat-page">
      <Paper elevation={3} className="chat-window" sx={{ borderRadius: '1rem', position: 'relative' }} >
        <div className='chat-input-large-container'>
          <BotMessage content={GetStartingGreeting(language)} />
          <UserMessage content="test" avatar_url={user?.user_metadata.avatar_url} />
          <div className='chat-input-small-container'>
            <Avatar className="chat-avatar" alt='pfp' src='./default-user-avatar.png' />
            <Input
              inputRef={chatInputRef}
              autoCorrect="off"
              className="chat-input"
              color="primary"
              placeholder="Send a message"
              size="medium"
              type="text"
              sx={{ fontFamily: 'Comfortaa', fontWeight: 900 }}
              onKeyDown={ (e) => {
                if (e.key === 'Enter') send_message();
              } }
            />
            <SendButton onClick={send_message} />
          </div>
        </div>
      </Paper>
    </div>
  );
}
 
export default Chat;