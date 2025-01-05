import { Stack, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import '../styles/navily.css';
import { GetUserID } from "../database/GetUser";

const Navily = () => {
  const navigate = useNavigate();

  const handleImgClick = async () => {
    if ((await GetUserID()) === process.env.REACT_APP_ADMIN_ID) {
      navigate('/create-story');
    }
  };

  return (
    <div className="navily-container">
      <Stack direction="column" spacing={2}>
        <div className="image-container">
          <img src="/navily.png" style={{ width: '256px', height: '256px' }} onClick={handleImgClick} />
        </div>
        <Box className="navily-item" onClick={() => navigate('/chat')}>Chat</Box>
        <Box className="navily-item" onClick={() => navigate('/reading')}>Reading</Box>
        <Box className="navily-item" onClick={() => navigate('/music')}>Music</Box>
        <Box className="navily-item" onClick={() => navigate('/chat/saved')}>Saved Chats</Box>
        <Box className="navily-item" onClick={() => navigate('/account')}>Account</Box>
      </Stack>
    </div>
  );
}

export default Navily;