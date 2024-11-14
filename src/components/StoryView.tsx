import { Button } from '@mui/material';
import ClickableWord from './ClickableWord';
import TLanguage from '../database/TLanguage';
import '../styles/reading-page.css';
import ClickableSentence from './ClickableSentence';

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
                    paragraph.split(' ').map((word: string, index: number) => {
                      // If the word is the end of a sentence, make the period be a ClickableSentence.
                      // When the period is clicked, the entire sentence will be translated.
                      if (word.endsWith('.')) {
                        return <>
                          <ClickableWord key={index + 700} word={word.substring(0, word.length - 1)} language={language} />
                          <ClickableSentence key={index + 700 + "-sentence" } language={language} sentence={paragraph.split(' ').slice(getStartOfSentence(paragraph, index), index + 1).join(' ')} />
                        </>;
                      } else {
                        return <ClickableWord key={index + 700} word={word} language={language} />;
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