import { Avatar, Paper } from "@mui/material";
import '../styles/blue-highlight-color.css';

interface Props {
  content: string;
}

const BotMessage = ({ content }: Props) => {
  return (
    <Paper className="bot-message" elevation={2} sx={{ borderRadius: '1rem', padding: '.5rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Avatar className="chat-avatar" alt='pfp' src='./robotica.png' />
        <span style={{ margin: '.25rem', fontWeight: 900 }} className="blue-highlight-color">{content}</span>
      </div>
    </Paper>
  );
}
 
export default BotMessage;