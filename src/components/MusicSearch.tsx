import { Button, Input, Paper, Stack } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import TSong from "../database/TSong";
import { useNavigate } from "react-router-dom";
import Database from "../database/Database";
import { AuthenticatedComponentDefaultProps } from "./base/Authenticator";
import TLanguage from "../database/TLanguage";

const MusicSearch = ({ user_settings }: AuthenticatedComponentDefaultProps) => {
  const language = user_settings?.language as TLanguage || 'Romanian';
  
  const inputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState<string>('');
  const [songs, setSongs] = useState<TSong[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<TSong[]>([]);
  const [loading, setLoading] = useState(true);
  const lastSearch = useRef<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    if (window.sessionStorage.getItem('songs')) {
      const _songs = JSON.parse(window.sessionStorage.getItem('songs') as string);
      setSongs(_songs);
      setFilteredSongs(_songs);
      setLoading(false);
      return;
    }

    Database.GetAllSongs(language).then((_songs: TSong[]) => {
      setSongs(_songs);
      setFilteredSongs(_songs);
      window.sessionStorage.setItem('songs', JSON.stringify(_songs));
      setLoading(false);
    });
  }, [language]);

  const performSearch = (e: any) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (search === lastSearch.current) return;
      lastSearch.current = search;
      const lower_search = search.toLowerCase();
      setFilteredSongs(songs.filter((song: TSong) =>
        song.title.toLowerCase().includes(lower_search)
        ||
        song.artist.toLowerCase().includes(lower_search)
      ));
    }
  };

  if (loading) {
    return (<></>);
  }

  return (
    <div style={{ padding: '1rem', width: 'calc(100% - 2rem', height: 'calc(100% - 4rem)' }}>
      <Stack direction="column" spacing={5} sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
        <div>
          <div>
            <Input
              inputRef={inputRef}
              placeholder="Search for a song"
              className="story-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{
                width: '100vw',
              }}
              inputProps={{ maxLength: 150, sx: { '::placeholder': { userSelect: 'none' } }}}
              onKeyDown={performSearch}
            />
            <Button
              sx={{ marginLeft: '1rem' }}
              onClick={() => {
                setSearch('');
                setFilteredSongs(songs);
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
            >Reset Filter</Button>
          </div>
        </div>
        <Paper elevation={10} className="stories-container">
          <Stack direction="column" spacing={2}>
            {
              filteredSongs.length === 0
              ? <Paper elevation={3} className="story-card-no-click">No songs found</Paper>
              : filteredSongs.map((song: TSong) => (
                <Paper
                  elevation={3}
                  className="story-card"
                  key={song.id}
                  onClick={() => navigate(`/music/${song.id}`)}
                >
                  <div className="story-title-and-word-count">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <img src={song.thumbnail_url} width={64} />
                      <div style={{ marginLeft: '1rem', display: 'flex', flexDirection: 'column' }}>
                        <span>{song.title}</span>
                        <small style={{ color: 'grey' }}>{song.artist}</small>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style= {{ color: 'grey' }}>{song.year}</span>
                    </div>
                  </div>
                </Paper>
              ))
            }
          </Stack>
        </Paper>
      </Stack>
      <div className='results-count-display'>
        <span>Showing {filteredSongs.length}/{songs.length} results</span>
      </div>
      <div style={{ position: 'fixed', bottom: '5px', right: '.75rem' }}>
        <Button color="primary" onClick={() => navigate('/navily')}>Navily</Button>
      </div>
    </div>
  );
}
 
export default MusicSearch;