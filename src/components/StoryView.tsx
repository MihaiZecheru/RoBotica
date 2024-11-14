import { Button } from '@mui/material';
import ClickableWord from './ClickableWord';
import TLanguage from '../database/TLanguage';
import '../styles/reading-page.css';
import ClickableSentence from './ClickableSentence';
import { AuthenticatedComponentDefaultProps } from './base/Authenticator';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Database from '../database/Database';
import TStory from '../database/TStory';
import { StoryID } from '../database/ID';

interface Props {
  language: TLanguage;
  title: string;
  body: string;
  /**
   * Goes back to the story-search page.
   */
  backToSearch: () => void;
}

function getStartOfSentence(paragraph: string, index: number): number {
  const words = paragraph.split(' ');
  
  let i = index - 1;
  while (i > 0 && !words[i].endsWith('.')) {
    i--;
  }

  return i == 0 ? 0 : i + 1;
}

const StoryView = (_: AuthenticatedComponentDefaultProps) => {
  const navigate = useNavigate();
  const [story, setStory] = useState<TStory | null>(null);
  const story_id = useParams().id;

  useEffect(() => {
    if (story_id === undefined) {
      navigate('/reading');
      return;
    }

    if (window.sessionStorage.getItem('stories')) {
      const _stories = JSON.parse(window.sessionStorage.getItem('stories') as string);
      const story = _stories.find((story: TStory) => story.id === story_id);

      if (story) {
        setStory(story);
        return;
      }
    }

    Database.GetStoryByID(story_id as StoryID).then((story: TStory) => {
      setStory(story);
    });
  }, [navigate]);

  if (story === null) {
    return <></>;
  }

  return (
    <div style={{ padding: '1rem', width: 'calc(100% - 2rem)', height: 'calc(100% - 2rem)' }}>
      <h1 style={{ paddingLeft: '.25rem', paddingRight: '.25rem' }}>{story.title}</h1>
      <div className="story-body">
          {
            story.body.split('\n').map((paragraph: string, index: number) => 
              <div key={index + "ab"}>
                <div key={index + "a"}>
                  {
                    paragraph.split(' ').map((word: string, index: number) => {
                      // If the word is the end of a sentence, make the period be a ClickableSentence.
                      // When the period is clicked, the entire sentence will be translated.
                      if (word.endsWith('.')) {
                        return <>
                          <ClickableWord key={index + "b"} word={word.substring(0, word.length - 1)} language={story.language} />
                          <ClickableSentence key={index + "-sentence" } language={story.language} sentence={paragraph.split(' ').slice(getStartOfSentence(paragraph, index), index + 1).join(' ')} />
                        </>;
                      } else {
                        return <ClickableWord key={index + "ba"} word={word} language={story.language} />;
                      }
                    }
                    )
                  }
                </div>
                <br />
              </div>
            )
          }
      </div>
      <div className='btn-container'>
        <Button
          variant='contained'
          color='primary'
          onClick={() => navigate('/reading')}
          sx={{
            marginTop: '1rem'
          }}
        >Back to search</Button>
      </div>
      <div style={{ position: 'fixed', bottom: '12px', right: '.75rem' }}>
        <Button color="primary" onClick={() => navigate('/navily')}>Navily</Button>
      </div>
    </div>
  );
}
 
export default StoryView;