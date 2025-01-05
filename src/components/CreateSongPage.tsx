import { useEffect, useState } from "react";
import { AuthenticatedComponentDefaultProps } from "./base/Authenticator";
import { useNavigate } from "react-router-dom";
import TSong from "../database/TSong";
import { Button, Input, Paper } from "@mui/material";
import TLanguage, { LANGUAGES } from "../database/TLanguage";
import Dropdown from "./Dropdown";
import Database from "../database/Database";
import Loading from "./Loading";

function get_video_id_from_url(url: string): string {
  // Get just the video id from https://youtube.com/watch?v=VIDEO_ID
  return url.split('v=')[1];
}

const CreateSongPage = ({ user }: AuthenticatedComponentDefaultProps) => {
  const [searchResults, setSearchResults] = useState<TSong[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<TLanguage | 'NULL'>('NULL');
  const [youtube_video_id, set_youtube_video_id] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id !== process.env.REACT_APP_ADMIN_ID) {
      window.location.href = '/navily';
    } else {
      setLoading(false);
    }
  }, [navigate]);

  const addSong = async (song: TSong) => {
    setLoading(true);

    if (selectedLanguage === 'NULL') {
      alert('Please select a language');
      setLoading(false);
      return;
    }

    if (!youtube_video_id || youtube_video_id.length === 0) {
      alert('Please enter a YouTube Music URL');
      setLoading(false);
      return;
    }

    setSearchQuery('');
    set_youtube_video_id('');
    
    // song.lyrics is the URL to the lyrics page here but is usually the scraped lyrics themselves
    const lyrics: string = await fetch(`http://localhost:4000/scrape-genius-lyrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: song.lyrics })
    }).then(res => res.text());
    
    await Database.AddSong(
      song.language,
      song.title,
      song.artist,
      song.year,
      lyrics,
      song.thumbnail_url,
      song.image_url,
      get_video_id_from_url(youtube_video_id)
    );
    setLoading(false);
  };

  const search = () => {
    if (!searchQuery) return;
    if (selectedLanguage === 'NULL') {
      alert('Please select a language');
      return;
    }

    setLoading(true);

    fetch(`http://localhost:4000/genius-search?q=${encodeURIComponent(searchQuery)}`)
      .then(res => res.json())
      .then(data => {
        const songs: TSong[] = data.response.hits.map((hit: any) => ({
          id: 'null for now',
          language: selectedLanguage,
          title: hit.result.title,
          artist: hit.result.artist_names,
          year: hit.result.release_date_components?.year || null,
          lyrics: hit.result.url, // NOTE: just the URL for now. when the user selects the song, the lyrics will be scraped
          thumbnail_url: hit.result.header_image_thumbnail_url,
          image_url: hit.result.header_image_url,
          youtube_video_id: null,
          spotify_url: null
        }));
        setSearchResults(songs);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching data:", err)
        setLoading(false);
      });
  };
  

  if (loading) {
    return <Loading />;
  }

  return (
    <div style={{
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh' 
    }}>
      <div style={{
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        width: '100%', // Added width to fill the parent container
      }}>
        <h1>Create a Song</h1>
        <div style={{
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: '100%', // Ensures buttons and dropdown span the available width
          marginBottom: '1rem', // Adding space between the dropdown and the search bar
        }}>
          <Dropdown
            options={['NULL', ...LANGUAGES]}
            handleChange={(value) => setSelectedLanguage(value as (TLanguage | 'NULL'))}
            _label="Set Language"
            starting_value={selectedLanguage}
          />
          <Button type='button' onClick={() => navigate('/navily')}>Navily</Button>
          <Button type='button' onClick={() => navigate('/create-story')}>Create Story Instead</Button>
        </div>
        <Input 
          type="text"
          placeholder="Search for a song"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') search(); }}
          style={{ width: '80%', marginBottom: '1rem' }} // Added margin for better spacing
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '80vw' }}>
          <Input
              type="text"
              placeholder="YouTube Video ID"
              value={youtube_video_id}
              onChange={(e) => set_youtube_video_id(e.target.value.trim())}
              onKeyDown={(e) => { if (e.key === 'Enter') search(); }}
              style={{ width: '150px', marginBottom: '1rem' }}
            />
            <Button type="button" onClick={search} style={{ marginBottom: '1rem' }}>Search</Button>
        </div>
      </div>
    
      <Paper 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: '80vw', // Adjust width to fit better
          maxHeight: '200px!important', // Set a fixed height for the results section
          overflowY: 'auto', 
          overflowX: 'hidden',
          padding: '1rem', // Added padding for inner space
          paddingTop: '90vh',
        }}
        elevation={5}
      >
        {
          searchResults.map((song: TSong, index: number) => (
            <Paper key={index} elevation={5} style={{
              padding: '.25rem', 
              margin: '.5rem',
              width: '100%', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h4>{song.title} ({song.year || "NULL"})</h4>
                <p>{song.artist}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <img src={song.thumbnail_url} alt={song.title} height={64} />
                <Button type='button' onClick={() => addSong(song)}>Add Song</Button>
              </div>
            </Paper>
          ))
        }
      </Paper>
    </div>
  );
}
 
export default CreateSongPage;