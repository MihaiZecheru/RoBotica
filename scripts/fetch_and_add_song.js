#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const https = require('https');
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

const language = process.argv[2] || 'Spanish';
const title = process.argv[3] || '';
const artist = process.argv[4] || '';
const year = process.argv[5] ? parseInt(process.argv[5], 10) : null;
const youtube_video_id = process.argv[6] || '';

if (!title || !artist || !youtube_video_id) {
  console.error('\x1b[31m[Error] Usage: node scripts/fetch_and_add_song.js <language> <title> <artist> <year> <youtube_video_id>\x1b[0m');
  process.exit(1);
}

function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'RoBotica/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function getLyrics(track, art) {
  console.log(`\x1b[36mFetching lyrics from LRCLIB for "${track}" by "${art}"...\x1b[0m`);
  // 1. Exact match
  const exact = await fetchJson(`https://lrclib.net/api/get?track_name=${encodeURIComponent(track)}&artist_name=${encodeURIComponent(art)}`);
  if (exact && exact.syncedLyrics) {
    console.log('\x1b[32mFound time-synced lyrics (LRC format) on LRCLIB!\x1b[0m');
    return { type: 'synced', lyrics: exact.syncedLyrics.replace(/\r/g, '') };
  }
  if (exact && exact.plainLyrics) {
    console.log('\x1b[33mFound plain lyrics on LRCLIB (exact match).\x1b[0m');
    return { type: 'plain', lyrics: exact.plainLyrics.replace(/\r/g, '') };
  }

  // 2. Fuzzy search
  const search = await fetchJson(`https://lrclib.net/api/search?q=${encodeURIComponent(track + ' ' + art)}`);
  if (Array.isArray(search) && search.length > 0) {
    const syncedMatch = search.find(s => s.syncedLyrics);
    if (syncedMatch) {
      console.log('\x1b[32mFound time-synced lyrics (LRC format) via search!\x1b[0m');
      return { type: 'synced', lyrics: syncedMatch.syncedLyrics.replace(/\r/g, '') };
    }
    const plainMatch = search.find(s => s.plainLyrics);
    if (plainMatch) {
      console.log('\x1b[33mFound plain lyrics via search.\x1b[0m');
      return { type: 'plain', lyrics: plainMatch.plainLyrics.replace(/\r/g, '') };
    }
  }

  console.log('\x1b[90mNo lyrics found automatically on LRCLIB.\x1b[0m');
  return { type: 'none', lyrics: '' };
}

const readline = require('readline');

async function promptUserForLyrics() {
  console.log('\n\x1b[33m[No Lyrics Found on LRCLIB]\x1b[0m');
  console.log('How would you like to provide lyrics for this song?');
  console.log('1) Paste lyrics directly (type "EOF" on an empty line or press Ctrl+D when finished)');
  console.log('2) Specify a text file path');
  console.log('3) Skip (save without lyrics)');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (q) => new Promise(resolve => rl.question(q, resolve));

  const choice = (await question('Enter choice [1-3, default: 1]: ')).trim() || '1';

  if (choice === '2') {
    const filePath = (await question('Enter path to lyrics file: ')).trim();
    rl.close();
    if (filePath && fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    } else {
      console.log('File not found or invalid. Proceeding without lyrics.');
      return '';
    }
  } else if (choice === '3') {
    rl.close();
    return '';
  }

  // Option 1: Paste directly
  console.log('\nPaste your lyrics below. Type "EOF" on an empty line to finish:');
  const lines = [];
  return new Promise(resolve => {
    rl.on('line', (line) => {
      if (line.trim() === 'EOF') {
        rl.close();
        resolve(lines.join('\n'));
      } else {
        lines.push(line);
      }
    });
    rl.on('close', () => {
      resolve(lines.join('\n'));
    });
  });
}

async function main() {
  const { type: lyricsType, lyrics } = await getLyrics(title, artist);
  let finalLyrics = lyrics;

  if (!finalLyrics || !finalLyrics.trim()) {
    finalLyrics = await promptUserForLyrics();
  }

  const cleanLyrics = finalLyrics ? finalLyrics.replace(/\r/g, '').trim() : '';
  const has_synced_lyrics = /\[\d{2}:\d{2}\.\d{2,3}\]/.test(cleanLyrics);

  if (has_synced_lyrics) {
    console.log('\x1b[32m[Lyrics] Synchronized LRC timestamps detected (has_synced_lyrics = true).\x1b[0m');
  } else if (cleanLyrics) {
    console.log('\x1b[33m[Lyrics] Plain lyrics detected (has_synced_lyrics = false).\x1b[0m');
  } else {
    console.log('\x1b[90m[Lyrics] No lyrics provided (has_synced_lyrics = false).\x1b[0m');
  }

  if (!supabaseKey) {
    console.error('\x1b[31m[Error] Missing Supabase API Key. Please set SUPABASE_SERVICE_ROLE_KEY or REACT_APP_SUPABASE_ANON_KEY in your .env file.\x1b[0m');
    console.log(`Audio file is ready, but database registration was skipped due to missing API key.`);
    process.exit(1);
  }

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log(`\x1b[36mConnecting to Supabase (${supabaseUrl})...\x1b[0m`);

  const thumbnail_url = `https://i.ytimg.com/vi/${youtube_video_id}/hqdefault.jpg`;
  const image_url = `https://i.ytimg.com/vi/${youtube_video_id}/maxresdefault.jpg`;

  // Check if song exists
  const { data: existingSongs, error: checkError } = await supabase
    .from('Songs')
    .select('id, title, artist, youtube_video_id')
    .or(`youtube_video_id.eq.${youtube_video_id},and(title.eq."${title}",artist.eq."${artist}")`);

  if (checkError) {
    console.warn('[Warning] Check song query:', checkError.message);
  }

  if (existingSongs && existingSongs.length > 0) {
    console.log(`\x1b[33mSong already exists in DB (ID: ${existingSongs[0].id}). Updating lyrics & metadata...\x1b[0m`);
    const { error: updateError } = await supabase
      .from('Songs')
      .update({
        language,
        title,
        artist,
        year,
        lyrics: cleanLyrics,
        thumbnail_url,
        image_url,
        youtube_video_id,
        has_synced_lyrics
      })
      .eq('id', existingSongs[0].id);

    if (updateError) {
      console.error('\x1b[31m[Error] Failed to update song in Supabase:\x1b[0m', updateError.message);
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
      year,
      lyrics: cleanLyrics,
      thumbnail_url,
      image_url,
      youtube_video_id,
      has_synced_lyrics
    }])
    .select('id');

  if (error) {
    console.error('\x1b[31m[Error] Failed to insert song into Supabase:\x1b[0m', error.message);
    process.exit(1);
  }

  const newId = data && data[0] ? data[0].id : 'inserted';
  console.log(`\x1b[32m[Success] Successfully added song to DB with ID: ${newId}\x1b[0m`);
}

main().catch(err => {
  console.error('\x1b[31m[Error]:\x1b[0m', err);
  process.exit(1);
});
