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
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import TStory from "../database/TStory";
import "../styles/reading-page.css";
import { useEffect, useMemo, useRef, useState } from "react";
import Database from "../database/Database";
import TLanguage from "../database/TLanguage";
import { useNavigate } from "react-router-dom";
import { AuthenticatedComponentDefaultProps } from "./base/Authenticator";

type SortOption = "all" | "short" | "long" | "diff_asc" | "diff_desc";

const cefrRank: Record<string, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
};

const getCefrBadgeColors = (level?: string) => {
  switch (level?.toUpperCase()) {
    case "A1":
    case "A2":
      return {
        bg: "#ecfdf5",
        border: "#a7f3d0",
        color: "#059669",
        desc: "Beginner",
      };
    case "B1":
    case "B2":
      return {
        bg: "#f0f9ff",
        border: "#bae6fd",
        color: "#0284c7",
        desc: "Intermediate",
      };
    case "C1":
    case "C2":
      return {
        bg: "#f5f3ff",
        border: "#ddd6fe",
        color: "#7c3aed",
        desc: "Advanced",
      };
    default:
      return {
        bg: "#f1f5f9",
        border: "#e2e8f0",
        color: "#64748b",
        desc: "Unrated",
      };
  }
};

const StoriesSearch = ({ user_settings }: AuthenticatedComponentDefaultProps) => {
  const language = (user_settings?.language as TLanguage) || "Romanian";

  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [stories, setStories] = useState<TStory[]>([]);
  const [search, setSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cacheKey = `stories_v2_${language}`;
    if (window.sessionStorage.getItem(cacheKey)) {
      const _stories = JSON.parse(window.sessionStorage.getItem(cacheKey) as string);
      setStories(_stories);
      setLoading(false);
      return;
    }

    Database.GetAllStories(language).then((fetchedStories) => {
      setStories(fetchedStories);
      window.sessionStorage.setItem(cacheKey, JSON.stringify(fetchedStories));
      window.sessionStorage.setItem("stories", JSON.stringify(fetchedStories));
      setLoading(false);
    });
  }, [language]);

  const strip_diacritics = (str: string) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const getWordCount = (body: string): number => {
    return body.trim().split(/\s+/).filter(Boolean).length;
  };

  const getReadingTime = (count: number): string => {
    const min = Math.max(1, Math.ceil(count / 180));
    return `~${min} min read`;
  };

  const getExcerpt = (body: string): string => {
    const clean = body.replace(/\r\n/g, "\n").trim();
    const firstParagraph = clean.split("\n").map((p) => p.trim()).filter(Boolean)[0] || "";
    return firstParagraph;
  };

  const filteredAndSortedStories = useMemo(() => {
    let list = stories;
    const trimmed = search.trim();
    if (trimmed.length > 0) {
      const q = strip_diacritics(trimmed.toLowerCase());
      list = list.filter(
        (story) =>
          strip_diacritics(story.title.toLowerCase()).includes(q) ||
          strip_diacritics(story.body.toLowerCase()).includes(q)
      );
    }

    if (sortBy === "short") {
      list = [...list].sort((a, b) => getWordCount(a.body) - getWordCount(b.body));
    } else if (sortBy === "long") {
      list = [...list].sort((a, b) => getWordCount(b.body) - getWordCount(a.body));
    } else if (sortBy === "diff_asc") {
      list = [...list].sort(
        (a, b) =>
          (cefrRank[a.cefr_level?.toUpperCase() || ""] || 99) -
          (cefrRank[b.cefr_level?.toUpperCase() || ""] || 99)
      );
    } else if (sortBy === "diff_desc") {
      list = [...list].sort(
        (a, b) =>
          (cefrRank[b.cefr_level?.toUpperCase() || ""] || 0) -
          (cefrRank[a.cefr_level?.toUpperCase() || ""] || 0)
      );
    }

    return list;
  }, [stories, search, sortBy]);

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
        {/* Header with Title and Story Count Badge */}
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
                Reading Library
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
                Stories in {language}
              </Typography>
              <Typography sx={{ color: "#64748b", fontSize: "0.95rem", mt: 0.5 }}>
                Explore short stories to practice reading, translate phrases, and build your vocabulary.
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
                <MenuBookRoundedIcon sx={{ fontSize: "1.1rem" }} />
                <span>
                  {stories.length} {stories.length === 1 ? "Story" : "Stories"}
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
            placeholder="Search stories by title or content..."
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
                { label: "Shortest", value: "short" as const },
                { label: "Longest", value: "long" as const },
              ].map((opt) => (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  size="small"
                  clickable
                  onClick={() => setSortBy(opt.value)}
                  sx={{
                    borderRadius: "8px",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    backgroundColor: sortBy === opt.value ? "#eff6ff" : "#f8fafc",
                    color: sortBy === opt.value ? "var(--primary-blue)" : "#64748b",
                    border: sortBy === opt.value ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                    "&:hover": {
                      backgroundColor: sortBy === opt.value ? "#dbeafe" : "#f1f5f9",
                    },
                  }}
                />
              ))}

              {/* Toggleable Difficulty Chip */}
              <Chip
                label={
                  sortBy === "diff_asc"
                    ? "Difficulty ↑ (A1-C2)"
                    : sortBy === "diff_desc"
                    ? "Difficulty ↓ (C2-A1)"
                    : "Difficulty"
                }
                size="small"
                clickable
                onClick={() => {
                  if (sortBy === "diff_asc") {
                    setSortBy("diff_desc");
                  } else {
                    setSortBy("diff_asc");
                  }
                }}
                sx={{
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  backgroundColor:
                    sortBy === "diff_asc" || sortBy === "diff_desc" ? "#eff6ff" : "#f8fafc",
                  color:
                    sortBy === "diff_asc" || sortBy === "diff_desc"
                      ? "var(--primary-blue)"
                      : "#64748b",
                  border:
                    sortBy === "diff_asc" || sortBy === "diff_desc"
                      ? "1px solid #bfdbfe"
                      : "1px solid #e2e8f0",
                  "&:hover": {
                    backgroundColor:
                      sortBy === "diff_asc" || sortBy === "diff_desc" ? "#dbeafe" : "#f1f5f9",
                  },
                }}
              />
            </Box>

            <Typography sx={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>
              Showing {filteredAndSortedStories.length} of {stories.length}{" "}
              {stories.length === 1 ? "story" : "stories"}
            </Typography>
          </Box>
        </Paper>

        {/* Stories List */}
        <Stack spacing={2} sx={{ width: "100%" }}>
          {filteredAndSortedStories.length === 0 ? (
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
                <AutoStoriesOutlinedIcon sx={{ fontSize: 28 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b" }}>
                No stories found
              </Typography>
              <Typography sx={{ color: "#64748b", fontSize: "0.9rem", maxWidth: "420px" }}>
                {search
                  ? `We couldn't find any stories matching "${search}". Try searching with different keywords.`
                  : "No stories available with the current filter."}
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
            filteredAndSortedStories.map((story: TStory) => {
              const wordCount = getWordCount(story.body);
              const readTime = getReadingTime(wordCount);
              const excerpt = getExcerpt(story.body);

              return (
                <Paper
                  key={story.id}
                  elevation={0}
                  className="story-card-modern"
                  onClick={() => navigate(`/reading/${story.id}`)}
                  sx={{
                    p: { xs: 2, sm: 2.5 },
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
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2.25, minWidth: 0, flex: 1 }}>
                    <Box
                      className="story-card-icon"
                      sx={{
                        width: { xs: 44, sm: 48 },
                        height: { xs: 44, sm: 48 },
                        borderRadius: "14px",
                        backgroundColor: "#eff6ff",
                        color: "var(--primary-blue)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "all 0.2s ease",
                      }}
                    >
                      <MenuBookRoundedIcon sx={{ fontSize: { xs: 22, sm: 26 } }} />
                    </Box>

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
                        <Typography
                          className="story-card-title"
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            fontSize: { xs: "1.02rem", sm: "1.12rem" },
                            color: "#0f172a",
                            letterSpacing: "-0.01em",
                            transition: "color 0.15s ease",
                          }}
                        >
                          {story.title}
                        </Typography>

                        {story.cefr_level && (() => {
                          const badge = getCefrBadgeColors(story.cefr_level);
                          return (
                            <Box
                              sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                px: 0.85,
                                py: 0.15,
                                borderRadius: "6px",
                                backgroundColor: badge.bg,
                                border: `1px solid ${badge.border}`,
                                color: badge.color,
                                fontSize: "0.72rem",
                                fontWeight: 800,
                                letterSpacing: "0.04em",
                                userSelect: "none",
                              }}
                              title={`CEFR Language Level: ${story.cefr_level} (${badge.desc})`}
                            >
                              {story.cefr_level.toUpperCase()}
                            </Box>
                          );
                        })()}
                      </Box>

                      {excerpt && (
                        <Typography
                          className="story-excerpt-clamp"
                          sx={{
                            fontSize: "0.875rem",
                            color: "#64748b",
                            mb: 1.25,
                          }}
                        >
                          {excerpt}
                        </Typography>
                      )}

                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.5,
                            px: 1.1,
                            py: 0.3,
                            borderRadius: "8px",
                            backgroundColor: "#f1f5f9",
                            color: "#475569",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                          }}
                        >
                          {wordCount} words
                        </Box>

                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.5,
                            color: "#94a3b8",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                          }}
                        >
                          <AccessTimeRoundedIcon sx={{ fontSize: "0.85rem" }} />
                          {readTime}
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  <IconButton
                    className="story-card-arrow"
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

export default StoriesSearch;