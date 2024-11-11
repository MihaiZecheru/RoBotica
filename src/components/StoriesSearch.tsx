import { Button, Input, Paper, Stack } from "@mui/material";
import TStory from "../database/TStory";
import '../styles/reading-page.css';
import { useEffect, useRef, useState } from "react";
import Database from "../database/Database";
import TLanguage from "../database/TLanguage";

interface Props {
  storySelected: (story: TStory) => void;
  language: TLanguage;
}

const StoriesSearch = ({ storySelected, language }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [stories, setStories] = useState<TStory[]>([]);
  const [search, setSearch] = useState<string>('');
  const [filteredStories, setFilteredStories] = useState<TStory[]>([]);
  const lastSearch = useRef<string>('');

  useEffect(() => {
    Database.GetAllStories(language).then((stories) => {
      setStories(stories);
      setFilteredStories(stories);
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
    <>
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
        <div className="stories-container">
          <Stack direction="column" spacing={2}>
            {
              filteredStories.length === 0
              ? <Paper elevation={3} className="story-card-no-click">No stories found</Paper>
              : filteredStories.map((story: TStory) => (
                <Paper
                  elevation={3}
                  className="story-card"
                  key={story.id}
                  onClick={() => storySelected(story)}
                >
                  <div className="story-title-and-word-count">
                    <span>{story.title}</span>
                    <span style= {{ color: 'grey' }}>{story.body.split(' ').length} words</span>
                  </div>
                </Paper>
              ))
            }
          </Stack>
        </div>
      </Stack>
      <div className='results-count-display'>
        <span>Showing {filteredStories.length}/{stories.length} results</span>
      </div>
    </>
  );
}
 
export default StoriesSearch;