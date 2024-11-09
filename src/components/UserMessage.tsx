import { Avatar, Paper } from "@mui/material";

interface Props {
  content: string;
  avatar_url?: string;
}

const UserMessage = ({ content, avatar_url }: Props) => {
  return (
    <Paper className="user-message" elevation={2} sx={{ borderRadius: '1rem', padding: '.5rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <span style={{ margin: '.25rem', marginLeft: '.5rem', fontWeight: 900, userSelect: 'none' }}>{content}</span>
        <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Avatar
            className="chat-avatar"
            alt='pfp'
            src={ avatar_url || './user-avatar.png' }
            sx={{ width: "27px!important", height: "27px!important" }}
          />
        </div>
      </div>
    </Paper>
  );
}
 
export default UserMessage;