import { Avatar, Paper } from '@mui/material';
import '../styles/BotTyping.css';

const BotTyping = () => {
  return (
    <Paper className="bot-message" elevation={2} sx={{ borderRadius: '1rem', padding: '.5rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Avatar className="chat-avatar" alt='pfp' src='/robotica.png' />
        <div className="loading-container">
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
        </div>
      </div>
    </Paper>
  );
}
 
export default BotTyping;