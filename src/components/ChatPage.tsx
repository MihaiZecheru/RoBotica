import { Avatar, Button, Input, Paper, Tooltip } from '@mui/material';
import '../styles/chat-page.css';
import { useEffect, useRef, useState } from 'react';
import SendButton from './SendButton';
import BotMessage from './BotMessage';
import GetStartingGreeting from '../functions/GetStartingGreeting';
import Database from '../database/Database';
import UserMessage from './UserMessage';
import { AuthenticatedComponentDefaultProps } from './base/Authenticator';
import { ConversationID, MessageID } from '../database/ID';
import { TGrammarCheckData } from '../database/TGrammarAndSpellcheck';
import TMessage from '../database/TMessage';
import BotTyping from './BotTyping';
import Bot from '../functions/Bot';
import { useNavigate } from 'react-router-dom';
import isMobile from '../functions/isMobile';
import SpeechToTextButton from './SpeechToTextButton';
import WordSearchModal from './WordSearchModal';

interface ChatPageMessage {
  id?: MessageID;
  content: string;
  is_bot: boolean;
  grammar_check?: TGrammarCheckData | null;
}

const MINIMUM_BOT_TYPING_TIME: number = 2000; // ms

const ChatPage = ({ user, user_settings }: AuthenticatedComponentDefaultProps) => {
  const navigate = useNavigate();
  const starting_message: ChatPageMessage = { content: GetStartingGreeting(user_settings?.language || 'Romanian'), is_bot: true };
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatMessageContainer = useRef<HTMLDivElement>(null);
  const [conversation_id, setConversationID] = useState<ConversationID | null>(null);
  const [messages, setMessages] = useState<Array<ChatPageMessage>>([starting_message]);
  const checkingMessageIds = useRef<Set<string>>(new Set());
  const [botIstyping, setBotIsTyping] = useState<boolean>(false);
  const [inputDisabled, setInputDisabled] = useState<boolean>(false);
  const [wordSearchModalIsOpen, setWordSearchModalIsOpen] = useState<boolean>(false);
  const prevWordSearchModalIsOpen = useRef(wordSearchModalIsOpen);

  const focusChatInput = () => {
    setTimeout(() => chatInputRef.current?.focus(), 0);
  };

  useEffect(() => {
    if (prevWordSearchModalIsOpen.current && !wordSearchModalIsOpen) {
      focusChatInput();
    }
    prevWordSearchModalIsOpen.current = wordSearchModalIsOpen;
  }, [wordSearchModalIsOpen]);

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
    focusChatInput();

    // If the page was refreshed, the conversation_id will be in local storage
    if (conversation_id === null && sessionStorage.getItem('conversation_id') && sessionStorage.getItem('messages')) {
      setConversationID(sessionStorage.getItem('conversation_id') as ConversationID);
      if (JSON.parse(sessionStorage.getItem('messages')!)[0].content !== starting_message.content) {
        setMessages([starting_message, ...JSON.parse(sessionStorage.getItem('messages')!)]);
      } else {
        setMessages(JSON.parse(sessionStorage.getItem('messages')!));
      }
    }
  }, [conversation_id]);

  useEffect(() => {
    const currentLanguage = user_settings?.language || 'Romanian';
    messages.forEach((msg) => {
      const messageId = msg.id;
      if (!msg.is_bot && messageId && msg.grammar_check === undefined) {
        if (checkingMessageIds.current.has(messageId)) return;
        checkingMessageIds.current.add(messageId);

        Database.GetGrammarAndSpellcheck(messageId).then(async (existingCheck) => {
          if (existingCheck) {
            setMessages((prev) => {
              const updated = prev.map((m) => (m.id === messageId ? { ...m, grammar_check: existingCheck } : m));
              sessionStorage.setItem('messages', JSON.stringify(updated));
              return updated;
            });
          } else {
            // Not in database: generate, save, and display
            try {
              const { mistake_count, corrected_message } = await Bot.PerformGrammarAndSpellingCheck(msg.content, currentLanguage);
              let modal_message: string | null = null;
              if (mistake_count > 0) {
                const s = mistake_count > 1 ? 's' : '';
                modal_message = `Your message contains ${mistake_count} mistake${s}.\n\n\nOriginal: ${msg.content}\n\nCorrected: ${corrected_message}`;
              }
              await Database.AddGrammarAndSpellcheck(messageId, mistake_count, modal_message);
              const grammar_check: TGrammarCheckData = { mistake_count, modal_message };
              setMessages((prev) => {
                const updated = prev.map((m) => (m.id === messageId ? { ...m, grammar_check } : m));
                sessionStorage.setItem('messages', JSON.stringify(updated));
                return updated;
              });
            } catch (err) {
              console.error("Error generating missing grammar check:", err);
            }
          }
        });
      }
    });
  }, [messages, user_settings?.language]);

  const send_message = () => {
    const msg = chatInputRef.current!.value;
    chatInputRef.current!.value = '';
    
    if (msg === '') return;
    setInputDisabled(true);
    const user_msg: ChatPageMessage = { content: msg, is_bot: false };
    const current_messages = [...messages, user_msg];
    setMessages(current_messages);
    sessionStorage.setItem('messages', JSON.stringify(current_messages));

    // Timestamp making sure the bot is typing for at least 500ms
    const start_time = Date.now();
    setTimeout(() => {
      setBotIsTyping(true);
    }, 250);
    
    let addMessagePromise: Promise<TMessage>;
    if (conversation_id === null && _conversation_id === null) {
      addMessagePromise = Database.CreateConversation().then((id: ConversationID) => {
        setConversationID(id);
        sessionStorage.setItem('conversation_id', id);
        _conversation_id = id;
        return Database.AddMessageToConversation(msg, id, false);
      });
    } else {
      addMessagePromise = Database.AddMessageToConversation(msg, conversation_id || _conversation_id!, false);
    }

    const currentLanguage = user_settings?.language || 'Romanian';

    // Perform grammar check in the background
    addMessagePromise.then(async (addedMessage) => {
      user_msg.id = addedMessage.id;
      try {
        const { mistake_count, corrected_message } = await Bot.PerformGrammarAndSpellingCheck(msg, currentLanguage);
        let modal_message: string | null = null;
        if (mistake_count > 0) {
          const s = mistake_count > 1 ? 's' : '';
          modal_message = `Your message contains ${mistake_count} mistake${s}.\n\n\nOriginal: ${msg}\n\nCorrected: ${corrected_message}`;
        }
        await Database.AddGrammarAndSpellcheck(addedMessage.id, mistake_count, modal_message);
        const grammar_check: TGrammarCheckData = { mistake_count, modal_message };
        user_msg.grammar_check = grammar_check;

        setMessages((prev) => {
          const updated = prev.map((m) => {
            if (m === user_msg || (m.id && m.id === addedMessage.id)) {
              return { ...m, id: addedMessage.id, grammar_check };
            }
            return m;
          });
          sessionStorage.setItem('messages', JSON.stringify(updated));
          return updated;
        });
      } catch (err) {
        console.error("Background grammar check error:", err);
      }
    }).catch((err) => {
      console.error("Failed to add message to conversation:", err);
    });

    Bot.GetBotResponseToMessage(msg, currentLanguage, user_settings?.level || 'Beginner', user_settings?.gender || 'Man', messages).then(async (response: string) => {
      const end_time = Date.now();
      const time_diff = end_time - start_time;
      if (time_diff < MINIMUM_BOT_TYPING_TIME) {
        await new Promise((res) => setTimeout(res, MINIMUM_BOT_TYPING_TIME - time_diff));
      }
      
      setBotIsTyping(false);
      const bot_msg: ChatPageMessage = { content: response, is_bot: true };
      setMessages((prev) => {
        const updated = [...prev, bot_msg];
        sessionStorage.setItem('messages', JSON.stringify(updated));
        return updated;
      });
      setInputDisabled(false);
      setTimeout(() => chatInputRef.current?.focus(), 0);
      const targetConvId = conversation_id === null ? _conversation_id : conversation_id;
      if (targetConvId) {
        Database.AddMessageToConversation(
          response,
          targetConvId,
          true
        ).then((addedBotMsg) => {
          bot_msg.id = addedBotMsg.id;
        });
      }
    });
  };

  const createNewConversation = () => {
    // Do not create the new conversation in the DB right away, because it will be created when
    // the user sends the first message.
    sessionStorage.removeItem('conversation_id');
    sessionStorage.removeItem('messages');
    setConversationID(null);
    _conversation_id = null;
    setMessages([starting_message]);
    setTimeout(() => chatInputRef.current?.focus(), 0);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Focus input on Ctrl+/
    if (e.ctrlKey && (e.key === '/' || e.key === 'k')) {
      e.preventDefault();
      chatInputRef.current?.focus();
    } else if (e.ctrlKey && e.key === ' ') {
      e.preventDefault();
      setWordSearchModalIsOpen(!wordSearchModalIsOpen);
    }
  };

  return (
    <div className="chat-page" onKeyDown={onKeyDown} tabIndex={0}>
      { user_settings?.language && (
        <WordSearchModal
          language={user_settings?.language}
          isOpen={wordSearchModalIsOpen}
          setIsOpen={setWordSearchModalIsOpen}
          onClose={focusChatInput}
        />
      )}
      <Paper elevation={3} className="chat-window" sx={{ borderRadius: isMobile() ? '0' : '1rem', position: 'relative' }} >
        <div className='chat-input-large-container'>
          <div className='chat-messages-container' ref={chatMessageContainer}>
            {
              messages.map((message: ChatPageMessage, index: number) => {
                if (message.is_bot) {
                  return <BotMessage key={index} content={message.content} language={user_settings?.language || 'Romanian'} />;
                } else {
                  return (
                    <UserMessage
                      key={index}
                      content={message.content}
                      language={user_settings?.language || 'Romanian'}
                      avatar_url={user?.user_metadata.avatar_url}
                      grammar_check={message.grammar_check}
                    />
                  );
                }
              })
            }

            { botIstyping && <BotTyping /> }
          </div>

          <div className='chat-input-box'>
            <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '.5rem' }}>
              <Tooltip title="Account" placement="top-start">
                <Avatar
                  className="chat-avatar"
                  alt='pfp'
                  src={user?.user_metadata.avatar_url || '/default-user-avatar.png'}
                  sx={{ width: "27px!important", height: "27px!important", cursor: 'pointer' }}
                  onClick={() => {
                    navigate('/account');
                  }}
                />
              </Tooltip>
            </div>
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
              inputProps={{ maxLength: 150, sx: { '::placeholder': { userSelect: 'none' } }}}
            />
            <SpeechToTextButton language={user_settings?.language} onTranscriptionComplete={(transcribed_text: string) => {
              chatInputRef.current!.value = transcribed_text;
            }}/>
            <SendButton onClick={send_message} />
          </div>
        </div>
      </Paper>

      {
        /* only show button if user is not on mobile */
        !isMobile() &&
        <div style={{ position: 'fixed', bottom: '1rem', right: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Button type='button' onClick={createNewConversation}>New Conversation</Button>
          <span style={{ color: 'var(--primary-blue)' }}>●</span>
          <Tooltip title={`Quickly look up a word in ${user_settings?.language} (Ctrl+Space)`}>
            <Button type='button' onClick={() => setWordSearchModalIsOpen(true)}>Word Lookup</Button>
          </Tooltip>
        </div>
      }
    </div>
  );
}
 
export default ChatPage;