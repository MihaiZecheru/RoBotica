#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
const envPaths = [
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../server/.env'),
  path.resolve(__dirname, '../../.env')
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || 'https://lvelcoaxuksfeijhkqic.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('\x1b[31m[Error] Missing Supabase API Key. Please set SUPABASE_SERVICE_ROLE_KEY or REACT_APP_SUPABASE_ANON_KEY in your .env file.\x1b[0m');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const idsOnly = args.includes('--ids-only');

  const { data: songs, error } = await supabase
    .from('Songs')
    .select('id, title, artist, youtube_video_id, language')
    .order('title', { ascending: true });

  if (error) {
    console.error('\x1b[31m[Error] Failed to fetch songs from Supabase:\x1b[0m', error.message);
    process.exit(1);
  }

  if (!songs || songs.length === 0) {
    if (jsonOutput) {
      console.log('[]');
    }
    return;
  }

  if (jsonOutput) {
    console.log(JSON.stringify(songs, null, 2));
    return;
  }

  if (idsOnly) {
    for (const song of songs) {
      const ytId = (song.youtube_video_id || '').trim();
      if (ytId) {
        console.log(ytId);
      }
    }
    return;
  }

  // TSV output: youtube_video_id \t title \t artist \t language \t id
  // Use 'NONE' placeholder if youtube_video_id is empty so field alignment is guaranteed
  for (const song of songs) {
    const ytId = (song.youtube_video_id || '').trim() || 'NONE';
    const title = (song.title || 'Unknown').replace(/[\t\r\n]+/g, ' ').trim() || 'Unknown';
    const artist = (song.artist || 'Unknown').replace(/[\t\r\n]+/g, ' ').trim() || 'Unknown';
    const language = (song.language || 'Unknown').replace(/[\t\r\n]+/g, ' ').trim() || 'Unknown';
    const id = (song.id || 'Unknown').trim();

    console.log(`${ytId}\t${title}\t${artist}\t${language}\t${id}`);
  }
}

main().catch(err => {
  console.error('\x1b[31m[Error]:\x1b[0m', err);
  process.exit(1);
});
