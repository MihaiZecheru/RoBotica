import { Avatar, Button, Input, Paper } from '@mui/material';
import '../styles/chat-page.css';
import { useEffect, useRef, useState } from 'react';
import SendButton from './SendButton';
import TLanguage from '../database/TLanguage';
import BotMessage from './BotMessage';
import GetStartingGreeting from '../functions/GetStartingGreeting';
import Database from '../database/Database';
import UserMessage from './UserMessage';
import { AuthenticatedComponentDefaultProps } from './base/Authenticator';
import { ConversationID } from '../database/ID';
import GetBotResponseToMessage from '../functions/GetBotResponse';
import BotTyping from './BotTyping';

const MINIMUM_BOT_TYPING_TIME: number = 2000; // ms

interface Props extends AuthenticatedComponentDefaultProps {
  language: TLanguage;
}

const NewChatPage = ({ language, user }: Props) => {
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatMessageContainer = useRef<HTMLDivElement>(null);
  const [conversation_id, setConversationID] = useState<ConversationID | null>(null);
  const [messages, setMessages] = useState<Array<{ content: string, is_bot: boolean }>>([{ content: GetStartingGreeting(language), is_bot: true }]);
  const [botIstyping, setBotIsTyping] = useState<boolean>(false);
  const [inputDisabled, setInputDisabled] = useState<boolean>(false);
  const user_skill: 'beginner' | 'intermediate' = 'beginner';
  const user_gender: 'woman' | 'man' = 'man';
  
  // Used for when a message is sent during a new conversation
  // The user will not have a conversation ID until the first message is sent,
  // And the setState won't set the conversation_id until the send_message function is done running,
  // But the conversation id is required within that function
  let _conversation_id: ConversationID | null = null;

  useEffect(() => {
    // Scroll to the bottom whenever the messages changes or the bot is typing
    if (chatMessageContainer.current) {
      chatMessageContainer.current.scrollTop = chatMessageContainer.current.scrollHeight;
    }
  }, [messages, botIstyping]);

  useEffect(() => {
    setTimeout(() => chatInputRef.current?.focus(), 0);

    // If the page was refreshed, the conversation_id will be in local storage
    if (conversation_id === null && sessionStorage.getItem('conversation_id') && sessionStorage.getItem('messages')) {
      setConversationID(sessionStorage.getItem('conversation_id') as ConversationID);
      setMessages(JSON.parse(sessionStorage.getItem('messages')!));
    }
  }, []);

  const send_message = () => {
    const msg = chatInputRef.current!.value;
    chatInputRef.current!.value = '';
    
    if (msg === '') return;
    setInputDisabled(true);
    const new_messages = [...messages, { content: msg, is_bot: false }];
    setMessages(new_messages);
    sessionStorage.setItem('messages', JSON.stringify(new_messages));

    // Timestamp making sure the bot is typing for at least 500ms
    const start_time = Date.now();
    setTimeout(() => {
      setBotIsTyping(true);
    }, 250);
    
    if (conversation_id === null) {
      Database.CreateConversation().then((id: ConversationID) => {
        setConversationID(id);
        sessionStorage.setItem('conversation_id', id);
        _conversation_id = id;
        Database.AddMessageToConversation(msg, id, false);
      });
    } else {
      Database.AddMessageToConversation(msg, conversation_id!, false);
    }

    GetBotResponseToMessage(msg, language, user_skill, user_gender, messages).then(async (response: string) => {
      const end_time = Date.now();
      const time_diff = end_time - start_time;
      if (time_diff < MINIMUM_BOT_TYPING_TIME) {
        await new Promise((res) => setTimeout(res, MINIMUM_BOT_TYPING_TIME - time_diff));
      }
      
      setBotIsTyping(false);
      setMessages([...new_messages, { content: response, is_bot: true }]);
      sessionStorage.setItem('messages', JSON.stringify([...new_messages, { content: response, is_bot: true }]));
      setInputDisabled(false);
      setTimeout(() => chatInputRef.current?.focus(), 0);
      Database.AddMessageToConversation(
        response,
        conversation_id === null ? _conversation_id! : conversation_id,
        true);
    });
  };

  const createNewConversation = () => {
    // Do not create the new conversation in the DB right away, because it will be created when
    // the user sends the first message.
    setConversationID(null);
    _conversation_id = null;
    sessionStorage.removeItem('conversation_id');
    sessionStorage.removeItem('messages');
    setMessages([]);
    setTimeout(() => chatInputRef.current?.focus(), 0);
  };

  return (
    <div className="chat-page">
      <Paper elevation={3} className="chat-window" sx={{ borderRadius: '1rem', position: 'relative' }} >
        <div className='chat-input-large-container'>
          <div className='chat-messages-container' ref={chatMessageContainer}>
            {
              messages.map((message: { content: string, is_bot: boolean }, index: number) => {
                if (message.is_bot) {
                  return <BotMessage key={index} content={message.content} />;
                } else {
                  return <UserMessage key={index} content={message.content} avatar_url={user?.user_metadata.avatar_url} />;
                }
              })
            }

            { botIstyping && <BotTyping /> }
          </div>

          <div className='chat-input-box'>
            <Avatar className="chat-avatar" alt='pfp' src={user?.user_metadata.avatar_url || './default-user-avatar.png'} />
            <Input
              inputRef={chatInputRef}
              autoCorrect="off"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck="false"
              className="chat-input"
              color="primary"
              placeholder="Send a message"
              size="medium"
              type="text"
              disabled={inputDisabled}
              sx={{ fontFamily: 'Comfortaa', fontWeight: 900 }}
              onKeyDown={ (e) => {
                if (e.key === 'Enter') send_message();
              } }
              inputProps={{ maxLength: 150 }}
            />
            <SendButton onClick={send_message} />
          </div>
        </div>
      </Paper>

      <Button type='button' onClick={createNewConversation} sx={{ position: 'fixed', bottom: '1rem', left: '1rem' }}>New Conversation</Button>
    </div>
  );
}
 
export default NewChatPage;