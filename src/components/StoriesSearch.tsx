import { Button, Input, Paper, Stack } from "@mui/material";
import TStory from "../database/TStory";
import '../styles/reading-page.css';
import { useEffect, useRef, useState } from "react";
import Database from "../database/Database";
import TLanguage from "../database/TLanguage";
import { useNavigate } from "react-router-dom";
import { AuthenticatedComponentDefaultProps } from "./base/Authenticator";

const StoriesSearch = ({ user_settings }: AuthenticatedComponentDefaultProps) => {
  const language = user_settings?.language as TLanguage || 'Romanian';

  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [stories, setStories] = useState<TStory[]>([]);
  const [search, setSearch] = useState<string>('');
  const [filteredStories, setFilteredStories] = useState<TStory[]>([]);
  const lastSearch = useRef<string>('');

  useEffect(() => {
    if (window.sessionStorage.getItem('stories')) {
      const _stories = JSON.parse(window.sessionStorage.getItem('stories') as string);
      setStories(_stories);
      setFilteredStories(_stories);
      return;
    }

    Database.GetAllStories(language).then((stories) => {
      setStories(stories);
      setFilteredStories(stories);
      window.sessionStorage.setItem('stories', JSON.stringify(stories));
    });
  }, [language]);

  const strip_diactritics = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const performSearch = (e: any) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (search === lastSearch.current) return;
      lastSearch.current = search;

      if (search.length === 0) {
        setFilteredStories(stories);
      } else {
        setFilteredStories(
          stories.filter((story) =>
            strip_diactritics(story.title.toLowerCase())
              .includes(strip_diactritics(search.toLowerCase()))
            || strip_diactritics(story.body.toLowerCase())
              .includes(strip_diactritics(search.toLowerCase()))
          )
        );
      }

    }
  };

  return (
    <div style={{ padding: '1rem', width: 'calc(100% - 2rem', height: 'calc(100% - 4rem)' }}>
      <Stack direction="column" spacing={5} sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
        <div>
          <div>
            <Input
              inputRef={inputRef}
              placeholder="Search for a story"
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
                setFilteredStories(stories);
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
            >Reset Filter</Button>
          </div>
        </div>
        <Paper elevation={10} className="stories-container">
          <Stack direction="column" spacing={2}>
            {
              filteredStories.length === 0
              ? <Paper elevation={3} className="story-card-no-click">No stories found</Paper>
              : filteredStories.map((story: TStory) => (
                <Paper
                  elevation={3}
                  className="story-card"
                  key={story.id}
                  onClick={() => navigate(`/reading/${story.id}`)}
                >
                  <div className="story-title-and-word-count">
                    <span>{story.title}</span>
                    <span style= {{ color: 'grey' }}>{story.body.split(' ').length} words</span>
                  </div>
                </Paper>
              ))
            }
          </Stack>
        </Paper>
      </Stack>
      <div className='results-count-display'>
        <span>Showing {filteredStories.length}/{stories.length} results</span>
      </div>
      <div style={{ position: 'fixed', bottom: '5px', right: '.75rem' }}>
        <Button color="primary" onClick={() => navigate('/navily')}>Navily</Button>
      </div>
    </div>
  );
}
 
export default StoriesSearch;