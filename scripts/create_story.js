#!/usr/bin/env node

/**
 * scripts/create_story.js
 * 
 * Handles story generation (via Gemini API) and direct custom story uploads to Supabase.
 * Can be invoked via CLI arguments or JSON input.
 */

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
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY;

const VALID_LANGUAGES = ['Romanian', 'Spanish', 'French', 'German', 'Italian', 'Portuguese'];

if (!supabaseKey) {
  console.error('\x1b[31m[Error] Missing Supabase API Key. Please set SUPABASE_SERVICE_ROLE_KEY or REACT_APP_SUPABASE_ANON_KEY in your .env file.\x1b[0m');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseKey);

async function determineCefrLevel(text, language) {
  if (!geminiApiKey) {
    console.warn('\x1b[33m[Warning] GEMINI_API_KEY missing, skipping CEFR evaluation.\x1b[0m');
    return null;
  }

  const { GoogleGenAI } = require('@google/genai');
  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

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
    if (match) {
      return match[1];
    }
    console.warn('\x1b[33m[Warning] Could not parse CEFR level from response:\x1b[0m', output);
    return null;
  } catch (err) {
    console.warn('\x1b[33m[Warning] Failed to evaluate CEFR level:\x1b[0m', err.message);
    return null;
  }
}

async function uploadStory(language, title, body, cefrLevel = null) {
  const cleanTitle = (title || '').trim();
  const cleanBody = (body || '').trim();

  if (!cleanTitle) {
    throw new Error('Title cannot be empty.');
  }
  if (!cleanBody) {
    throw new Error('Body cannot be empty.');
  }

  if (!cefrLevel) {
    console.log(`\x1b[35m[AI] Evaluating CEFR language level for "${cleanTitle}"...\x1b[0m`);
    cefrLevel = await determineCefrLevel(cleanBody, language);
  }

  const insertData = {
    language,
    title: cleanTitle,
    body: cleanBody
  };
  if (cefrLevel) {
    insertData.cefr_level = cefrLevel;
  }

  const { data, error } = await supabase
    .from('Stories')
    .insert([insertData])
    .select('id');

  if (error) {
    console.error(`\x1b[31m[Error] Failed to insert story into Supabase:\x1b[0m`, error.message);
    throw error;
  }

  const newId = data && data[0] ? data[0].id : 'inserted';
  console.log(`\x1b[32m[Success] Saved story (${language}) to DB with ID: ${newId}\x1b[0m`);
  console.log(`\x1b[36mTitle: "${cleanTitle}" | CEFR Level: ${cefrLevel || 'N/A'}\x1b[0m\n`);
  return newId;
}

async function generateSingleStory(language, synopsis) {
  if (!geminiApiKey) {
    console.error('\x1b[31m[Error] Missing GEMINI_API_KEY. Please set GEMINI_API_KEY in your .env file.\x1b[0m');
    process.exit(1);
  }

  const { GoogleGenAI } = require('@google/genai');
  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  const prompt = `Generate a short story in ${language} with the following synopsis: ${synopsis}. 
Make it interesting and engaging. Make it 5-10 paragraphs long. Title the story, too.
Use modern language; do not use archaic words, phrases, or verb tenses. 
Write less-formally, but not too casually. The story is not meant for kids. It can be sad/dark. 
Do not always have a happy ending. Have a realistic ending.
${language === 'Romanian' ? 'Do not use the word "său". Use "lui" instead. Do not use "deși" either.' : ''}
${language === 'Spanish' ? 'Use mexican spanish' : ''}
Do not wrap the title in quotes or anything. The output should be in the following format:

Title:
Story:

You MUST contain the word 'Title:' and 'Story:' in your response.`;

  console.log(`\x1b[35m[AI] Requesting story in ${language}...\x1b[0m`);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt
  });

  const message = response.text || '';
  const match = message.match(new RegExp(/(Title|Titlu|Título|Titulo|Titel|Titre|Titolo|):(.*)\s+(Story|Poveste|Historia|Geschichte|Histoire|Storia|História):\s+(.*)/, 's'));

  if (!match) {
    const fallbackMatch = message.match(/(?:Title|Titlu|Título|Titulo|Titel|Titre|Titolo|):\s*(.*?)\n+(?:Story|Poveste|Historia|Geschichte|Histoire|Storia|História):\s*([\s\S]+)/i);
    if (fallbackMatch) {
      return {
        title: fallbackMatch[1].trim(),
        body: fallbackMatch[2].trim(),
        language
      };
    }
    throw new Error('Could not interpret response from AI:\n' + message);
  }

  return {
    title: match[2].trim(),
    body: match[4].trim(),
    language
  };
}

async function handleGenerate(language, synopsis) {
  const cleanSynopsis = (synopsis || '').trim();
  if (!cleanSynopsis) {
    console.error('\x1b[31m[Error] Synopsis cannot be empty.\x1b[0m');
    process.exit(1);
  }

  if (language.toLowerCase() === 'all') {
    console.log(`\x1b[36mGenerating stories in all ${VALID_LANGUAGES.length} languages...\x1b[0m\n`);
    const results = [];
    for (const lang of VALID_LANGUAGES) {
      try {
        const story = await generateSingleStory(lang, cleanSynopsis);
        const id = await uploadStory(lang, story.title, story.body);
        results.push({ language: lang, id, title: story.title });
      } catch (err) {
        console.error(`\x1b[31m[Error] Failed generating/uploading story for ${lang}:\x1b[0m`, err.message);
      }
    }
    console.log(`\x1b[32m[Finished] Generated and uploaded ${results.length}/${VALID_LANGUAGES.length} stories.\x1b[0m`);
  } else {
    const normalizedLang = VALID_LANGUAGES.find(l => l.toLowerCase() === language.toLowerCase());
    if (!normalizedLang) {
      console.error(`\x1b[31m[Error] Invalid language: '${language}'. Supported languages: ${VALID_LANGUAGES.join(', ')} or 'All'\x1b[0m`);
      process.exit(1);
    }

    const story = await generateSingleStory(normalizedLang, cleanSynopsis);
    await uploadStory(normalizedLang, story.title, story.body);
  }
}

