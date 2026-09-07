import { useParams } from "react-router-dom";
import TSong from "../database/TSong";
import { AuthenticatedComponentDefaultProps } from "./base/Authenticator";
import Database from "../database/Database";
import { SongID } from "../database/ID";
import { useEffect, useRef, useState } from "react";
import { Button, CircularProgress, Paper, Tooltip } from "@mui/material";
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
  const lines = lrcText.replace(/\r/g, '').split('\n');
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

function create_embed(
  video_id: string,
  frame_title: string,
  iframeRef?: React.RefObject<HTMLIFrameElement>,
  onLoad?: () => void
) {
  const origin = typeof window !== 'undefined' && window.location?.origin
    ? `&origin=${encodeURIComponent(window.location.origin)}`
    : '';
  return (
    <iframe
      ref={iframeRef}
      id="song-youtube-iframe"
      width="100%"
      height="260"
      style={{ borderRadius: '16px', border: 'none' }}
      src={`https://www.youtube.com/embed/${video_id}?autoplay=1&enablejsapi=1${origin}`}
      title={frame_title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen={false}
      onLoad={onLoad}>
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
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const isYouTubePlayingRef = useRef<boolean>(true);
  const useYouTubeFallbackRef = useRef<boolean>(useYouTubeFallback);
  useYouTubeFallbackRef.current = useYouTubeFallback;

  useEffect(() => {
    Database.GetSong(id as SongID).then((_song: TSong) => {
      setSong(_song);
      setLoading(false);
    });
  }, [id]);

  // Load and parse lyrics directly from database
  useEffect(() => {
    if (!song) return;

    const cleanDbLyrics = (song.lyrics || '').replace(/\r/g, '');
    const dbParsed = parseLRC(cleanDbLyrics);
    if (dbParsed.length > 0) {
      setLyricsData({ synced: dbParsed, plain: '', loading: false });
    } else {
      setLyricsData({ synced: [], plain: cleanDbLyrics, loading: false });
    }
  }, [song]);

  const isSynchronized = lyricsData.synced.length > 0 && !useYouTubeFallback;

  // Find active line index
  let activeIndex = -1;
  if (isSynchronized) {
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
    if (isSynchronized && activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeIndex, isSynchronized]);

  const getPlainLyricsLines = () => {
    if (lyricsData.plain) {
      return lyricsData.plain.replace(/\r/g, '').trim().split('\n');
    }
    if (lyricsData.synced.length > 0) {
      return lyricsData.synced.map(line => line.text);
    }
    return (song?.lyrics || '').replace(/\r/g, '').replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '').trim().split('\n');
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      audioRef.current.play().catch(() => {});
    }
  };

  const wasPlayingRef = useRef<boolean>(false);

  const getIframe = (): HTMLIFrameElement | null => {
    return (
      iframeRef.current ||
      (document.getElementById('song-youtube-iframe') as HTMLIFrameElement | null) ||
      (document.querySelector('.song-player-panel iframe') as HTMLIFrameElement | null)
    );
  };

  const playYouTube = () => {
    const iframe = getIframe();
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
    }
  };

  const pauseYouTube = () => {
    const iframe = getIframe();
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
    }
  };

  const toggleYouTube = () => {
    if (isYouTubePlayingRef.current) {
      pauseYouTube();
      isYouTubePlayingRef.current = false;
    } else {
      playYouTube();
      isYouTubePlayingRef.current = true;
    }
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play().catch(err => console.warn("Failed to play audio:", err));
      } else {
        audioRef.current.pause();
      }
    }
  };

  const togglePlayback = () => {
    if (useYouTubeFallbackRef.current) {
      toggleYouTube();
    } else {
      toggleAudio();
    }
  };
  const togglePlaybackRef = useRef(togglePlayback);
  togglePlaybackRef.current = togglePlayback;

  const pausePlayback = () => {
    if (useYouTubeFallbackRef.current) {
      if (isYouTubePlayingRef.current) {
        wasPlayingRef.current = true;
        pauseYouTube();
        isYouTubePlayingRef.current = false;
      }
    } else {
      if (audioRef.current && !audioRef.current.paused) {
        wasPlayingRef.current = true;
        audioRef.current.pause();
      }
    }
  };

  const resumePlayback = () => {
    if (wasPlayingRef.current) {
      if (useYouTubeFallbackRef.current) {
        playYouTube();
        isYouTubePlayingRef.current = true;
      } else if (audioRef.current) {
        audioRef.current.play().catch(err => {
          console.warn("Failed to resume playback:", err);
        });
      }
      wasPlayingRef.current = false;
    }
  };

  const togglePlayerMode = () => {
    if (!useYouTubeFallback) {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
    } else {
      pauseYouTube();
      isYouTubePlayingRef.current = false;
    }
    setUseYouTubeFallback(!useYouTubeFallback);
  };

  // Keep YouTube player state synchronized via postMessage events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      let data = event.data;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      if (!data) return;

      let state: number | undefined;
      if (data.event === 'onStateChange' && typeof data.info === 'number') {
        state = data.info;
      } else if (data.event === 'infoDelivery' && data.info && typeof data.info.playerState === 'number') {
        state = data.info.playerState;
      }

      if (state !== undefined) {
        // YT.PlayerState: 1 = PLAYING, 2 = PAUSED, 0 = ENDED
        if (state === 1) {
          isYouTubePlayingRef.current = true;
        } else if (state === 2 || state === 0) {
          isYouTubePlayingRef.current = false;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Notify YouTube iframe to send state change events when YouTube fallback is active
  useEffect(() => {
    if (useYouTubeFallback) {
      isYouTubePlayingRef.current = true;

      const notifyListening = () => {
        const iframe = getIframe();
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage('{"event":"listening"}', '*');
        }
      };

      notifyListening();
      const t1 = setTimeout(notifyListening, 500);
      const t2 = setTimeout(notifyListening, 1500);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [useYouTubeFallback, song]);

  // Pressing space while focused anywhere on /music should pause or unpause the video
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only respond to Space bar
      if (e.code !== 'Space' && e.key !== ' ') {
        return;
      }

      // Ignore if modifier keys are pressed
      if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) {
        return;
      }

      // Prevent repeated triggers when holding down space
      if (e.repeat) {
        return;
      }

      // Don't hijack space if focused on an editable element (e.g. input, textarea)
      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl) {
        const tag = activeEl.tagName.toUpperCase();
        if (tag === 'INPUT' || tag === 'TEXTAREA' || activeEl.isContentEditable) {
          return;
        }
      }

      // If a modal/dialog is open, do not toggle playback
      if (document.querySelector('.MuiDialog-root')) {
        return;
      }

      // Prevent default browser behavior (e.g. scrolling the page or activating a focused button)
      e.preventDefault();

      // If a button has focus, blur it so it doesn't trigger on space
      if (activeEl && (activeEl.tagName === 'BUTTON' || activeEl.getAttribute('role') === 'button')) {
        activeEl.blur();
      }

      togglePlaybackRef.current();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
              onClick={togglePlayerMode}
              startIcon={useYouTubeFallback ? <AudiotrackIcon /> : <OndemandVideoIcon />}
            >
              {useYouTubeFallback ? "Stream Audio" : "YouTube Video"}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="song-view-content">
          {/* Left Panel: Audio Player or YouTube Embed */}
          <div className="song-player-panel">
            {useYouTubeFallback ? (
              <div style={{ width: '100%' }}>
                {create_embed(
                  song.youtube_video_id,
                  `${song.title} by ${song.artist}`,
                  iframeRef,
                  () => {
                    if (iframeRef.current?.contentWindow) {
                      iframeRef.current.contentWindow.postMessage('{"event":"listening"}', '*');
                    }
                  }
                )}
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
                  onClick={togglePlayerMode}
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
              {isSynchronized && (
                <span className="song-lyrics-badge">
                  <MusicNoteIcon style={{ fontSize: '14px' }} /> Synchronized
                </span>
              )}
            </div>

            <div ref={containerRef} className="song-lyrics-scroll-container hide-scrollbar-y">
              {lyricsData.loading ? (
                <div className="lyrics-status-box">
                  <CircularProgress size="2.5rem" sx={{ color: 'var(--musica-pink-dark, #FF2C5A)' }} />
                  <p>Loading lyrics...</p>
                </div>
              ) : isSynchronized ? (
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
                            <ClickableWord
                              key={wIdx}
                              word={word}
                              language={song.language}
                              onTranslate={pausePlayback}
                              onCloseModal={resumePlayback}
                            />
                          ))}
                        </div>

                        <div className="lyric-line-actions" onClick={(e) => e.stopPropagation()}>
                          <ClickableLyric
                            language={song.language}
                            lyric={line.text}
                            song={song}
                            onTranslate={pausePlayback}
                            onCloseModal={resumePlayback}
                            full_lyrics={(song.lyrics || '').replace(/\r/g, '')}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Plain Lyrics Fallback */
                <div className="plain-lyrics-container">
                  {getPlainLyricsLines().map((lyric, index) => (
                    <div key={index} style={{ marginBottom: '6px' }}>
                      {lyric.split(" ").map((word, wIdx) => (
                        <ClickableWord
                          key={wIdx}
                          word={word}
                          language={song.language}
                          onTranslate={pausePlayback}
                          onCloseModal={resumePlayback}
                        />
                      ))}
                      {lyric === "" && <br />}
                      {!lyric.startsWith("[") && !lyric.endsWith("]") && lyric !== "" && (
                        <ClickableLyric
                          language={song.language}
                          lyric={lyric}
                          song={song}
                          onTranslate={pausePlayback}
                          onCloseModal={resumePlayback}
                          full_lyrics={(song.lyrics || '').replace(/\r/g, '')}
                        />
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