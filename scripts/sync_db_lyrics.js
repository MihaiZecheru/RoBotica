const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../server/.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || 'https://lvelcoaxuksfeijhkqic.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Fetching songs from Supabase...');
  const { data: songs, error } = await supabase.from('Songs').select('id, title, artist, lyrics, has_synced_lyrics');
  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log(`Checking and syncing ${songs.length} songs...`);
  let updatedCount = 0;

  for (const song of songs) {
    const hasLrc = /\[\d{2}:\d{2}\.\d{2,3}\]/.test(song.lyrics || '');

    if (hasLrc) {
      if (song.has_synced_lyrics !== true) {
        await supabase
          .from('Songs')
          .update({ has_synced_lyrics: true })
          .eq('id', song.id);
        console.log(`[Set has_synced_lyrics = true] ${song.title}`);
        updatedCount++;
      } else {
        console.log(`[Already Synced] ${song.title}`);
      }
      continue;
    }

    const cleanTitle = song.title.replace(/\(.*\)|\[.*\]/g, '').trim();
    const cleanArtist = song.artist.split(',')[0].trim();

    try {
      let resp = await fetch(`https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`, {
        headers: { 'User-Agent': 'RoBotica/1.0' }
      });

      let data = resp.ok ? await resp.json() : null;

      if (!data || !data.syncedLyrics) {
        // Try search
        const searchResp = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(cleanTitle + ' ' + cleanArtist)}`, {
          headers: { 'User-Agent': 'RoBotica/1.0' }
        });
        if (searchResp.ok) {
          const results = await searchResp.json();
          if (Array.isArray(results) && results.length > 0) {
            const match = results.find(r => r.syncedLyrics);
            if (match) data = match;
          }
        }
      }

      if (data && data.syncedLyrics) {
        const cleanLyrics = data.syncedLyrics.replace(/\r/g, '');
        const { error: updateError } = await supabase
          .from('Songs')
          .update({
            lyrics: cleanLyrics,
            has_synced_lyrics: true
          })
          .eq('id', song.id);

        if (updateError) {
          console.error(`Failed to update ${song.title}:`, updateError.message);
        } else {
          updatedCount++;
          console.log(`[Synced & Updated] ${song.title} (${updatedCount})`);
        }
      } else {
        await supabase
          .from('Songs')
          .update({ has_synced_lyrics: false })
          .eq('id', song.id);
        console.log(`[No Synced Lyrics] ${song.title} (has_synced_lyrics = false)`);
      }
    } catch (err) {
      console.warn(`Error checking ${song.title}:`, err.message);
    }

    // Small delay to be polite to LRCLIB
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\nFinished! Successfully processed ${songs.length} songs.`);
}

main().catch(console.error);

