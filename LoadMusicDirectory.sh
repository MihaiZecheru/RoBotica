#!/usr/bin/env bash

# LoadMusicDirectory.sh - Pull all existing songs from the database and download them into the music folder

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================================="
echo "       RoBotica - Sync & Download All Music from DB       "
echo "=========================================================="

# 1. Parse CLI arguments
FORCE=false
DRY_RUN=false
LIMIT=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --force)
      FORCE=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --limit)
      LIMIT="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: ./LoadMusicDirectory.sh [options]"
      echo ""
      echo "Options:"
      echo "  --force        Re-download existing MP3 files"
      echo "  --dry-run      List songs without downloading"
      echo "  --limit <N>    Download at most N songs (useful for testing)"
      echo "  -h, --help     Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use -h or --help for usage."
      exit 1
      ;;
  esac
done

# 2. Check Node.js availability
NODE_CMD=""
if command -v node &> /dev/null; then
  NODE_CMD="node"
elif command -v node.exe &> /dev/null; then
  NODE_CMD="node.exe"
else
  echo "Error: Node.js is required to connect to the database. Please install Node.js."
  exit 1
fi

# 3. Check yt-dlp availability (prioritize python -m yt_dlp like AddSong.sh to use updated module)
YTDL_CMD=""
if python -m yt_dlp --version &> /dev/null; then
  YTDL_CMD="python -m yt_dlp"
elif python3 -m yt_dlp --version &> /dev/null; then
  YTDL_CMD="python3 -m yt_dlp"
elif python.exe -m yt_dlp --version &> /dev/null; then
  YTDL_CMD="python.exe -m yt_dlp"
elif python3.exe -m yt_dlp --version &> /dev/null; then
  YTDL_CMD="python3.exe -m yt_dlp"
elif command -v yt-dlp &> /dev/null; then
  YTDL_CMD="yt-dlp"
elif command -v yt-dlp.exe &> /dev/null; then
  YTDL_CMD="yt-dlp.exe"
else
  echo "Error: yt-dlp is not installed. Please install it with 'pip install yt-dlp'."
  exit 1
fi

# Add JS runtime if node is present to suppress yt-dlp extraction warnings
if $YTDL_CMD --js-runtimes node:node --version &> /dev/null; then
  YTDL_CMD="$YTDL_CMD --js-runtimes node:node"
fi

# 4. Ensure target directory exists
mkdir -p server/music

# 5. Fetch songs from database
echo ""
echo "Connecting to Supabase and pulling song list..."
TEMP_SONGS=$(mktemp 2>/dev/null || echo ".songs_tmp_$$")
trap 'rm -f "$TEMP_SONGS"' EXIT

if ! "$NODE_CMD" scripts/get_all_songs.js > "$TEMP_SONGS"; then
  echo "Error: Failed to fetch songs from database."
  exit 1
fi

TOTAL_SONGS=$(grep -c . "$TEMP_SONGS" 2>/dev/null || true)
if [ -z "$TOTAL_SONGS" ] || [ "$TOTAL_SONGS" -eq 0 ]; then
  echo "No songs found in the database."
  exit 0
fi

echo "Found $TOTAL_SONGS song(s) in the database."
echo ""

# 6. Process songs and download
INDEX=0
DOWNLOADED_COUNT=0
EXISTING_COUNT=0
SKIPPED_COUNT=0
FAILED_COUNT=0

while IFS=$'\t' read -u 3 -r YOUTUBE_ID TITLE ARTIST LANGUAGE DB_ID; do
  # Skip empty lines
  [ -z "$TITLE" ] && [ -z "$YOUTUBE_ID" ] && continue
  
  INDEX=$((INDEX + 1))

  # Check if valid YouTube ID (standard 11 characters)
  if [ -z "$YOUTUBE_ID" ] || [ ${#YOUTUBE_ID} -ne 11 ] || [ "$YOUTUBE_ID" = "NONE" ]; then
    echo "[$INDEX/$TOTAL_SONGS] [SKIP] \"$TITLE\" by ${ARTIST:-Unknown} - Missing or invalid YouTube ID ('$YOUTUBE_ID')"
    SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
    continue
  fi

  TARGET_FILE="server/music/${YOUTUBE_ID}.mp3"

  # Check if audio file already exists
  if [ "$FORCE" = false ]; then
    if [ -s "$TARGET_FILE" ]; then
      echo "[$INDEX/$TOTAL_SONGS] [EXISTS] \"$TITLE\" by $ARTIST (${YOUTUBE_ID}.mp3)"
      EXISTING_COUNT=$((EXISTING_COUNT + 1))
      continue
    fi
  fi

  if [ "$DRY_RUN" = true ]; then
    echo "[$INDEX/$TOTAL_SONGS] [DRY-RUN] Would download: \"$TITLE\" by $ARTIST (${YOUTUBE_ID})"
    DOWNLOADED_COUNT=$((DOWNLOADED_COUNT + 1))
    if [ "$LIMIT" -gt 0 ] && [ "$DOWNLOADED_COUNT" -ge "$LIMIT" ]; then
      echo ""
      echo "Reached limit of $LIMIT song(s)."
      break
    fi
    continue
  fi

  # Download audio
  echo "[$INDEX/$TOTAL_SONGS] [DOWNLOADING] \"$TITLE\" by $ARTIST (${YOUTUBE_ID})..."
  
  if $YTDL_CMD -x --audio-format mp3 --audio-quality 192K --no-playlist -o "server/music/${YOUTUBE_ID}.%(ext)s" "https://www.youtube.com/watch?v=$YOUTUBE_ID" < /dev/null; then
    if [ -s "$TARGET_FILE" ]; then
      echo "  ↳ [SUCCESS] Saved to $TARGET_FILE"
      DOWNLOADED_COUNT=$((DOWNLOADED_COUNT + 1))
    else
      echo "  ↳ [ERROR] yt-dlp succeeded but $TARGET_FILE was not found or is empty."
      FAILED_COUNT=$((FAILED_COUNT + 1))
    fi
  else
    echo "  ↳ [ERROR] Failed to download audio stream for YouTube ID: $YOUTUBE_ID"
    FAILED_COUNT=$((FAILED_COUNT + 1))
  fi

  if [ "$LIMIT" -gt 0 ] && [ "$DOWNLOADED_COUNT" -ge "$LIMIT" ]; then
    echo ""
    echo "Reached download limit of $LIMIT song(s)."
    break
  fi

done 3< "$TEMP_SONGS"

echo ""
echo "=========================================================="
echo "                      Sync Summary                        "
echo "=========================================================="
echo " Total songs in DB:      $TOTAL_SONGS"
echo " Already existed:        $EXISTING_COUNT"
echo " Newly downloaded:       $DOWNLOADED_COUNT"
echo " Skipped (invalid ID):   $SKIPPED_COUNT"
echo " Failed downloads:       $FAILED_COUNT"
echo " Target directory:       server/music/"
echo "=========================================================="
