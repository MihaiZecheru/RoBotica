import { useEffect, useState } from "react";
import Database from "../database/Database";
import { AuthenticatedComponentDefaultProps } from "./base/Authenticator";
import { UserID } from "../database/ID";
import TLanguage from "../database/TLanguage";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import TVocabListItem from "../database/TVocabListItem";

const VocabListPage = ({ user, user_settings }: AuthenticatedComponentDefaultProps) => {
  const [vocabList, setVocabList] = useState<TVocabListItem[]>();
  const user_id = user?.id as UserID;
  const language = user_settings?.language as TLanguage;
  const navigate = useNavigate();

  useEffect(() => {
    Database.GetVocabList(user_id, language).then((data) => {
      setVocabList(data);
    });
  }, [language, user_id]);

  const removeWord = (item: TVocabListItem) => {
    Database.DeleteVocabListItem(item.user_id, item.word);
    const newList = vocabList?.filter((x: TVocabListItem) => x.word !== item.word);
    setVocabList(newList);
  };

  const startQuiz = () => {
    const words = vocabList?.map((item: TVocabListItem) => item.word);
    localStorage.setItem('words', JSON.stringify(words));
    navigate('/vocab/quiz');
  };

  return (
    <div style={{ padding: '1rem', backgroundColor: 'var(--primary-blue)', color: 'white', height: '100vh', display: 'flex', justifyContent: 'center' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '.5rem' }}>
          <img src="/robotica.png" style={{ width: '6rem', marginRight: '2rem', cursor: 'pointer' }} onClick={startQuiz} />
          <div className="bubble" style={{ backgroundColor: 'white', borderRadius: '2rem' }}>
            <p style={{ color: 'var(--primary-blue)', fontWeight: 'bold', fontSize: '1rem', padding: '1rem' }}>Click on me to start a quiz when you're ready!</p>
          </div>
        </div>
        <div style={{ overflowY: 'scroll', height: 'calc(100% - 36.5px - 3rem - 100px' }} className="white-scrollbar">
          {
            vocabList?.map((item: TVocabListItem) => (
              <div key={item.word + item.when_added} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '20rem' }}>
                <h3 style={{ margin: 0 }}>{item.word}</h3>
                <div style={{ display: 'flex', alignItems: 'center', color: 'white' }}>
                  <p style={{ paddingRight: '.25rem' }}>{item.when_added.getMonth() + 1}/{item.when_added.getDate()}</p>
                  <DeleteOutlineIcon style={{ cursor: 'pointer' }} onClick={() => removeWord(item)}/>
                </div>
              </div>
            ))
          }
        </div>
        <div style={{ position: 'fixed', bottom: '1rem', marginTop: '1rem', width: '20.5rem' }}>
          <Button variant="contained" onClick={() => navigate('/navily')} style={{ backgroundColor: 'white', color: 'var(--primary-blue)', width: '100%' }}>Navily</Button>
        </div>
      </div>
    </div>
  );
}
 
export default VocabListPage;