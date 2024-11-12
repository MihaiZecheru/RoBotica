import { Button, Paper } from '@mui/material';
import '../../styles/landing.css';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();
  
  return (
    <div className="landing-page">
      <div className="landing-message">
        <img src="/robotica.png" width="200px" className="landing-image" alt="robotica avatar" />
        <Paper elevation={3} className="landing-paper">
          <h3>Hey, I'm RoBotica. Let's talk!</h3>
          <Button
            variant="contained"
            color="inherit"
            className="landing-cta-btn"
            onClick={() => navigate('/chat')}
          >Sure!</Button>
        </Paper>
      </div>
    </div>
  );
}
 
export default Landing;