async function handlePaste(language, title, body) {
  const normalizedLang = VALID_LANGUAGES.find(l => l.toLowerCase() === language.toLowerCase());
  if (!normalizedLang) {
    console.error(`\x1b[31m[Error] Invalid language: '${language}'. Supported languages: ${VALID_LANGUAGES.join(', ')}\x1b[0m`);
    process.exit(1);
  }

  await uploadStory(normalizedLang, title, body);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    mode: '',
    language: '',
    synopsis: '',
    title: '',
    body: '',
    file: ''
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--generate' || arg === 'generate') {
      options.mode = 'generate';
    } else if (arg === '--paste' || arg === 'paste') {
      options.mode = 'paste';
    } else if (arg === '--lang' || arg === '-l') {
      options.language = args[++i];
    } else if (arg === '--synopsis' || arg === '-s') {
      options.synopsis = args[++i];
    } else if (arg === '--title' || arg === '-t') {
      options.title = args[++i];
    } else if (arg === '--body' || arg === '-b') {
      options.body = args[++i];
    } else if (arg === '--file' || arg === '-f') {
      options.file = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
Usage:
  Generate:
    node scripts/create_story.js generate --lang <Language|All> --synopsis "<synopsis>"
    node scripts/create_story.js generate --lang Spanish --file synopsis.txt

  Paste/Upload:
    node scripts/create_story.js paste --lang <Language> --title "<title>" --body "<body>"
    node scripts/create_story.js paste --lang Romanian --title "<title>" --file story.txt

Options:
  --lang, -l       Language (${VALID_LANGUAGES.join(', ')}${', All (generate only)'})
  --synopsis, -s   Synopsis for generating story
  --title, -t      Title of custom story
  --body, -b       Body text of story
  --file, -f       Path to text file containing synopsis or body
  --help, -h       Show help message
`);
}

async function main() {
  const options = parseArgs();

  // If body or synopsis is from file
  if (options.file) {
    if (!fs.existsSync(options.file)) {
      console.error(`\x1b[31m[Error] File not found: ${options.file}\x1b[0m`);
      process.exit(1);
    }
    const content = fs.readFileSync(options.file, 'utf-8');
    if (options.mode === 'generate') {
      options.synopsis = content;
    } else {
      options.body = content;
    }
  }

  // If piped input and no body/synopsis provided
  if (!process.stdin.isTTY && !options.synopsis && !options.body) {
    try {
      const stdinData = fs.readFileSync(0, 'utf-8');
      if (stdinData && stdinData.trim()) {
        // Check if stdin is JSON
        try {
          const parsed = JSON.parse(stdinData.trim());
          if (parsed.mode) options.mode = parsed.mode;
          if (parsed.language) options.language = parsed.language;
          if (parsed.synopsis) options.synopsis = parsed.synopsis;
          if (parsed.title) options.title = parsed.title;
          if (parsed.body) options.body = parsed.body;
        } catch {
          if (options.mode === 'generate') {
            options.synopsis = stdinData;
          } else {
            options.body = stdinData;
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }

  if (!options.mode) {
    console.error('\x1b[31m[Error] Mode is required: specify "generate" or "paste".\x1b[0m');
    printHelp();
    process.exit(1);
  }

  if (options.mode === 'generate') {
    if (!options.language) {
      console.error('\x1b[31m[Error] Language is required for generate mode (--lang <Language|All>).\x1b[0m');
      process.exit(1);
    }
    if (!options.synopsis) {
      console.error('\x1b[31m[Error] Synopsis is required for generate mode (--synopsis "<synopsis>" or --file <path>).\x1b[0m');
      process.exit(1);
    }
    await handleGenerate(options.language, options.synopsis);
  } else if (options.mode === 'paste') {
    if (!options.language) {
      console.error('\x1b[31m[Error] Language is required for paste mode (--lang <Language>).\x1b[0m');
      process.exit(1);
    }
    if (options.language.toLowerCase() === 'all') {
      console.error('\x1b[31m[Error] "All" is only valid for generating stories. Please specify a single language when pasting.\x1b[0m');
      process.exit(1);
    }
    if (!options.title) {
      console.error('\x1b[31m[Error] Title is required for paste mode (--title "<title>").\x1b[0m');
      process.exit(1);
    }
    if (!options.body) {
      console.error('\x1b[31m[Error] Body is required for paste mode (--body "<body>" or --file <path>).\x1b[0m');
      process.exit(1);
    }
    await handlePaste(options.language, options.title, options.body);
  } else {
    console.error(`\x1b[31m[Error] Unknown mode: ${options.mode}\x1b[0m`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('\x1b[31m[Fatal Error]:\x1b[0m', err.message || err);
  process.exit(1);
});
