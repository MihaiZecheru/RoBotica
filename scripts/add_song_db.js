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

async function addSongToDatabase(songData) {
  const {
    language,
    title,
    artist,
    year,
    lyrics,
    thumbnail_url,
    image_url,
    youtube_video_id
  } = songData;

  console.log(`\x1b[36mConnecting to Supabase (${supabaseUrl})...\x1b[0m`);

  // Check if song already exists by youtube_video_id or title+artist
  const { data: existingSongs, error: checkError } = await supabase
    .from('Songs')
    .select('id, title, artist, youtube_video_id')
    .or(`youtube_video_id.eq.${youtube_video_id},and(title.eq."${title}",artist.eq."${artist}")`);

  if (checkError) {
    console.error('\x1b[31m[Error] Failed to query existing songs:\x1b[0m', checkError.message);
  }

  if (existingSongs && existingSongs.length > 0) {
    console.log(`\x1b[33mSong already exists in DB (ID: ${existingSongs[0].id}). Updating lyrics & metadata...\x1b[0m`);
    const { error: updateError } = await supabase
      .from('Songs')
      .update({
        language,
        title,
        artist,
        year: year ? parseInt(year, 10) : null,
        lyrics: lyrics || '',
        thumbnail_url: thumbnail_url || `https://i.ytimg.com/vi/${youtube_video_id}/hqdefault.jpg`,
        image_url: image_url || `https://i.ytimg.com/vi/${youtube_video_id}/maxresdefault.jpg`,
        youtube_video_id
      })
      .eq('id', existingSongs[0].id);

    if (updateError) {
      console.error('\x1b[31m[Error] Failed to update song:\x1b[0m', updateError.message);
      process.exit(1);
    }
    console.log(`\x1b[32m[Success] Updated song in DB: "${title}" by ${artist} (${existingSongs[0].id})\x1b[0m`);
    return;
  }

  // Insert new song
  const { data, error } = await supabase
    .from('Songs')
    .insert([{
      language,
      title,
      artist,
      year: year ? parseInt(year, 10) : null,
      lyrics: lyrics || '',
      thumbnail_url: thumbnail_url || `https://i.ytimg.com/vi/${youtube_video_id}/hqdefault.jpg`,
      image_url: image_url || `https://i.ytimg.com/vi/${youtube_video_id}/maxresdefault.jpg`,
      youtube_video_id
    }])
    .select('id');

  if (error) {
    console.error('\x1b[31m[Error] Failed to insert song into Supabase:\x1b[0m', error.message);
    process.exit(1);
  }

  const newId = data && data[0] ? data[0].id : 'inserted';
  console.log(`\x1b[32m[Success] Successfully added song to DB with ID: ${newId}\x1b[0m`);
}

// Parse input from JSON argument or CLI flags
const inputArg = process.argv[2];
if (!inputArg) {
  console.error('Usage: node scripts/add_song_db.js \'<json_string>\'');
  process.exit(1);
}

try {
  const songData = JSON.parse(inputArg);
  addSongToDatabase(songData);
} catch (e) {
  console.error('\x1b[31m[Error] Invalid JSON provided:\x1b[0m', e.message);
  process.exit(1);
}
