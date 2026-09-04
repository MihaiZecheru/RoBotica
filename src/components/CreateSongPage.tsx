import React, { useEffect, useState } from "react";
import { AuthenticatedComponentDefaultProps } from "./base/Authenticator";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import YouTubeIcon from '@mui/icons-material/YouTube';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import TLanguage, { LANGUAGES } from "../database/TLanguage";
import Dropdown from "./Dropdown";
import Database from "../database/Database";
import Loading from "./Loading";
import { getApiUrl } from "../functions/ApiConfig";

/**
 * Helper to extract YouTube 11-character video ID from raw input or URLs
 */
function extractYouTubeId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const match = trimmed.match(/(?:v=|youtu\.be\/|embed\/|\/v\/|\/e\/|watch\?v=|&v=)([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];
  const directMatch = trimmed.match(/^([a-zA-Z0-9_-]{11})$/);
  if (directMatch) return directMatch[1];
  return '';
}

const CreateSongPage = ({ user }: AuthenticatedComponentDefaultProps) => {
  const navigate = useNavigate();
  const [pageLoading, setPageLoading] = useState(true);

  // Form Inputs
  const [inputUrl, setInputUrl] = useState('');
  const [youtubeVideoId, setYoutubeVideoId] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<TLanguage>('Spanish');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [year, setYear] = useState<string>('');
  const [lyrics, setLyrics] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Status & Progress State
  const [lyricsType, setLyricsType] = useState<'none' | 'plain' | 'synced'>('none');
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);
  const [isFetchingLyrics, setIsFetchingLyrics] = useState(false);
  const [isDownloadingAudio, setIsDownloadingAudio] = useState(false);
  const [audioDownloaded, setAudioDownloaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Feedback Messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    id: string;
    title: string;
    artist: string;
    isNew: boolean;
  } | null>(null);

  // Admin access validation
  useEffect(() => {
    if (user?.id !== process.env.REACT_APP_ADMIN_ID) {
      window.location.href = '/navily';
    } else {
      setPageLoading(false);
    }
  }, [navigate, user]);

  // Real-time YouTube ID extraction as user types or pastes
  const handleUrlInputChange = (val: string) => {
    setInputUrl(val);
    const extracted = extractYouTubeId(val);
    if (extracted) {
      setYoutubeVideoId(extracted);
      setThumbnailUrl(`https://i.ytimg.com/vi/${extracted}/hqdefault.jpg`);
      setImageUrl(`https://i.ytimg.com/vi/${extracted}/maxresdefault.jpg`);
    }
  };

  /**
   * Fetch metadata from YouTube via server's yt-dlp endpoint
   */
  const handleFetchMetadata = async (customId?: string) => {
    const idToUse = customId || youtubeVideoId || extractYouTubeId(inputUrl);
    if (!idToUse || idToUse.length !== 11) {
      setErrorMessage('Please enter a valid 11-character YouTube Video ID or URL.');
      return;
    }

    setErrorMessage(null);
    setIsFetchingMeta(true);

    try {
      const res = await fetch(getApiUrl(`/api/youtube/metadata?id=${idToUse}`));
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || `Failed to fetch metadata (status ${res.status})`);
      }

      const data = await res.json();
      setYoutubeVideoId(data.youtube_video_id);
      setTitle(data.title || '');
      setArtist(data.artist || '');
      setYear(data.year ? String(data.year) : '');
      setThumbnailUrl(data.thumbnail_url || `https://i.ytimg.com/vi/${data.youtube_video_id}/hqdefault.jpg`);
      setImageUrl(data.image_url || `https://i.ytimg.com/vi/${data.youtube_video_id}/maxresdefault.jpg`);
      setAudioDownloaded(Boolean(data.audio_downloaded));

      // Also trigger LRCLIB synced lyrics lookup automatically
      if (data.title || data.artist) {
        handleFetchLyrics(data.title, data.artist);
      }
    } catch (err: any) {
      console.error('Error in handleFetchMetadata:', err);
      setErrorMessage(err.message || 'Error fetching metadata from YouTube.');
    } finally {
      setIsFetchingMeta(false);
    }
  };

  /**
   * Fetch synced or plain lyrics from LRCLIB
   */
  const handleFetchLyrics = async (trackTitle?: string, artistName?: string) => {
    const queryTrack = (trackTitle !== undefined ? trackTitle : title).trim();
    const queryArtist = (artistName !== undefined ? artistName : artist).trim();

    if (!queryTrack && !queryArtist) {
      setErrorMessage('Title or artist is needed to search for lyrics.');
      return;
    }

    setIsFetchingLyrics(true);
    try {
      const params = new URLSearchParams({
        track_name: queryTrack,
        artist_name: queryArtist
      });

      const res = await fetch(getApiUrl(`/api/lyrics?${params.toString()}`));
      if (!res.ok) {
        throw new Error('Failed to query LRCLIB lyrics');
      }

      const data = await res.json();
      if (data.syncedLyrics) {
        setLyrics(data.syncedLyrics);
        setLyricsType('synced');
      } else if (data.plainLyrics) {
        setLyrics(data.plainLyrics);
        setLyricsType('plain');
      } else {
        setLyricsType('none');
      }
    } catch (err: any) {
      console.error('Error in handleFetchLyrics:', err);
      setLyricsType('none');
    } finally {
      setIsFetchingLyrics(false);
    }
  };

  /**
   * Download YouTube audio stream as 192k MP3 to server/music/<id>.mp3
   */
  const handleDownloadAudio = async (): Promise<boolean> => {
    const idToUse = youtubeVideoId || extractYouTubeId(inputUrl);
    if (!idToUse || idToUse.length !== 11) {
      setErrorMessage('Please enter a valid YouTube Video ID or URL before downloading audio.');
      return false;
    }

    setIsDownloadingAudio(true);
    setErrorMessage(null);

    try {
      const res = await fetch(getApiUrl('/api/music/download'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtube_video_id: idToUse })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || 'Audio download failed');
      }

      const data = await res.json();
      if (data.success) {
        setAudioDownloaded(true);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Error downloading audio:', err);
      setErrorMessage(err.message || 'Failed to download audio stream.');
      return false;
    } finally {
      setIsDownloadingAudio(false);
    }
  };

  /**
   * Save song to database (upsert) and verify audio is ready
   */
  const handleSaveSong = async () => {
    setErrorMessage(null);
    setSuccessInfo(null);

    const idToUse = youtubeVideoId || extractYouTubeId(inputUrl);
    if (!idToUse || idToUse.length !== 11) {
      setErrorMessage('A valid 11-character YouTube Video ID is required.');
      return;
    }

    if (!title.trim()) {
      setErrorMessage('Song title is required.');
      return;
    }

    if (!artist.trim()) {
      setErrorMessage('Song artist is required.');
      return;
    }

    setIsSaving(true);

    try {
      // 1. Ensure audio is downloaded
      if (!audioDownloaded) {
        const downloadSuccess = await handleDownloadAudio();
        if (!downloadSuccess) {
          throw new Error('Audio download failed. The song cannot be added without an audio file.');
        }
      }

      // 2. Insert or update song in Supabase
      const songYear = year.trim() ? parseInt(year.trim(), 10) : null;
      const thumb = thumbnailUrl || `https://i.ytimg.com/vi/${idToUse}/hqdefault.jpg`;
      const img = imageUrl || `https://i.ytimg.com/vi/${idToUse}/maxresdefault.jpg`;

      const result = await Database.AddSong(
        selectedLanguage,
        title.trim(),
        artist.trim(),
        songYear,
        lyrics.trim(),
        thumb,
        img,
        idToUse
      );

      setSuccessInfo({
        id: result.id,
        title: title.trim(),
        artist: artist.trim(),
        isNew: result.isNew
      });
    } catch (err: any) {
      console.error('Error saving song:', err);
      setErrorMessage(err.message || 'Failed to save song to database.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Reset the form to add another song
   */
  const handleResetForm = () => {
    setInputUrl('');
    setYoutubeVideoId('');
    setTitle('');
    setArtist('');
    setYear('');
    setLyrics('');
    setThumbnailUrl('');
    setImageUrl('');
    setLyricsType('none');
    setAudioDownloaded(false);
    setErrorMessage(null);
    setSuccessInfo(null);
  };

  if (pageLoading) {
    return <Loading />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        padding: { xs: '1rem', md: '2.5rem' },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: '900px' }}>
        {/* Navigation & Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#38bdf8' }}>
              Add Song & Stream Audio
            </Typography>
            <Chip
              label="Admin (AddSong.sh)"
              size="small"
              sx={{ backgroundColor: '#0284c7', color: '#fff', fontWeight: 600 }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate('/music')}
              sx={{ color: '#94a3b8', borderColor: '#334155' }}
            >
              Music Search
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate('/navily')}
              sx={{ color: '#94a3b8', borderColor: '#334155' }}
            >
              Navily
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate('/create-story')}
              sx={{ color: '#94a3b8', borderColor: '#334155' }}
            >
              Create Story Instead
            </Button>
          </Box>
        </Box>

        {/* Error / Success Notifications */}
        {errorMessage && (
          <Alert severity="error" sx={{ marginBottom: '1.5rem' }} onClose={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        )}

        {successInfo && (
          <Paper
            elevation={4}
            sx={{
              backgroundColor: '#064e3b',
              color: '#a7f3d0',
              padding: '1.5rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              border: '1px solid #059669',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <CheckCircleOutlineIcon sx={{ color: '#34d399', fontSize: 32 }} />
              <Typography variant="h6" sx={{ color: '#ecfdf5', fontWeight: 700 }}>
                {successInfo.isNew ? 'Song Created Successfully!' : 'Song Updated Successfully!'}
              </Typography>
            </Box>
            <Typography sx={{ color: '#d1fae5', marginBottom: '1rem' }}>
              <strong>"{successInfo.title}"</strong> by <strong>{successInfo.artist}</strong> is registered in the database and audio is ready to stream.
            </Typography>
            <Box sx={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<OpenInNewIcon />}
                onClick={() => navigate(`/music/${successInfo.id}`)}
                sx={{ backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' }, color: '#fff' }}
              >
                Open Song in RoBotica
              </Button>
              <Button
                variant="outlined"
                onClick={handleResetForm}
                sx={{ color: '#a7f3d0', borderColor: '#34d399' }}
              >
                Add Another Song
              </Button>
            </Box>
          </Paper>
        )}

        {/* Step 1: YouTube Video & Language */}
        <Paper
          elevation={3}
          sx={{
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            padding: '1.75rem',
            borderRadius: '16px',
            marginBottom: '1.5rem',
            border: '1px solid #334155',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#e2e8f0', marginBottom: '1rem' }}>
            1. YouTube Video & Target Language
          </Typography>

          <Stack spacing={2.5}>
            <Box sx={{ display: 'flex', gap: '1rem', flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                fullWidth
                label="YouTube Video ID or Full URL"
                placeholder="e.g. https://www.youtube.com/watch?v=kJQP7kiw5Fk or kJQP7kiw5Fk"
                value={inputUrl}
                onChange={(e) => handleUrlInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleFetchMetadata();
                }}
                variant="outlined"
                InputProps={{
                  startAdornment: <YouTubeIcon sx={{ color: '#ef4444', marginRight: '0.5rem' }} />,
                }}
                sx={{
                  backgroundColor: '#0f172a',
                  input: { color: '#f8fafc' },
                  label: { color: '#94a3b8' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#334155' },
                    '&:hover fieldset': { borderColor: '#64748b' },
                  },
                }}
              />

              <Box sx={{ minWidth: '180px' }}>
                <Dropdown
                  options={LANGUAGES as unknown as string[]}
                  handleChange={(val) => setSelectedLanguage(val as TLanguage)}
                  _label="Language"
                  starting_value={selectedLanguage}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  Extracted YouTube ID:
                </Typography>
                {youtubeVideoId ? (
                  <Chip
                    label={youtubeVideoId}
                    size="small"
                    sx={{ backgroundColor: '#0369a1', color: '#e0f2fe', fontWeight: 600 }}
                  />
                ) : (
                  <Typography variant="body2" sx={{ color: '#64748b', fontStyle: 'italic' }}>
                    (None detected yet)
                  </Typography>
                )}
              </Box>

              <Button
                variant="contained"
                onClick={() => handleFetchMetadata()}
                disabled={isFetchingMeta || !youtubeVideoId}
                startIcon={isFetchingMeta ? <CircularProgress size={18} color="inherit" /> : <RefreshIcon />}
                sx={{
                  backgroundColor: '#0284c7',
                  '&:hover': { backgroundColor: '#0369a1' },
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                {isFetchingMeta ? 'Extracting Metadata...' : 'Fetch Song Info & Lyrics'}
              </Button>
            </Box>
          </Stack>
        </Paper>

        {/* Step 2: Song Details & Audio Stream */}
        <Paper
          elevation={3}
          sx={{
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            padding: '1.75rem',
            borderRadius: '16px',
            marginBottom: '1.5rem',
            border: '1px solid #334155',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#e2e8f0' }}>
              2. Song Details & Audio Stream
            </Typography>
            <Chip
              icon={audioDownloaded ? <CheckCircleOutlineIcon /> : <MusicNoteIcon />}
              label={audioDownloaded ? 'Audio Stream Ready' : 'Audio Not Downloaded'}
              color={audioDownloaded ? 'success' : 'default'}
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: '1.5rem', flexDirection: { xs: 'column', md: 'row' } }}>
            {/* Thumbnail Preview */}
            <Box
              sx={{
                width: { xs: '100%', md: '200px' },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  aspectRatio: '16/9',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt={title || 'Song Thumbnail'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <MusicNoteIcon sx={{ color: '#475569', fontSize: 48 }} />
                )}
              </Box>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Preview Thumbnail
              </Typography>
            </Box>

            {/* Editable Fields */}
            <Box sx={{ flex: 1 }}>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Song Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  variant="outlined"
                  size="small"
                  sx={{
                    backgroundColor: '#0f172a',
                    input: { color: '#f8fafc' },
                    label: { color: '#94a3b8' },
                    '& .MuiOutlinedInput-root fieldset': { borderColor: '#334155' },
                  }}
                />

                <TextField
                  fullWidth
                  label="Song Artist"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  variant="outlined"
                  size="small"
                  sx={{
                    backgroundColor: '#0f172a',
                    input: { color: '#f8fafc' },
                    label: { color: '#94a3b8' },
                    '& .MuiOutlinedInput-root fieldset': { borderColor: '#334155' },
                  }}
                />

                <Box sx={{ display: 'flex', gap: '1rem' }}>
                  <TextField
                    label="Release Year"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{
                      width: '140px',
                      backgroundColor: '#0f172a',
                      input: { color: '#f8fafc' },
                      label: { color: '#94a3b8' },
                      '& .MuiOutlinedInput-root fieldset': { borderColor: '#334155' },
                    }}
                  />

                  <TextField
                    label="YouTube ID"
                    value={youtubeVideoId}
                    onChange={(e) => setYoutubeVideoId(e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{
                      flex: 1,
                      backgroundColor: '#0f172a',
                      input: { color: '#f8fafc' },
                      label: { color: '#94a3b8' },
                      '& .MuiOutlinedInput-root fieldset': { borderColor: '#334155' },
                    }}
                  />
                </Box>
              </Stack>
            </Box>
          </Box>

          <Divider sx={{ my: 2, borderColor: '#334155' }} />

          {/* Audio Action & Stream Player */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#cbd5e1' }}>
                  Audio Stream (192kbps MP3 via yt-dlp)
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  {audioDownloaded
                    ? `Saved on server as server/music/${youtubeVideoId}.mp3`
                    : 'Download required for local audio streaming & seeking'}
                </Typography>
              </Box>

              <Button
                variant={audioDownloaded ? 'outlined' : 'contained'}
                onClick={handleDownloadAudio}
                disabled={isDownloadingAudio || !youtubeVideoId}
                startIcon={isDownloadingAudio ? <CircularProgress size={18} color="inherit" /> : <CloudDownloadIcon />}
                sx={{
                  backgroundColor: audioDownloaded ? 'transparent' : '#0284c7',
                  borderColor: '#0284c7',
                  color: audioDownloaded ? '#38bdf8' : '#fff',
                  '&:hover': {
                    backgroundColor: audioDownloaded ? '#0284c722' : '#0369a1',
                  },
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                {isDownloadingAudio ? 'Downloading MP3 via yt-dlp...' : audioDownloaded ? 'Re-Download Audio' : 'Download Audio Stream'}
              </Button>
            </Box>

            {/* Audio Stream Preview Player */}
            {audioDownloaded && youtubeVideoId && (
              <Box
                sx={{
                  backgroundColor: '#0f172a',
                  padding: '1rem',
                  borderRadius: '10px',
                  border: '1px solid #334155',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <PlayArrowIcon sx={{ color: '#38bdf8' }} />
                  <Typography variant="body2" sx={{ color: '#38bdf8', fontWeight: 600 }}>
                    Stream Preview: /api/stream/{youtubeVideoId}
                  </Typography>
                </Box>
                <audio
                  controls
                  src={getApiUrl(`/api/stream/${youtubeVideoId}`)}
                  style={{ width: '100%', height: '40px' }}
                />
              </Box>
            )}
          </Box>
        </Paper>

        {/* Step 3: Synchronized Lyrics (LRCLIB) */}
        <Paper
          elevation={3}
          sx={{
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            padding: '1.75rem',
            borderRadius: '16px',
            marginBottom: '1.5rem',
            border: '1px solid #334155',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#e2e8f0' }}>
                3. Synchronized Lyrics (LRCLIB)
              </Typography>

              {lyricsType === 'synced' && (
                <Chip
                  label="Synced Lyrics (LRC)"
                  size="small"
                  sx={{ backgroundColor: '#065f46', color: '#6ee7b7', fontWeight: 600 }}
                />
              )}
              {lyricsType === 'plain' && (
                <Chip
                  label="Plain Lyrics (No sync)"
                  size="small"
                  sx={{ backgroundColor: '#854d0e', color: '#fde047', fontWeight: 600 }}
                />
              )}
              {lyricsType === 'none' && (
                <Chip
                  label="No Lyrics Found"
                  size="small"
                  sx={{ backgroundColor: '#334155', color: '#94a3b8', fontWeight: 600 }}
                />
              )}
            </Box>

            <Button
              variant="outlined"
              size="small"
              onClick={() => handleFetchLyrics()}
              disabled={isFetchingLyrics || (!title && !artist)}
              startIcon={isFetchingLyrics ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
              sx={{
                color: '#38bdf8',
                borderColor: '#0284c7',
                '&:hover': { borderColor: '#38bdf8', backgroundColor: '#0284c711' },
                textTransform: 'none',
              }}
            >
              {isFetchingLyrics ? 'Searching LRCLIB...' : 'Re-fetch from LRCLIB'}
            </Button>
          </Box>

          <Typography variant="body2" sx={{ color: '#94a3b8', marginBottom: '0.75rem' }}>
            LRC timestamps like <code>[01:23.45] lyric text</code> enable karaoke-style synchronized scrolling in RoBotica. You can freely edit or paste lyrics below:
          </Typography>

          <TextField
            fullWidth
            multiline
            minRows={10}
            maxRows={20}
            placeholder="Paste or edit LRC synchronized lyrics or plain lyrics here..."
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            variant="outlined"
            sx={{
              backgroundColor: '#0f172a',
              '& .MuiInputBase-input': {
                color: '#f8fafc',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                lineHeight: 1.6,
              },
              '& .MuiOutlinedInput-root fieldset': { borderColor: '#334155' },
              '& .MuiOutlinedInput-root:hover fieldset': { borderColor: '#64748b' },
            }}
          />
        </Paper>

        {/* Step 4: Final Submission */}
        <Box sx={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem' }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleSaveSong}
            disabled={isSaving || isDownloadingAudio || isFetchingMeta}
            startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <CheckCircleOutlineIcon />}
            sx={{
              backgroundColor: '#10b981',
              '&:hover': { backgroundColor: '#059669' },
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '1.1rem',
              padding: '0.8rem 3rem',
              borderRadius: '12px',
              textTransform: 'none',
              boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)',
            }}
          >
            {isSaving ? 'Saving Song to Database...' : 'Save Song to Database'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default CreateSongPage;