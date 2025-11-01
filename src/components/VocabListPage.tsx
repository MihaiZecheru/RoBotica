import { useEffect, useState } from "react";
import Database from "../database/Database";
import { AuthenticatedComponentDefaultProps } from "./base/Authenticator";
import { UserID } from "../database/ID";
import TLanguage from "../database/TLanguage";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import TVocabListItem from "../database/TVocabListItem";
import ClickableWord from "./ClickableWord";
import useInfoModal from "./base/useInfoModal";

const VocabListPage = ({ user, user_settings }: AuthenticatedComponentDefaultProps) => {
  const [vocabList, setVocabList] = useState<TVocabListItem[]>();
  const user_id = user?.id as UserID;
  const language = user_settings?.language as TLanguage;
  const navigate = useNavigate();
  const showInfoModal = useInfoModal();

  useEffect(() => {
    Database.GetVocabList(user_id, language).then((data) => {
      setVocabList(data);
    });
  }, [language, user_id, navigate]);

  const removeWord = (item: TVocabListItem) => {
    Database.DeleteVocabListItem(item.user_id, item.word);
    const newList = vocabList?.filter((x: TVocabListItem) => x.word !== item.word);
    setVocabList(newList);
  };

  const startQuiz = () => {
    if (vocabList?.length === 0) {
      showInfoModal('Error', `You can't start a quiz if you have no words in your vocab list. Add words to your list by clicking on them while holding the 'Alt' key.`)
      return;
    }

    const words = vocabList?.map((item: TVocabListItem) => item.word);
    localStorage.setItem('words', JSON.stringify(words));
    localStorage.setItem('language', language);
    navigate('/vocab/quiz');
  };

  return (
    <div style={{ padding: '1rem', backgroundColor: '#87cefa', color: 'white', height: '100vh', display: 'flex', justifyContent: 'center' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '.5rem' }}>
          <img src="/robotica.png" style={{ width: '6rem', marginRight: '2rem', cursor: 'pointer' }} onClick={startQuiz} />
          <div className="bubble" style={{ backgroundColor: 'white', borderRadius: '2rem' }}>
            <p style={{ color: '#87cefa', fontWeight: 'bold', fontSize: '1rem', padding: '1rem' }}>Click on me to start a quiz when you're ready!</p>
          </div>
        </div>
        <div style={{ overflowY: 'scroll', height: 'calc(100% - 36.5px - 3rem - 100px' }} className="white-scrollbar">
          {
            vocabList?.length === 0 ? <p style={{ width: '20rem' }}>You don't have any words in your vocab list.<br/><br/>Click on words while holding the 'Alt' key to add them to the list.</p> :
            vocabList?.map((item: TVocabListItem) => (
              <div key={item.word + item.when_added} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '20rem' }}>
                <ClickableWord word={item.word} language={item.language} />
                <div style={{ display: 'flex', alignItems: 'center', color: 'white' }}>
                  <p style={{ paddingRight: '.25rem' }}>{item.when_added.getMonth() + 1}/{item.when_added.getDate()}</p>
                  <DeleteOutlineIcon style={{ cursor: 'pointer' }} onClick={() => removeWord(item)}/>
                </div>
              </div>
            ))
          }
        </div>
        <div style={{ position: 'fixed', bottom: '1rem', marginTop: '1rem', width: '20.5rem' }}>
          <Button variant="contained" onClick={() => navigate('/navily')} style={{ backgroundColor: 'white', color: '#87cefa', width: '100%' }}>Navily</Button>
        </div>
      </div>
    </div>
  );
}
 
export default VocabListPage;