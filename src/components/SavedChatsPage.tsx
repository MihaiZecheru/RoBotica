import { CSSProperties, useEffect, useState } from "react";
import { AuthenticatedComponentDefaultProps } from "./base/Authenticator";
import SavedChat from "./SavedChat";
import supabase from "../database/supabase-config";
import { ConversationID, UserID } from "../database/ID";
import { Button, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Database from "../database/Database";

type ConversationPreview = {
  id: ConversationID;
  last_bot_msg: string;
  last_user_msg: string;
  all_messages: Array<{ content: string, is_bot: boolean }>;
};

const SavedChatsPage = ({ user, user_settings }: AuthenticatedComponentDefaultProps) => {
  const navigate = useNavigate();
  const [savedChats, setSavedChats] = useState<ConversationPreview[]>([]);
  
  async function getConversationPreviews(): Promise<ConversationPreview[] | null> {
    if (!user) return null;
    return await Database.GetAllUserConversations(user.id as UserID)
  }

  useEffect(() => {
    if (!user) return;
    getConversationPreviews().then((conversations) => {
      if (conversations) setSavedChats(conversations);
    });
  }, [user, navigate]);
  
  let savedChatsContainerStyles: CSSProperties = {
    display: 'grid',
    gridGap: '3rem',
    padding: '1rem',
    overflowX: 'hidden',
    paddingBottom: '3.5rem',
  };

  if (window.innerWidth >= 769) {
    savedChatsContainerStyles = {
      ...savedChatsContainerStyles,
      gridTemplateColumns: 'repeat(3, 1fr)'
    }; 
  } else {
    savedChatsContainerStyles = {
      ...savedChatsContainerStyles,
      gridTemplateColumns: 'repeat(1, 1fr)',
      width: '80%'
    }; 
  }
  
  return (
    <div className="saved-chats" style={{
      width: '100%',
    }}>
      <Paper elevation={3} sx={{
        position: 'fixed',
        top: 0,
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        zIndex: 99,
      }}>
        <Button type='button' onClick={() => navigate('/navily')}>Navily</Button>
      </Paper>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        width: '100vw',
        height: '100vh',
        marginTop: '2.5rem',
      }}>
        <div style={savedChatsContainerStyles} className="hide-scrollbar-y">
          {
            savedChats.map((chat, index) => {
              return (
                <SavedChat
                  key={index}
                  conversation_id={chat.id}
                  last_bot_msg={chat.last_bot_msg}
                  last_user_msg={chat.last_user_msg}
                  all_messages={chat.all_messages}
                  avatar_url={user?.user_metadata.avatar_url}
                  language={user_settings?.language || 'Romanian'}
                  deleteChat={async () => {
                    const { error } = await supabase
                      .from('Conversations')
                      .delete()
                      .eq('id', chat.id);
                
                    if (error) {
                      console.error("Error deleting conversation:", error.message);
                      return;
                    }

                    const newChats = savedChats.filter((_, i) => i !== index);
                    setSavedChats(newChats);
                    sessionStorage.clear();
                  }}
                />
              );
            })
          }
        </div>
      </div>
    </div> 
  );
}
 
export default SavedChatsPage;