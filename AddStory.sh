#!/usr/bin/env bash

# CreateStory.sh - Generate a story with AI or paste/upload a custom story to RoBotica

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check Node.js
NODE_CMD=""
if command -v node &> /dev/null; then
  NODE_CMD="node"
elif command -v node.exe &> /dev/null; then
  NODE_CMD="node.exe"
else
  echo "Error: Node.js is required. Please install Node.js."
  exit 1
fi

echo "=========================================================="
echo "          RoBotica - Create & Upload Story                "
echo "=========================================================="

MODE=""
LANGUAGE=""
SYNOPSIS=""
TITLE=""
BODY=""
FILE=""

# Parse flags
while [[ $# -gt 0 ]]; do
  case "$1" in
    --generate|-g)
      MODE="generate"
      shift
      ;;
    --paste|-p)
      MODE="paste"
      shift
      ;;
    --lang|-l)
      LANGUAGE="$2"
      shift 2
      ;;
    --synopsis|-s)
      SYNOPSIS="$2"
      shift 2
      ;;
    --title|-t)
      TITLE="$2"
      shift 2
      ;;
    --body|-b)
      BODY="$2"
      shift 2
      ;;
    --file|-f)
      FILE="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: ./CreateStory.sh [options]"
      echo ""
      echo "Modes:"
      echo "  --generate, -g       Generate a story with AI"
      echo "  --paste, -p          Paste or upload a custom story"
      echo ""
      echo "Options:"
      echo "  --lang, -l <lang>    Language (Romanian, Spanish, French, German, Italian, Portuguese, All)"
      echo "  --synopsis, -s <txt> Synopsis for story generation"
      echo "  --title, -t <title>  Story title (paste mode)"
      echo "  --body, -b <text>    Story body text (paste mode)"
      echo "  --file, -f <path>    Path to text file with synopsis or story body"
      echo "  -h, --help           Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use -h or --help for options."
      exit 1
      ;;
  esac
done

# 1. Select Mode if not passed
if [ -z "$MODE" ]; then
  echo ""
  echo "Choose an action:"
  echo "1) Generate a story (AI)"
  echo "2) Paste / upload own story"
  read -p "Enter choice [1-2, default: 1]: " MODE_CHOICE
  case "$MODE_CHOICE" in
    2) MODE="paste" ;;
    *) MODE="generate" ;;
  esac
fi

# 2. Select Language if not passed
if [ -z "$LANGUAGE" ]; then
  echo ""
  echo "Select language for this story:"
  echo "1) Romanian"
  echo "2) Spanish"
  echo "3) French"
  echo "4) Italian"
  echo "5) Portuguese"
  echo "6) German"
  if [ "$MODE" = "generate" ]; then
    echo "7) All (Generate in all 6 languages)"
  fi

  read -p "Enter number or language name: " LANG_CHOICE
  case "$LANG_CHOICE" in
    1) LANGUAGE="Romanian" ;;
    2) LANGUAGE="Spanish" ;;
    3) LANGUAGE="French" ;;
    4) LANGUAGE="Italian" ;;
    5) LANGUAGE="Portuguese" ;;
    6) LANGUAGE="German" ;;
    7) 
      if [ "$MODE" = "generate" ]; then
        LANGUAGE="All"
      else
        echo "Invalid choice. Defaulting to Spanish."
        LANGUAGE="Spanish"
      fi
      ;;
    "Romanian"|"Spanish"|"French"|"Italian"|"Portuguese"|"German") ;;
    "All"|"all")
      if [ "$MODE" = "generate" ]; then
        LANGUAGE="All"
      else
        echo "'All' is only valid when generating stories. Defaulting to Spanish."
        LANGUAGE="Spanish"
      fi
      ;;
    *)
      if [ "$MODE" = "generate" ]; then
        LANGUAGE="All"
      else
        LANGUAGE="Spanish"
      fi
      ;;
  esac
fi

echo "Mode:     $MODE"
echo "Language: $LANGUAGE"

# 3. Handle Mode-specific inputs
if [ "$MODE" = "generate" ]; then
  if [ -n "$FILE" ]; then
    if [ ! -f "$FILE" ]; then
      echo "Error: File '$FILE' does not exist."
      exit 1
    fi
  elif [ -z "$SYNOPSIS" ]; then
    echo ""
    echo "Enter the story synopsis (frame/plot):"
    read -p "> " SYNOPSIS
    if [ -z "$SYNOPSIS" ]; then
      echo "Error: Synopsis cannot be empty."
      exit 1
    fi
  fi

  echo ""
  if [ -n "$FILE" ]; then
    "$NODE_CMD" scripts/create_story.js generate --lang "$LANGUAGE" --file "$FILE"
  else
    "$NODE_CMD" scripts/create_story.js generate --lang "$LANGUAGE" --synopsis "$SYNOPSIS"
  fi

elif [ "$MODE" = "paste" ]; then
  if [ -z "$TITLE" ]; then
    echo ""
    read -p "Enter Story Title: " TITLE
    if [ -z "$TITLE" ]; then
      echo "Error: Title cannot be empty."
      exit 1
    fi
  fi

  if [ -n "$FILE" ]; then
    if [ ! -f "$FILE" ]; then
      echo "Error: File '$FILE' does not exist."
      exit 1
    fi
  elif [ -z "$BODY" ]; then
    echo ""
    echo "How would you like to input the story body?"
    echo "1) Paste/Type directly (end with typing 'EOF' on an empty line or Ctrl+D)"
    echo "2) Load from a text file"
    read -p "Enter choice [1/2, default: 1]: " INPUT_METHOD

    if [ "$INPUT_METHOD" = "2" ]; then
      read -p "Enter path to text file: " FILE
      if [ ! -f "$FILE" ]; then
        echo "Error: File '$FILE' does not exist."
        exit 1
      fi
    else
      echo ""
      echo "Paste your story below. Type 'EOF' on a new line (or press Ctrl+D) when finished:"
      BODY=""
      while IFS= read -r line; do
        if [ "$line" = "EOF" ]; then
          break
        fi
        BODY+="$line"$'\n'
      done
      
      if [ -z "$(echo "$BODY" | tr -d '[:space:]')" ]; then
        echo "Error: Body cannot be empty."
        exit 1
      fi
    fi
  fi

  echo ""
  if [ -n "$FILE" ]; then
    "$NODE_CMD" scripts/create_story.js paste --lang "$LANGUAGE" --title "$TITLE" --file "$FILE"
  else
    "$NODE_CMD" scripts/create_story.js paste --lang "$LANGUAGE" --title "$TITLE" --body "$BODY"
  fi
fi

echo "=========================================================="
echo " [Done] Story processing complete!"
echo "=========================================================="
