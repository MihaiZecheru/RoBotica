import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useInfoModal from "./base/useInfoModal";
import { Button, Input } from "@mui/material";
import Bot, { TAiQuizResponseEvaluation } from "../functions/Bot";
import TLanguage from "../database/TLanguage";

const QUIZ_LENGTH: number = 10;

function getRandomWords(arr: string[], amount: number): string[] {
  const randomWords: string[] = [];
  
  for (let i = 0; i < Math.min(amount, arr.length); i++) {
    while (true) {
      const randomWord = arr[Math.floor(Math.random() * arr.length)];
      if (randomWords.includes(randomWord)) continue;
      randomWords.push(randomWord);
      break;
    }
  }

  return randomWords;
}

const VocabQuizPage = () => {
  const [vocabList, setVocabList] = useState<string[]>();
  const [language, setLanguage] = useState<TLanguage>();
  const navigate = useNavigate();
  const launchInfoModal = useInfoModal();
  const [quizWords, setQuizWords] = useState<string[]>();
  const [activeQuizWordIndex, setActiveQuizWordIndex] = useState<number>();
  const [inputValue, setInputValue] = useState<string>("");
  const [botLoading, setBotLoading] = useState<boolean>(false);
  const [quizScores, setQuizScores] = useState<number[]>([]);
  const openInfoModal = useInfoModal();

  useEffect(() => {
    const words_in_storage = localStorage.getItem("words");
    if (!words_in_storage) {
      console.error("Error: 'words' key did not exist in localStorage. Starting a quiz from the /vocab page should have added it.")
      launchInfoModal("Error", "There was an error that caused the quiz to fail");
      return navigate('/vocab');
    }

    const language_in_storage = localStorage.getItem("language");
    if (!language_in_storage) {
      console.error("Error: 'language' key did not exist in localStorage. Starting a quiz from the /vocab page should have added it.")
      launchInfoModal("Error", "There was an error that caused the quiz to fail");
      return navigate('/vocab');
    }
    
    const _vocabList = JSON.parse(words_in_storage);
    setVocabList(_vocabList);
    setLanguage(language_in_storage as TLanguage);
    setQuizWords(getRandomWords(_vocabList, QUIZ_LENGTH));
    setActiveQuizWordIndex(0);
  }, [navigate]);

  const handleSubmission = async () => {
    const foreignWord: string = quizWords![activeQuizWordIndex!];
    setBotLoading(true);
    const response: TAiQuizResponseEvaluation = await Bot.IsQuizResponseCorrect(foreignWord, language!, inputValue);
    setBotLoading(false);

    if (response.correctness === 'Correct') {
      openInfoModal("Correct!", `"${inputValue}" is a translation for "${foreignWord}"`);
      setQuizScores([...quizScores, 1]);
    } else if (response.correctness === 'Partial') {
      openInfoModal("Almost!", response.info!);
      setQuizScores([...quizScores, 0.5]);
    } else if (response.correctness === 'Wrong') {
      openInfoModal("That's not right...", response.info!)
      setQuizScores([...quizScores, 0]);
    }

    // Check if the quiz is over
    if (activeQuizWordIndex === quizWords!.length - 1) {
      const sum = quizScores.reduce((acc: number, score: number) => acc + score, 0);
      const scoreBreakdown = quizScores.reduce((acc: string, score: number, index: number) => acc + `${quizWords![index!]}: ${score}\n`, '');
      openInfoModal("Quiz Results", `You got ${sum}/${quizWords!.length} points. Here's the breakdown:\n\n${scoreBreakdown}`);
      setActiveQuizWordIndex(0);
      setQuizScores([]);
    } else {
      setActiveQuizWordIndex(activeQuizWordIndex! + 1);
    }
  };

  const inputOnKeyDown = (e: any) => {
    if (e.key === 'Enter') {
      handleSubmission();
      setInputValue("");
    }
  };

  return (
    <div style={{ backgroundColor: '#87cefa', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '1rem', width: '40vw', height: '40vh' }}>
        <div style={{ width: '100%', height: '2rem', backgroundColor: 'var(--primary-blue)', borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ padding: '0.5rem', paddingRight: '1rem', color: 'white' }}>{(activeQuizWordIndex || 0) + 1}/{quizWords?.length}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', height: 'calc(100% - 2rem)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', padding: '1rem' }}>
            {
              quizWords &&
              <div>
                <span>Translate to English</span>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <h2 style={{ margin: 0, marginLeft: '.5rem' }}>{quizWords[activeQuizWordIndex || 0]}</h2>
                </div>
              </div>
            }
            <Input disabled={botLoading} onKeyDown={inputOnKeyDown} value={inputValue} onChange={(e) => setInputValue(e.target.value)} style={{ marginTop: '1rem' }} />
          </div>
        </div>
      </div>

      <Button type='button' variant="contained" onClick={() => { navigate('/navily') }} sx={{
        backgroundColor: 'var(--primary-blue)', color: 'white', position: 'fixed', bottom: '1rem', right: '1rem'
      }}>Navily</Button>
    </div>
  );
}
 
export default VocabQuizPage;