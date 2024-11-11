import { Button } from '@mui/material';
import ClickableWord from './ClickableWord';
import TLanguage from '../database/TLanguage';
import '../styles/reading-page.css';

interface Props {
  language: TLanguage;
  title: string;
  body: string;
  /**
   * Goes back to the story-search page.
   */
  backToSearch: () => void;
}

const StoryView = ({ language, title, body, backToSearch }: Props) => {
  return (
    <>
      <h1 style={{ paddingLeft: '.25rem', paddingRight: '.25rem' }}>{title}</h1>
      <div className="story-body">
          {
            body.split('\n').map((paragraph: string, index: number) => 
              <div>
                <div key={index}>
                  {
                    paragraph.split(' ').map((word: string, index: number) => 
                      <ClickableWord key={index + 700} word={word} language={language} />
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
          onClick={backToSearch}
          sx={{
            marginTop: '1rem'
          }}
        >Back to search</Button>
      </div>
    </>
  );
}
 
export default StoryView;