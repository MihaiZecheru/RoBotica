import { Paper } from '@mui/material';
import { useState } from 'react';
import StoriesSearch from './StoriesSearch';
import StoryView from './StoryView';
import TStory from '../database/TStory';
import TLanguage from '../database/TLanguage';
import '../styles/reading-page.css';

interface Props {
  language: TLanguage;
}

const ReadingPage = ({ language }: Props) => {
  const [story, setStory] = useState<TStory | null>(null);

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
    </div>
  );
}
 
export default ReadingPage;