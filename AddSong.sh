#!/usr/bin/env bash

# AddSong.sh - Download audio using yt-dlp, fetch synced lyrics from LRCLIB, and register the song in DB

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================================="
echo "          RoBotica - Add Song & Stream Audio              "
echo "=========================================================="

# 1. Resolve YouTube ID or URL
INPUT_ID="$1"
if [ -z "$INPUT_ID" ]; then
  read -p "Enter YouTube Video ID or URL: " INPUT_ID
fi

if [ -z "$INPUT_ID" ]; then
  echo "Error: YouTube Video ID or URL is required."
  exit 1
fi

# Extract video ID from URL if full URL is passed
YOUTUBE_ID=$(echo "$INPUT_ID" | sed -E 's/.*(v=|youtu\.be\/|embed\/|\/v\/|\/e\/|watch\?v=|&v=)([a-zA-Z0-9_-]{11}).*/\2/')
if [ ${#YOUTUBE_ID} -ne 11 ]; then
  if [[ "$INPUT_ID" =~ ([a-zA-Z0-9_-]{11}) ]]; then
    YOUTUBE_ID="${BASH_REMATCH[1]}"
  else
    YOUTUBE_ID="$INPUT_ID"
  fi
fi

echo "YouTube ID: $YOUTUBE_ID"

# 2. Select Language
LANGUAGE="$2"
if [ -z "$LANGUAGE" ]; then
  echo ""
  echo "Select language for this song:"
  echo "1) Romanian"
  echo "2) Spanish"
  echo "3) French"
  echo "4) Italian"
  echo "5) Portuguese"
  echo "6) German"
  read -p "Enter number (1-6) or type name [default: Spanish]: " LANG_CHOICE
  case "$LANG_CHOICE" in
    1) LANGUAGE="Romanian" ;;
    2) LANGUAGE="Spanish" ;;
    3) LANGUAGE="French" ;;
    4) LANGUAGE="Italian" ;;
    5) LANGUAGE="Portuguese" ;;
    6) LANGUAGE="German" ;;
    "Romanian"|"Spanish"|"French"|"Italian"|"Portuguese"|"German") ;;
    *) LANGUAGE="Spanish" ;;
  esac
fi
echo "Language: $LANGUAGE"

# 3. Check yt-dlp availability
YTDL_CMD=""
if python -m yt_dlp --version &> /dev/null; then
  YTDL_CMD="python -m yt_dlp"
elif python3 -m yt_dlp --version &> /dev/null; then
  YTDL_CMD="python3 -m yt_dlp"
elif command -v yt-dlp &> /dev/null; then
  YTDL_CMD="yt-dlp"
else
  echo "Error: yt-dlp is not installed. Please install it with 'pip install yt-dlp'."
  exit 1
fi

# 4. Create directories
mkdir -p server/music
mkdir -p music

# 5. Extract metadata if Title or Artist not provided
TITLE="$3"
ARTIST="$4"
YEAR="$5"

if [ -z "$TITLE" ] || [ -z "$ARTIST" ] || [ -z "$YEAR" ]; then
  echo ""
  echo "Extracting YouTube metadata..."
  
  AUTO_RAW_TITLE=$($YTDL_CMD --print "%(track,title)s" --skip-download "https://www.youtube.com/watch?v=$YOUTUBE_ID" 2>/dev/null | head -n 1 || true)
  AUTO_RAW_ARTIST=$($YTDL_CMD --print "%(artist,creator,uploader)s" --skip-download "https://www.youtube.com/watch?v=$YOUTUBE_ID" 2>/dev/null | head -n 1 || true)
  AUTO_RAW_DATE=$($YTDL_CMD --print "%(release_year,upload_date)s" --skip-download "https://www.youtube.com/watch?v=$YOUTUBE_ID" 2>/dev/null | head -n 1 || true)
  AUTO_YEAR="${AUTO_RAW_DATE:0:4}"

  # Smart split if title contains "Artist - Title" format
  SUGGESTED_TITLE="$AUTO_RAW_TITLE"
  SUGGESTED_ARTIST="$AUTO_RAW_ARTIST"

  if [[ "$AUTO_RAW_TITLE" == *" - "* ]]; then
    SUGGESTED_ARTIST="${AUTO_RAW_TITLE%% - *}"
    SUGGESTED_TITLE="${AUTO_RAW_TITLE#* - }"
    # Clean up trailing (Official Video), [HQ], etc.
    SUGGESTED_TITLE=$(echo "$SUGGESTED_TITLE" | sed -E 's/\s*[\(\[].*[\)\]]//g')
  fi

  if [ -z "$TITLE" ]; then
    if [ -n "$SUGGESTED_TITLE" ]; then
      read -p "Song Title [$SUGGESTED_TITLE]: " INPUT_TITLE
      TITLE="${INPUT_TITLE:-$SUGGESTED_TITLE}"
    else
      read -p "Enter Song Title: " TITLE
    fi
  fi

  if [ -z "$ARTIST" ]; then
    if [ -n "$SUGGESTED_ARTIST" ]; then
      read -p "Song Artist [$SUGGESTED_ARTIST]: " INPUT_ARTIST
      ARTIST="${INPUT_ARTIST:-$SUGGESTED_ARTIST}"
    else
      read -p "Enter Song Artist: " ARTIST
    fi
  fi

  if [ -z "$YEAR" ]; then
    if [ -n "$AUTO_YEAR" ]; then
      read -p "Release Year [$AUTO_YEAR]: " INPUT_YEAR
      YEAR="${INPUT_YEAR:-$AUTO_YEAR}"
    else
      read -p "Release Year (optional, press Enter to skip): " YEAR
    fi
  fi
fi

# 6. Download Audio Stream
echo ""
echo "Downloading audio stream using yt-dlp..."
$YTDL_CMD -x --audio-format mp3 --audio-quality 192K --no-playlist -o "server/music/${YOUTUBE_ID}.%(ext)s" "https://www.youtube.com/watch?v=$YOUTUBE_ID"

# Keep copy in music/ as well
if [ -f "server/music/${YOUTUBE_ID}.mp3" ]; then
  cp "server/music/${YOUTUBE_ID}.mp3" "music/${YOUTUBE_ID}.mp3" 2>/dev/null || true
  echo "Audio file successfully saved to server/music/${YOUTUBE_ID}.mp3"
else
  echo "Warning: Audio file server/music/${YOUTUBE_ID}.mp3 was not created."
fi

# 7. Sourcing Synchronized Lyrics & Database Registration
echo ""
node scripts/fetch_and_add_song.js "$LANGUAGE" "$TITLE" "$ARTIST" "$YEAR" "$YOUTUBE_ID"

echo ""
echo "=========================================================="
echo " [Done] Song '$TITLE' by '$ARTIST' is ready!"
echo " Audio: server/music/${YOUTUBE_ID}.mp3"
echo " Stream: /api/stream/${YOUTUBE_ID}"
echo "=========================================================="
