import { Button, Input, Stack, TextField } from "@mui/material";
import Dropdown from "./Dropdown";
import TLanguage, { LANGUAGES } from "../database/TLanguage";
import { AuthenticatedComponentDefaultProps } from "./base/Authenticator";
import { useEffect, useState } from "react";
import Database from "../database/Database";
import { useNavigate } from "react-router-dom";
import useInfoModal from "./base/useInfoModal";
import GenerateAndUploadStory, { GenerateAndUploadStoryInAllLanguages } from "../functions/GenerateAndUploadStory";

const CreateStoryPage = ({ user }: AuthenticatedComponentDefaultProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('Romanian');
  const [body, setBody] = useState('');
  const showInfoModal = useInfoModal();
  
  useEffect(() => {
    if (user?.id !== process.env.REACT_APP_ADMIN_ID) {
      window.location.href = '/navily';
    } else {
      setLoading(false);
    }
  }, [navigate]);

  const handleSubmit = () => {
    const _title = title.trim();
    const _body = body.trim();

    if (_title.length === 0 || _body.length === 0) {
      showInfoModal('Error', 'Title and body cannot be empty. Did you mean to generate a story instead?');
      return;
    }

    if (language === 'All') {
      showInfoModal('Error', 'Please select a language. "All" is only for generating stories');
      return; 
    }

    setLoading(true);

    Database.UploadStory({
      title: _title,
      language: language as TLanguage,
      body: _body
    }).then(() => {
      navigate('/navily');
    });
  };

  const generateStory = () => {
    const _title = title.trim();
    const _body = body.trim();

    if (_title.length !== 0) {
      showInfoModal('Error', 'Title must be empty to generate a story. Put the synposis in the body section');
      return;
    }

    if (_body.length === 0) {
      showInfoModal('Error', 'Body cannot be empty. Put the synposis in the body section');
      return;
    }

    setLoading(true);

    if (language === 'All') {
      GenerateAndUploadStoryInAllLanguages(_body, false).then(() => {
        navigate('/navily');
      });
    } else {
      GenerateAndUploadStory(language as TLanguage, _body, true).then(() => {
        navigate('/navily');
      });
    }
  };
  
  if (loading) {
    return <>Loading</>
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw'
    }}>
      <Stack spacing={2}>
        <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Dropdown
            options={['All', ...LANGUAGES]}
            handleChange={(value) => setLanguage(value)}
            _label="Set Language"
            starting_value='All'
          />
          <Button type='button' onClick={() => navigate('/navily')}>Navily</Button>
        </div>
        <TextField placeholder="Body" variant='outlined'
          fullWidth
          multiline
          minRows={15}
          size='medium'
          value={body}
          onChange={(e) => setBody(e.target.value)}
          sx={{
            width: '75vw!important',
          }}
        />
        <Button variant='contained' onClick={handleSubmit}>Create</Button>
        <Button type='button' variant='contained' onClick={generateStory}>Generate Story</Button>
      </Stack>
    </div>
  );
}
 
export default CreateStoryPage;