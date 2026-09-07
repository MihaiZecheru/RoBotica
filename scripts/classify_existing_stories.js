const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

dotenv.config({ path: path.resolve(__dirname, '../server/.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || 'https://lvelcoaxuksfeijhkqic.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY;

if (!supabaseKey) {
  console.error('[Error] Missing Supabase API Key.');
  process.exit(1);
}
if (!geminiApiKey) {
  console.error('[Error] Missing GEMINI_API_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

async function evaluateCefr(text, language) {
  const prompt = `Analyze the following story text written in ${language} and determine its CEFR language level (Common European Framework of Reference for Languages).
The valid levels are: A1, A2, B1, B2, C1, C2.

Evaluation criteria:
- A1: Very simple sentences, basic everyday vocabulary.
- A2: Simple sentence structures, routine tasks, common expressions.
- B1: Connected text, past/future tenses, expressing opinions, intermediate vocabulary.
- B2: Complex sentences, idiomatic expressions, abstract topics, advanced tenses (subjunctive, conditionals).
- C1: Sophisticated vocabulary, subtle nuances, complex syntax, highly fluent and expressive.
- C2: Near-native, highly literary, intricate sentence architecture and mastery.

Text:
"""
${(text || '').slice(0, 3000)}
"""

Respond with ONLY the 2-character CEFR level code: A1, A2, B1, B2, C1, or C2. Do not write anything else.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    const output = (response.text || '').trim().toUpperCase();
    const match = output.match(/\b(A1|A2|B1|B2|C1|C2)\b/);
    return match ? match[1] : 'B1';
  } catch (err) {
    console.warn(`Evaluation error:`, err.message);
    return 'B1';
  }
}

async function main() {
  console.log('Fetching stories from Supabase...');
  const { data: stories, error } = await supabase
    .from('Stories')
    .select('id, title, language, body, cefr_level');

  if (error) {
    console.error('Error fetching stories:', error.message);
    process.exit(1);
  }

  console.log(`Found ${stories.length} stories in database.`);
  let updatedCount = 0;

  for (const story of stories) {
    if (story.cefr_level) {
      console.log(`[Already Classified] ${story.title} (${story.language}) -> ${story.cefr_level}`);
      continue;
    }

    console.log(`[Evaluating] "${story.title}" (${story.language})...`);
    const level = await evaluateCefr(story.body, story.language);

    const { error: updateError } = await supabase
      .from('Stories')
      .update({ cefr_level: level })
      .eq('id', story.id);

    if (updateError) {
      console.error(`Failed to update ${story.title}:`, updateError.message);
    } else {
      updatedCount++;
      console.log(`[Classified] "${story.title}" -> ${level}`);
    }

    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\nFinished! Evaluated and backfilled ${updatedCount} stories with CEFR levels.`);
}

main().catch(console.error);
