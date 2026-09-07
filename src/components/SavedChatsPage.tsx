import { CSSProperties, useEffect, useState } from "react";
import { AuthenticatedComponentDefaultProps } from "./base/Authenticator";
import SavedChat from "./SavedChat";
import supabase from "../database/supabase-config";
import { ConversationID, MessageID, UserID } from "../database/ID";
import { useNavigate } from "react-router-dom";
import Database from "../database/Database";
import isMobile from "../functions/isMobile";
import { TGrammarCheckData } from "../database/TGrammarAndSpellcheck";
import { Box, Button, CircularProgress, Paper, Typography } from "@mui/material";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";

type ConversationPreview = {
  id: ConversationID;
  last_bot_msg: string;
  last_user_msg: string;
  all_messages: Array<{
    id?: MessageID;
    content: string;
    is_bot: boolean;
    grammar_check?: TGrammarCheckData | null;
  }>;
};

const SavedChatsPage = ({ user, user_settings }: AuthenticatedComponentDefaultProps) => {
  const navigate = useNavigate();
  const [savedChats, setSavedChats] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  async function getConversationPreviews(): Promise<ConversationPreview[] | null> {
    if (!user) return null;
    return await Database.GetAllUserConversations(user.id as UserID);
  }

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getConversationPreviews().then((conversations) => {
      if (conversations) setSavedChats(conversations);
      setLoading(false);
    }).catch((err) => {
      console.error("Error fetching conversations:", err);
      setLoading(false);
    });
  }, [user, navigate]);
  
  let savedChatsContainerStyles: CSSProperties = {
    display: 'grid',
    gridGap: '3rem',
    padding: '1rem',
    overflowX: 'hidden',
    paddingBottom: '3.5rem',
  };

  if (isMobile()) {
    savedChatsContainerStyles = {
      ...savedChatsContainerStyles,
      gridTemplateColumns: 'repeat(1, 1fr)',
      width: '80%'
    };
  } else {
    savedChatsContainerStyles = {
      ...savedChatsContainerStyles,
      gridTemplateColumns: 'repeat(3, 1fr)'
    }; 
  }
  
  return (
    <div className="saved-chats" style={{
      width: '100%',
      height: '100%',
    }}>
      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
            width: "100%",
          }}
        >
          <CircularProgress size={36} sx={{ color: "var(--primary-blue)" }} />
        </Box>
      ) : savedChats.length === 0 ? (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            minHeight: "70vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
            boxSizing: "border-box",
          }}
        >
          <Paper
            elevation={0}
            sx={{
              py: 6,
              px: { xs: 3, sm: 5 },
              maxWidth: "460px",
              width: "100%",
              textAlign: "center",
              borderRadius: "20px",
              border: "1px dashed #cbd5e1",
              backgroundColor: "#ffffff",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              boxShadow: "0 2px 12px rgba(0, 0, 0, 0.03)",
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                backgroundColor: "#eff6ff",
                border: "1px solid #dbeafe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--primary-blue)",
              }}
            >
              <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: "#1e293b",
                letterSpacing: "-0.01em",
                fontSize: { xs: "1.3rem", sm: "1.5rem" },
              }}
            >
              No Saved Chats
            </Typography>
            <Typography sx={{ color: "#64748b", fontSize: "0.95rem", lineHeight: 1.6 }}>
              You haven't saved any conversations yet. Save chats during your practice sessions to review grammar corrections and vocabulary later.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/chat")}
              sx={{
                mt: 1,
                backgroundColor: "var(--primary-blue)",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.95rem",
                borderRadius: "12px",
                px: 3.5,
                py: 1.2,
                boxShadow: "none",
                "&:hover": {
                  backgroundColor: "#005bb5",
                  boxShadow: "0 4px 12px rgba(0, 91, 181, 0.25)",
                },
              }}
            >
              Start a Chat
            </Button>
          </Paper>
        </Box>
      ) : (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          paddingTop: '1.5rem',
        }}>
          <div style={savedChatsContainerStyles} className="hide-scrollbar-y">
            {
              savedChats.map((chat, index) => {
                return (
                  <SavedChat
                    key={chat.id || index}
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
      )}
    </div> 
  );
};
 
export default SavedChatsPage;