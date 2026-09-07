import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import LibraryMusicOutlinedIcon from "@mui/icons-material/LibraryMusicOutlined";
import { useEffect, useMemo, useRef, useState } from "react";
import TSong from "../database/TSong";
import { useNavigate } from "react-router-dom";
import Database from "../database/Database";
import { AuthenticatedComponentDefaultProps } from "./base/Authenticator";
import TLanguage from "../database/TLanguage";
import "../styles/music-page.css";

type SortOption = "all" | "newest" | "oldest" | "lyrics_sync";

const MusicSearch = ({ user_settings }: AuthenticatedComponentDefaultProps) => {
  const language = (user_settings?.language as TLanguage) || "Romanian";

  const inputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("all");
  const [songs, setSongs] = useState<TSong[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const cacheKey = `songs_v2_${language}`;
    if (window.sessionStorage.getItem(cacheKey)) {
      const _songs = JSON.parse(window.sessionStorage.getItem(cacheKey) as string);
      setSongs(_songs);
      setLoading(false);
      return;
    }

    Database.GetAllSongs(language).then((_songs: TSong[]) => {
      setSongs(_songs);
      window.sessionStorage.setItem(cacheKey, JSON.stringify(_songs));
      window.sessionStorage.setItem("songs", JSON.stringify(_songs));
      setLoading(false);
    });
  }, [language]);

  const strip_diacritics = (str: string) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const hasSyncedLyrics = (song: TSong): boolean => {
    if (song.has_synced_lyrics !== undefined && song.has_synced_lyrics !== null) {
      return !!song.has_synced_lyrics;
    }
    if (!song.lyrics) return false;
    return /\[\d{2}:\d{2}\.\d{2,3}\]/.test(song.lyrics);
  };

  const filteredAndSortedSongs = useMemo(() => {
    let list = songs;
    const trimmed = search.trim();
    if (trimmed.length > 0) {
      const q = strip_diacritics(trimmed.toLowerCase());
      list = list.filter((song: TSong) =>
        strip_diacritics(song.title.toLowerCase()).includes(q) ||
        strip_diacritics(song.artist.toLowerCase()).includes(q)
      );
    }

    if (sortBy === "lyrics_sync") {
      list = list.filter((song) => hasSyncedLyrics(song));
    } else if (sortBy === "newest") {
      list = [...list].sort((a, b) => (b.year || 0) - (a.year || 0));
    } else if (sortBy === "oldest") {
      list = [...list].sort((a, b) => {
        if (!a.year) return 1;
        if (!b.year) return -1;
        return a.year - b.year;
      });
    }

    return list;
  }, [songs, search, sortBy]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          width: "100%",
        }}
      >
        <CircularProgress size={36} sx={{ color: "var(--primary-blue)" }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        backgroundColor: "#fafbfc",
        minHeight: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        py: { xs: 3, sm: 5 },
        px: { xs: 2, sm: 4 },
        boxSizing: "border-box",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: "860px" }}>
        {/* Header with Title and Song Count Badge */}
        <Box sx={{ mb: 3.5 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 2,
              mb: 1,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#9ca3af",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  mb: 0.5,
                }}
              >
                Music Library
              </Typography>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 800,
                  color: "#111827",
                  letterSpacing: "-0.02em",
                  fontSize: { xs: "1.75rem", sm: "2rem" },
                }}
              >
                Songs in {language}
              </Typography>
              <Typography sx={{ color: "#64748b", fontSize: "0.95rem", mt: 0.5 }}>
                Listen to music, follow synchronized lyrics, and expand your listening comprehension.
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1, alignSelf: { xs: "flex-start", sm: "center" } }}>
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.75,
                  px: 1.5,
                  py: 0.6,
                  borderRadius: "12px",
                  backgroundColor: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  color: "var(--primary-blue)",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                }}
              >
                <MusicNoteRoundedIcon sx={{ fontSize: "1.1rem" }} />
                <span>
                  {songs.length} {songs.length === 1 ? "Song" : "Songs"}
                </span>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Search & Sort Panel */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5 },
            mb: 3,
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            backgroundColor: "#ffffff",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.04)",
          }}
        >
          <TextField
            fullWidth
            inputRef={inputRef}
            placeholder="Search songs by title or artist..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            variant="outlined"
            size="medium"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: "#94a3b8" }} />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSearch("");
                      inputRef.current?.focus();
                    }}
                    aria-label="clear search"
                    sx={{ color: "#94a3b8", "&:hover": { color: "#475569" } }}
                  >
                    <CloseRoundedIcon sx={{ fontSize: "1.2rem" }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
              sx: {
                borderRadius: "12px",
                backgroundColor: "#f8fafc",
                "& fieldset": {
                  borderColor: "#e2e8f0",
                },
                "&:hover fieldset": {
                  borderColor: "#cbd5e1",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "var(--primary-blue)",
                },
              },
            }}
          />

          {/* Quick Sort Chips & Results Counter */}
          <Box
            sx={{
              mt: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 1.5,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Typography
                sx={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  mr: 0.5,
                }}
              >
                Sort:
              </Typography>
              {[
                { label: "All", value: "all" as const },
                { label: "Newest", value: "newest" as const },
                { label: "Oldest", value: "oldest" as const },
                { label: "Lyrics Sync", value: "lyrics_sync" as const },
              ].map((opt) => {
                const isSelected = sortBy === opt.value;
                const isSync = opt.value === "lyrics_sync";
                return (
                  <Chip
                    key={opt.value}
                    label={opt.label}
                    size="small"
                    clickable
                    icon={
                      isSync ? (
                        <MusicNoteRoundedIcon
                          sx={{
                            fontSize: "0.95rem !important",
                            color: isSelected ? "#ff2c5a !important" : "#94a3b8 !important",
                          }}
                        />
                      ) : undefined
                    }
                    onClick={() =>
                      setSortBy(isSelected && opt.value !== "all" ? "all" : opt.value)
                    }
                    sx={{
                      borderRadius: "8px",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      backgroundColor: isSelected
                        ? isSync
                          ? "rgba(255, 44, 90, 0.08)"
                          : "#eff6ff"
                        : "#f8fafc",
                      color: isSelected
                        ? isSync
                          ? "#ff2c5a"
                          : "var(--primary-blue)"
                        : "#64748b",
                      border: isSelected
                        ? isSync
                          ? "1px solid rgba(255, 44, 90, 0.3)"
                          : "1px solid #bfdbfe"
                        : "1px solid #e2e8f0",
                      "&:hover": {
                        backgroundColor: isSelected
                          ? isSync
                            ? "rgba(255, 44, 90, 0.14)"
                            : "#dbeafe"
                          : isSync
                          ? "rgba(255, 44, 90, 0.04)"
                          : "#f1f5f9",
                      },
                    }}
                  />
                );
              })}
            </Box>

            <Typography sx={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>
              Showing {filteredAndSortedSongs.length} of {songs.length}{" "}
              {songs.length === 1 ? "song" : "songs"}
            </Typography>
          </Box>
        </Paper>

        {/* Songs List */}
        <Stack spacing={2} sx={{ width: "100%" }}>
          {filteredAndSortedSongs.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                py: 8,
                px: 3,
                textAlign: "center",
                borderRadius: "16px",
                border: "1px dashed #cbd5e1",
                backgroundColor: "#ffffff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  backgroundColor: "#f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#94a3b8",
                }}
              >
                <LibraryMusicOutlinedIcon sx={{ fontSize: 28 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b" }}>
                No songs found
              </Typography>
              <Typography sx={{ color: "#64748b", fontSize: "0.9rem", maxWidth: "420px" }}>
                {search
                  ? `We couldn't find any songs matching "${search}". Try searching for another title or artist.`
                  : "No songs available with the current filter."}
              </Typography>
              {(search || sortBy !== "all") && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setSearch("");
                    setSortBy("all");
                    inputRef.current?.focus();
                  }}
                  sx={{
                    mt: 1,
                    borderRadius: "10px",
                    textTransform: "none",
                    fontWeight: 600,
                    borderColor: "#cbd5e1",
                    color: "var(--primary-blue)",
                    "&:hover": {
                      borderColor: "var(--primary-blue)",
                      backgroundColor: "#eff6ff",
                    },
                  }}
                >
                  Clear filters
                </Button>
              )}
            </Paper>
          ) : (
            filteredAndSortedSongs.map((song: TSong) => {
              const artworkUrl = song.thumbnail_url || song.image_url;

              return (
                <Paper
                  key={song.id}
                  elevation={0}
                  className="song-card-modern"
                  onClick={() => navigate(`/music/${song.id}`)}
                  sx={{
                    p: { xs: 2, sm: 2.25 },
                    borderRadius: "16px",
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#ffffff",
                    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.04)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2.25, minWidth: 0, flex: 1 }}>
                    {/* Song Thumbnail / Artwork */}
                    <Box
                      sx={{
                        width: { xs: 56, sm: 64 },
                        height: { xs: 56, sm: 64 },
                        borderRadius: "12px",
                        overflow: "hidden",
                        backgroundColor: "#f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        border: "1px solid #e2e8f0",
                        position: "relative",
                      }}
                    >
                      {artworkUrl ? (
                        <Box
                          component="img"
                          src={artworkUrl}
                          alt={`${song.title} artwork`}
                          className="song-artwork-thumb"
                          onError={(e: any) => {
                            e.currentTarget.style.display = "none";
                          }}
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <MusicNoteRoundedIcon sx={{ color: "var(--primary-blue)", fontSize: 28 }} />
                      )}
                    </Box>

                    {/* Song Metadata */}
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        className="song-card-title"
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          fontSize: { xs: "1.02rem", sm: "1.12rem" },
                          color: "#0f172a",
                          letterSpacing: "-0.01em",
                          mb: 0.3,
                          transition: "color 0.15s ease",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {song.title}
                      </Typography>

                      <Typography
                        sx={{
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: "#64748b",
                          mb: 0.9,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {song.artist}
                      </Typography>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                        {song.year && (
                          <Box
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 0.5,
                              px: 1,
                              py: 0.25,
                              borderRadius: "8px",
                              backgroundColor: "#f1f5f9",
                              color: "#475569",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                            }}
                          >
                            <CalendarTodayRoundedIcon sx={{ fontSize: "0.8rem" }} />
                            {song.year}
                          </Box>
                        )}

                        {hasSyncedLyrics(song) && (
                          <Box
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 0.4,
                              px: 1,
                              py: 0.25,
                              borderRadius: "8px",
                              backgroundColor: "rgba(255, 44, 90, 0.08)",
                              border: "1px solid rgba(255, 44, 90, 0.2)",
                              color: "#ff2c5a",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                            }}
                          >
                            <MusicNoteRoundedIcon sx={{ fontSize: "0.85rem" }} />
                            Lyrics Sync
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>

                  <IconButton
                    className="song-card-arrow"
                    tabIndex={-1}
                    sx={{
                      color: "#cbd5e1",
                      p: 1,
                      flexShrink: 0,
                      transition: "all 0.2s ease",
                    }}
                  >
                    <ChevronRightRoundedIcon sx={{ fontSize: 26 }} />
                  </IconButton>
                </Paper>
              );
            })
          )}
        </Stack>
      </Box>
    </Box>
  );
};

export default MusicSearch;