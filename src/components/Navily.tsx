import { Stack, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import '../styles/navily-item.css';

const Navily = () => {
  const navigate = useNavigate();

  return (
    <div className="navily-container">
      <Stack direction="column" spacing={2}>
        <div className="image-container"><img src="/navily.png" /></div>
        <Box className="navily-item" onClick={() => navigate('/chat')}>Chat</Box>
        <Box className="navily-item" onClick={() => navigate('/reading')}>Reading</Box>
        <Box className="navily-item" onClick={() => navigate('/chat/saved')}>Saved Chats</Box>
        <Box className="navily-item" onClick={() => navigate('/account')}>Account</Box>
      </Stack>
    </div>
  );
}

export default Navily;