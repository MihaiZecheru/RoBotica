import { useNavigate, useParams } from "react-router-dom";
import TSong from "../database/TSong";
import { AuthenticatedComponentDefaultProps } from "./base/Authenticator";
import Database from "../database/Database";
import { SongID } from "../database/ID";
import { useEffect, useRef, useState } from "react";
import { Button, Paper, Tooltip } from "@mui/material";
import ClickableLyric from "./ClickableLyric";
import ClickableWord from "./ClickableWord";
import { getApiUrl } from "../functions/ApiConfig";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import Loading from "./Loading";
import '../styles/song-view.css';

interface SyncedLyricLine {
  time: number;
  text: string;
}

function parseLRC(lrcText: string): SyncedLyricLine[] {
  if (!lrcText) return [];
  const lines = lrcText.split('\n');
  const parsed: SyncedLyricLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

  for (const line of lines) {
    const match = line.match(timeRegex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = parseInt(match[3].padEnd(3, '0').slice(0, 3), 10);
      const time = minutes * 60 + seconds + milliseconds / 1000;
      const text = match[4].trim();
      if (text) {
        parsed.push({ time, text });
      }
    }
  }
  return parsed.sort((a, b) => a.time - b.time);
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function create_embed(video_id: string, frame_title: string) {
  return (
    <iframe
      width="100%"
      height="260"
      style={{ borderRadius: '16px', border: 'none' }}
      src={`https://www.youtube.com/embed/${video_id}?autoplay=1&enablejsapi=1`}
      title={frame_title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen={false}>
    </iframe>
  );
}

const SongView = (_: AuthenticatedComponentDefaultProps) => {
  const { id } = useParams();
  const [song, setSong] = useState<TSong | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [useYouTubeFallback, setUseYouTubeFallback] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<boolean>(false);
  const [lyricsData, setLyricsData] = useState<{
    synced: SyncedLyricLine[];
    plain: string;
    loading: boolean;
  }>({ synced: [], plain: '', loading: true });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    Database.GetSong(id as SongID).then((_song: TSong) => {
      setSong(_song);
      setLoading(false);
    });
  }, [id]);

  // Load and parse lyrics
  useEffect(() => {
    if (!song) return;

    setLyricsData({ synced: [], plain: '', loading: true });

    // 1. First check if song.lyrics already contains LRC timestamps
    const dbParsed = parseLRC(song.lyrics);
    if (dbParsed.length > 0) {
      setLyricsData({ synced: dbParsed, plain: '', loading: false });
      return;
    }

    // 2. Fetch synchronized lyrics from LRCLIB via backend
    const cleanTitle = song.title.replace(/\(.*\)|\[.*\]/g, '').trim();
    const cleanArtist = song.artist.split(',')[0].trim();

    fetch(getApiUrl(`/api/lyrics?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`))
      .then(res => res.json())
      .then(data => {
        if (data.syncedLyrics) {
          const parsed = parseLRC(data.syncedLyrics);
          if (parsed.length > 0) {
            setLyricsData({ synced: parsed, plain: '', loading: false });
            return;
          }
        }
        if (data.plainLyrics) {
          setLyricsData({ synced: [], plain: data.plainLyrics, loading: false });
        } else {
          setLyricsData({ synced: [], plain: song.lyrics, loading: false });
        }
      })
      .catch(err => {
        console.warn("Failed to fetch synced lyrics from API, using DB lyrics:", err);
        setLyricsData({ synced: [], plain: song.lyrics, loading: false });
      });
  }, [song]);

  // Find active line index
  let activeIndex = -1;
  if (lyricsData.synced.length > 0) {
    for (let i = 0; i < lyricsData.synced.length; i++) {
      if (currentTime >= lyricsData.synced[i].time) {
        activeIndex = i;
      } else {
        break;
      }
    }
  }

  // Auto-scroll active line to center
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeIndex]);

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      audioRef.current.play().catch(() => {});
    }
  };

  const pausePlayback = () => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
    if (useYouTubeFallback) {
      const iframe = document.querySelector('.song-player-panel iframe') as HTMLIFrameElement | null;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
      }
    }
  };

  if (loading || !song) {
    return <Loading />;
  }

  const audioStreamUrl = getApiUrl(`/api/stream/${song.youtube_video_id}`);

  return (
    <div className="song-view-container">
      <Paper elevation={3} className="song-view-card">
        {/* Header */}
        <div className="song-view-header">
          <h2>{song.title} - {song.artist}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setUseYouTubeFallback(!useYouTubeFallback)}
              startIcon={useYouTubeFallback ? <AudiotrackIcon /> : <OndemandVideoIcon />}
            >
              {useYouTubeFallback ? "Stream Audio" : "YouTube Video"}
            </Button>
            <Button size="small" variant="contained" onClick={() => navigate('/navily')}>
              Navily
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="song-view-content">
          {/* Left Panel: Audio Player or YouTube Embed */}
          <div className="song-player-panel">
            {useYouTubeFallback ? (
              <div style={{ width: '100%' }}>
                {create_embed(song.youtube_video_id, `${song.title} by ${song.artist}`)}
                <p style={{ marginTop: '12px', fontSize: '0.85rem', color: '#666' }}>
                  Playing from YouTube embed
                </p>
              </div>
            ) : (
              <>
                <div className="song-artwork-container">
                  <img
                    src={song.image_url || song.thumbnail_url}
                    alt={song.title}
                    className="song-artwork-img"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = song.thumbnail_url;
                    }}
                  />
                </div>

                <div className="song-player-info">
                  <h3>{song.title}</h3>
                  <p>{song.artist} {song.year ? `(${song.year})` : ''}</p>
                </div>

                {audioError ? (
                  <div style={{ padding: '12px', background: '#ffebee', borderRadius: '10px', color: '#c62828', fontSize: '0.85rem' }}>
                    <p style={{ margin: '0 0 8px 0' }}>Local audio stream not found.</p>
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      onClick={() => setUseYouTubeFallback(true)}
                    >
                      Watch on YouTube
                    </Button>
                  </div>
                ) : (
                  <audio
                    ref={audioRef}
                    id="song-audio-player"
                    controls
                    className="song-audio-element"
                    src={audioStreamUrl}
                    onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                    onError={() => {
                      console.warn("Audio stream error for:", audioStreamUrl);
                      setAudioError(true);
                    }}
                  />
                )}

                <button
                  className="player-mode-toggle"
                  onClick={() => setUseYouTubeFallback(!useYouTubeFallback)}
                >
                  {useYouTubeFallback ? "Switch to Audio Stream" : "Switch to YouTube Video"}
                </button>
              </>
            )}
          </div>

          {/* Right Panel: Synchronized / Plain Lyrics */}
          <div className="song-lyrics-panel">
            <div className="song-lyrics-header">
              <span>Lyrics</span>
              {lyricsData.synced.length > 0 && (
                <span className="song-lyrics-badge">
                  <MusicNoteIcon style={{ fontSize: '14px' }} /> Synchronized
                </span>
              )}
            </div>

            <div ref={containerRef} className="song-lyrics-scroll-container hide-scrollbar-y">
              {lyricsData.loading ? (
                <div className="lyrics-status-box">
                  <Loading />
                  <p>Loading synchronized lyrics...</p>
                </div>
              ) : lyricsData.synced.length > 0 ? (
                /* Synchronized LRC Lyrics */
                <div>
                  {lyricsData.synced.map((line, index) => {
                    const isActive = index === activeIndex;
                    return (
                      <div
                        key={index}
                        ref={isActive ? activeLineRef : null}
                        className={`lyric-line-row ${isActive ? 'active' : ''}`}
                        onClick={(e) => {
                          // Only seek if clicking line background or timestamp
                          if ((e.target as HTMLElement).classList.contains('lyric-line-row') ||
                              (e.target as HTMLElement).classList.contains('lyric-timestamp-btn') ||
                              (e.target as HTMLElement).classList.contains('lyric-text-content')) {
                            seek(line.time);
                          }
                        }}
                      >
                        <Tooltip title="Click to jump to this point in song">
                          <span
                            className="lyric-timestamp-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              seek(line.time);
                            }}
                          >
                            <PlayArrowIcon style={{ fontSize: '12px', marginRight: '2px' }} />
                            {formatTime(line.time)}
                          </span>
                        </Tooltip>

                        <div className="lyric-text-content">
                          {line.text.split(" ").map((word, wIdx) => (
                            <ClickableWord key={wIdx} word={word} language={song.language} onTranslate={pausePlayback} />
                          ))}
                        </div>

                        <div className="lyric-line-actions" onClick={(e) => e.stopPropagation()}>
                          <ClickableLyric language={song.language} lyric={line.text} song={song} onTranslate={pausePlayback} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Plain Lyrics Fallback */
                <div className="plain-lyrics-container">
                  {song.lyrics.trim().split("\n").map((lyric, index) => (
                    <div key={index} style={{ marginBottom: '6px' }}>
                      {lyric.split(" ").map((word, wIdx) => (
                        <ClickableWord key={wIdx} word={word} language={song.language} onTranslate={pausePlayback} />
                      ))}
                      {lyric === "" && <br />}
                      {!lyric.startsWith("[") && !lyric.endsWith("]") && lyric !== "" && (
                        <ClickableLyric language={song.language} lyric={lyric} song={song} onTranslate={pausePlayback} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Paper>
    </div>
  );
};

export default SongView;