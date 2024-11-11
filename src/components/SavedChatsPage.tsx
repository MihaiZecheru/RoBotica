import { useEffect, useState } from "react";
import { AuthenticatedComponentDefaultProps } from "./base/Authenticator";
import SavedChat from "./SavedChat";
import supabase from "../database/supabase-config";
import { ConversationID } from "../database/ID";
import { Button, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";

type ConversationPreview = {
  id: ConversationID;
  last_bot_msg: string;
  last_user_msg: string;
  all_messages: Array<{ content: string, is_bot: boolean }>;
};

const SavedChatsPage = ({ user }: AuthenticatedComponentDefaultProps) => {
  const navigate = useNavigate();
  const [savedChats, setSavedChats] = useState<ConversationPreview[]>([]);
  
  async function getConversationPreviews(): Promise<ConversationPreview[] | null> {
    const { data, error } = await supabase
      .from('Conversations')
      .select(`
        id,
        user_id,
        created_at,
        Messages(id, message_content, is_bot, created_at)
      `)
      .eq('user_id', user?.id);

    if (error) {
      console.error("Error fetching messages:", error.message);
      return null;
    }
  
    if (!data) return null;

    return data.map((conversation: any) => {
      const msg_count = conversation.Messages.length;
      const msgs = conversation.Messages.sort((a: any, b: any) => {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); // oldest to newest
      });

      return {
        id: conversation.id as ConversationID,
        last_bot_msg: msgs[msg_count - 1].message_content,
        last_user_msg: msgs[msg_count - 2].message_content,
        all_messages: msgs.map((msg: any) => {
          return {
            content: msg.message_content,
            is_bot: msg.is_bot
          };
        })
      }
    });
  }

  useEffect(() => {
    if (!user) return;
    getConversationPreviews().then((conversations) => {
      if (conversations) setSavedChats(conversations);
    });
  }, [user]);
  
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)', // 3 equal-width columns
          gridGap: '3rem',
          padding: '1rem',
          overflowX: 'hidden',
          paddingBottom: '3.5rem',
        }} className="hide-scrollbar-y">
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