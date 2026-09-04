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
  # Fallback extraction
  if [[ "$INPUT_ID" =~ ([a-zA-Z0-9_-]{11}) ]]; then
    YOUTUBE_ID="${BASH_REMATCH[1]}"
  else
    echo "Warning: Could not automatically detect 11-char YouTube ID. Using raw input: $INPUT_ID"
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

echo ""
echo "Extracting YouTube metadata..."
METADATA_JSON=$($YTDL_CMD --dump-json --skip-download "https://www.youtube.com/watch?v=$YOUTUBE_ID" 2>/dev/null || echo "{}")

if [ -z "$TITLE" ]; then
  AUTO_TITLE=$(node -e "try { const d = JSON.parse(process.argv[1]); console.log(d.track || d.title || ''); } catch(e){}" "$METADATA_JSON")
  if [ -n "$AUTO_TITLE" ]; then
    read -p "Song Title [$AUTO_TITLE]: " INPUT_TITLE
    TITLE="${INPUT_TITLE:-$AUTO_TITLE}"
  else
    read -p "Enter Song Title: " TITLE
  fi
fi

if [ -z "$ARTIST" ]; then
  AUTO_ARTIST=$(node -e "try { const d = JSON.parse(process.argv[1]); console.log(d.artist || d.uploader || d.channel || ''); } catch(e){}" "$METADATA_JSON")
  if [ -n "$AUTO_ARTIST" ]; then
    read -p "Song Artist [$AUTO_ARTIST]: " INPUT_ARTIST
    ARTIST="${INPUT_ARTIST:-$AUTO_ARTIST}"
  else
    read -p "Enter Song Artist: " ARTIST
  fi
fi

if [ -z "$YEAR" ]; then
  AUTO_YEAR=$(node -e "try { const d = JSON.parse(process.argv[1]); console.log(d.release_year || (d.upload_date ? d.upload_date.slice(0,4) : '')); } catch(e){}" "$METADATA_JSON")
  if [ -n "$AUTO_YEAR" ]; then
    read -p "Release Year [$AUTO_YEAR]: " INPUT_YEAR
    YEAR="${INPUT_YEAR:-$AUTO_YEAR}"
  else
    read -p "Release Year (optional, press Enter to skip): " YEAR
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

# 7. Sourcing Synchronized Lyrics (LRCLIB)
echo ""
echo "Fetching synchronized lyrics from LRCLIB for '$TITLE' by '$ARTIST'..."

LYRICS_RESULT=$(node -e '
const https = require("https");
const track = process.argv[1];
const artist = process.argv[2];

function fetchLyrics(query) {
  const url = "https://lrclib.net/api/" + query;
  return new Promise((resolve) => {
    https.get(url, { headers: { "User-Agent": "RoBotica/1.0" } }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch(e) {
          resolve(null);
        }
      });
    }).on("error", () => resolve(null));
  });
}

(async () => {
  const exact = await fetchLyrics("get?track_name=" + encodeURIComponent(track) + "&artist_name=" + encodeURIComponent(artist));
  if (exact && exact.syncedLyrics) {
    process.stdout.write(JSON.stringify({ type: "synced", lyrics: exact.syncedLyrics }));
    return;
  }
  const search = await fetchLyrics("search?q=" + encodeURIComponent(track + " " + artist));
  if (Array.isArray(search) && search.length > 0) {
    const match = search.find(s => s.syncedLyrics) || search[0];
    if (match.syncedLyrics) {
      process.stdout.write(JSON.stringify({ type: "synced", lyrics: match.syncedLyrics }));
      return;
    }
    if (match.plainLyrics) {
      process.stdout.write(JSON.stringify({ type: "plain", lyrics: match.plainLyrics }));
      return;
    }
  }
  process.stdout.write(JSON.stringify({ type: "none", lyrics: "" }));
})();
' "$TITLE" "$ARTIST")

LYRICS_TYPE=$(node -e "try { console.log(JSON.parse(process.argv[1]).type); } catch(e) { console.log('none'); }" "$LYRICS_RESULT")
LYRICS_CONTENT=$(node -e "try { console.log(JSON.parse(process.argv[1]).lyrics); } catch(e) { console.log(''); }" "$LYRICS_RESULT")

if [ "$LYRICS_TYPE" = "synced" ]; then
  echo "Found time-synced lyrics (LRC format) on LRCLIB!"
elif [ "$LYRICS_TYPE" = "plain" ]; then
  echo "Found plain lyrics on LRCLIB (no sync timestamps)."
else
  echo "No lyrics found automatically on LRCLIB."
fi

# 8. Insert or Update Database
echo ""
echo "Adding song to database..."

THUMBNAIL_URL="https://i.ytimg.com/vi/${YOUTUBE_ID}/hqdefault.jpg"
IMAGE_URL="https://i.ytimg.com/vi/${YOUTUBE_ID}/maxresdefault.jpg"

PAYLOAD=$(node -e '
const payload = {
  language: process.argv[1],
  title: process.argv[2],
  artist: process.argv[3],
  year: process.argv[4] ? parseInt(process.argv[4], 10) : null,
  lyrics: process.argv[5] || "",
  thumbnail_url: process.argv[6],
  image_url: process.argv[7],
  youtube_video_id: process.argv[8]
};
process.stdout.write(JSON.stringify(payload));
' "$LANGUAGE" "$TITLE" "$ARTIST" "$YEAR" "$LYRICS_CONTENT" "$THUMBNAIL_URL" "$IMAGE_URL" "$YOUTUBE_ID")

node scripts/add_song_db.js "$PAYLOAD"

echo ""
echo "=========================================================="
echo " [Done] Song '$TITLE' by '$ARTIST' is ready!"
echo " Audio: server/music/${YOUTUBE_ID}.mp3"
echo " Stream: /api/stream/${YOUTUBE_ID}"
echo " Lyrics: $LYRICS_TYPE"
echo "=========================================================="
