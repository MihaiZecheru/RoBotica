import { Button, Paper } from '@mui/material';
import { useState } from 'react';
import StoriesSearch from './StoriesSearch';
import StoryView from './StoryView';
import TStory from '../database/TStory';
import TLanguage from '../database/TLanguage';
import '../styles/reading-page.css';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedComponentDefaultProps } from './base/Authenticator';

const ReadingPage = ({ user_settings }: AuthenticatedComponentDefaultProps) => {
  const navigate = useNavigate();
  const [story, setStory] = useState<TStory | null>(null);
  const language = user_settings?.language as TLanguage || 'Romanian';

  const storySelected = (story: TStory) => {
    setStory(story);
  };

  const backToSearch = () => {
    setStory(null);
  };

  return (
    <div className="reading-page">
      <Paper className="reading-paper" elevation={3}>
        {
          story === null
          ? <StoriesSearch storySelected={storySelected} language={language} />
          : <StoryView language={language} title={story.title} body={story.body} backToSearch={backToSearch} />
        }
      </Paper>
      <div style={{ position: 'fixed', bottom: '.25rem', right: '.75rem' }}>
        <Button color="primary" onClick={() => navigate('/navily')}>Navily</Button>
      </div>
    </div>
  );
}
 
export default ReadingPage;