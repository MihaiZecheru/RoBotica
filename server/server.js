const express = require('express');
const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
const { SpeechClient } = require('@google-cloud/speech');
const path = require('path');
const cors = require('cors');
const cheerio = require('cheerio');
const dotenv = require('dotenv');
const { GoogleGenAI } = require('@google/genai');

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const port = process.env.PORT;
const build_name = '../build';

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: geminiApiKey || '' });

// Set the environment variable for the Google Cloud credentials
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, 'google-service-credentials.json');

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Larger payload limit due to audio data
app.use(express.static(path.join(__dirname, build_name)));

const language_codes = {
  "Spanish": "es-US",
  "Romanian": "ro-RO",
  "French": "fr-FR",
  "German": "de-DE",
  "Italian": "it-IT",
  "Portuguese": "pt-PT"
};


/**
 * @param {string} text body.text: the text in `language` to pronounce in the audio
 * @param {string} language body.language: the language of the text
 * @param {boolean} ssml body.ssml: if true, the text is SSML. Defaults to false
 * @returns {Buffer} audio: the audio data of the spoken
 */
app.post('/text-to-speech', async (req, res) => {
  const text = req.body.text;
  const language = req.body.language;
  const ssml = req.body?.ssml || false;

  if (!text) {
    return res.status(400).send('Missing required field in body: text');
  }

  if (!language) {
    return res.status(400).send('Missing required field in body: language');
  }

  if (!Object.keys(language_codes).includes(language)) {
    return res.status(500).send("Invalid language. Case sensitive. Must be one of: " + Object.keys(language_codes).join(", "));
  }

  const client = new TextToSpeechClient();

  const request = {
    input: ssml ? { ssml: text } : { text },
    voice: { languageCode: language_codes[language], ssmlGender: 'MALE' },
    audioConfig: { audioEncoding: 'MP3' },
  };

  try {
    const [response] = await client.synthesizeSpeech(request);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(response.audioContent);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Failed to process request - internal server error');
  }
});

/**
 * @param {string} audio body.audio: the audio data to transcribe as a base64 string
 * @param {string} language body.language: the language of the audio
 * @returns {string} transcription: the transcribed text
 */
app.post('/speech-to-text', async (req, res) => {
  let audio_b64 = req.body.audio_b64;
  const language = req.body.language;

  if (!audio_b64) {
    return res.status(400).send('Missing required field in body: audio_b64');
  }

  if (!language) {
    return res.status(400).send('Missing required field in body: language');
  }

  if (!Object.keys(language_codes).includes(language)) {
    return res.status(500).send("Invalid language. Case sensitive. Must be one of: " + Object.keys(language_codes).join(", "));
  }

  const client = new SpeechClient();

  if (audio_b64.includes("data:audio/wav;base64,")) {
    audio_b64 = audio_b64.substring("data:audio/wav;base64,".length);
  }

  const request = {
    audio: {
      content: audio_b64,
    },
    config: {
      encoding: 'MP3',
      sampleRateHertz: 16000,
      languageCode: language_codes[language],
    },
  };

  try {
    const [response] = await client.recognize(request);
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');
    res.send(transcription);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Failed to process request - internal server error');
  }
});

app.post('/genius-search', (req, res) => {
  const q = req.body.q;

  fetch(`https://api.genius.com/search?q=${q}`, {
    headers: {
      Authorization: `Bearer ${process.env.GENIUS_API_KEY}`
    }
  }).then((response) => response.json()).then((data) => {
    res.send(data);
  });
});

/**
 * Endpoint: /api/bot/chat
 */
app.post('/api/bot/chat', async (req, res) => {
  const { user_message, language, user_skill, user_gender, past_messages } = req.body;

  const systemInstruction = `You are a native human ${language === 'Spanish' ? 'Mexican ' : ''}${language} speaker having a friendly chat with a ${user_skill} user (gender: ${user_gender}) who is learning ${language}.
Your goal is to have a natural, engaging conversation that feels like talking to a real friend/penpal, not a teacher.

Guidelines for a natural and human feel:
1. Tone & Formality:
   - Do NOT be overly formal or academic. Use a relaxed, casual tone.
   - Use standard conversational interjections, fillers, and natural transitions typical of a native speaker (e.g., in Spanish: "pues", "a ver", "oye", "la verdad"; in Romanian: "păi", "măi", "ia zi", "sincer").
   - Limit slang to a maximum of one slang word/phrase per message. Keep it natural.
   - Do not sound like a machine. Show interest, empathy, humor, or curiosity based on the context.
2. Conversation Flow:
   - React directly to the user's message before changing the subject or asking a question. Avoid robotic transitions.
   - Keep the conversation going by asking one open-ended, relevant question or making an engaging comment. Do not ask multiple questions.
   - Keep your responses relatively brief (around 1-3 sentences) so the user is not overwhelmed, especially since they are a ${user_skill}.
3. Language & Complexity:
   - Speak ONLY in ${language}. Never translate or use English.
   - Adjust vocabulary to be appropriate for a ${user_skill} learner:
     * If Beginner: Use simpler grammar structures, clear and common words, but still natural phrasing. Keep sentences short.
     * If Intermediate: Use more diverse vocabulary, standard conversational speed, and slightly more complex (but common) expressions.
   - Swearing is allowed occasionally, as it's part of exposure to real-world language, but keep it mild and context-appropriate.
4. Redundancy:
   - Do not repeat yourself or ask the same questions already asked in the history. Read the conversation history carefully.`;

  const contents = past_messages.map(msg => ({
    role: msg.is_bot ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));
  
  contents.push({
    role: 'user',
    parts: [{ text: user_message }]
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: { systemInstruction }
    });
    res.send(response.text);
  } catch (error) {
    console.error('Error in /api/bot/chat:', error);
    res.status(500).send('Failed to generate response');
  }
});

/**
 * Endpoint: /api/bot/translate-word
 */
app.post('/api/bot/translate-word', async (req, res) => {
  const { word, language } = req.body;
  const prompt = `Translate the word "${word}" from ${language} to English 
${language === 'Spanish' ? 'Use mexican spanish' : ''}

Then give two example sentences using the word "${word}" in ${language}, 
and an English translation for each. 
Be more literal in your translations (ex: 'Bună  ziua' is 'good day' not 'hello'), but not too literal (ex in spanish: 'humor' is 'mood', not 'humor'). 
If the word has multiple meanings, use one meaning for the first sentence, and another meaning for the second sentence.

Response format is strictly the following, you must use the format exactly as is:

WordTranslation:
Example1:
Example1Translation:
Example2:
Example2Translation:

Include punctuation in sentences. Do not wrap in quotes or anything.
Have no line breaks. <x> is the value.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    const message = response.text || '';
    const match = message.match(/WordTranslation:(.*)\sExample1:(.*)\sExample1Translation:(.*)\sExample2:(.*)\sExample2Translation:(.*)/); 
    if (!match) {
      return res.status(500).send('Could not interpret response from AI.');
    }
    res.json({
      word,
      language,
      translation: match[1].trim(),
      example_sentence1: match[2].trim(),
      example_sentence1_translation: match[3].trim(),
      example_sentence2: match[4].trim(),
      example_sentence2_translation: match[5].trim()
    });
  } catch (error) {
    console.error('Error in /api/bot/translate-word:', error);
    res.status(500).send('Failed to generate translation');
  }
});

/**
 * Endpoint: /api/bot/translate-message
 */
app.post('/api/bot/translate-message', async (req, res) => {
  const { message, language } = req.body;
  const prompt = `Translate the message "${message}" from ${language} to English. 
${language === 'Spanish' ? 'Use mexican spanish' : ''} 
Be more literal in your translations (ex: 'Bună ziua' is 'good day' not 'hello').
If necessary, specify in parentheses when slang is used (ex: mention that 'que pedo' is not actually 'what fart' in spanish).
Give just the translation, nothing else. Do not wrap in quotes or anything.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    res.send(response.text);
  } catch (error) {
    console.error('Error in /api/bot/translate-message:', error);
    res.status(500).send('Failed to translate message');
  }
});

/**
 * Endpoint: /api/bot/grammar-check
 */
app.post('/api/bot/grammar-check', async (req, res) => {
  const { message, language } = req.body;
  const prompt = `Given a message in ${language}, check for grammar and spelling mistakes by 
providing a corrected version of the message.
${language === 'Romanian' ? "Be careful with correcting the hyphen. Make sure you use the hyphen properly! Example: it's 'jucătorul tău' not 'jucătorul-tău', and it's 'mi-a zis' not 'mi a zis'" : ''}
Give the corrected message, and only the corrected message. 
Nothing else, no quotations or nothing around the message. Here is the message: ${message}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    res.json({ corrected_message: (response.text || '').trim() });
  } catch (error) {
    console.error('Error in /api/bot/grammar-check:', error);
    res.status(500).send('Failed to check grammar');
  }
});

/**
 * Endpoint: /api/bot/generate-story
 */
app.post('/api/bot/generate-story', async (req, res) => {
  const { language, synopsis } = req.body;
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

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    const message = response.text || '';
    const match = message.match(new RegExp(/(Title|Titlu|Título|Titulo|Titel|Titre|Titolo|):(.*)\s+(Story|Poveste|Historia|Geschichte|Histoire|Storia|História):\s+(.*)/, 's'));
    if (!match) {
      return res.status(500).send('Could not interpret response from AI.');
    }
    res.json({
      title: match[2].trim(),
      body: match[4].trim(),
      language
    });
  } catch (error) {
    console.error('Error in /api/bot/generate-story:', error);
    res.status(500).send('Failed to generate story');
  }
});

/**
 * Endpoint: /api/bot/lyric-translation
 */
app.post('/api/bot/lyric-translation', async (req, res) => {
  const { lyric, language, song } = req.body;
  
  const promptTranslation = `Translate the lyric "${lyric}" from the song ${song.title} by ${song.artist} from ${language} to English.
${language === 'Spanish' ? 'Use mexican spanish' : ''}
Be more literal in your translations (ex: 'Bună ziua' is 'good day' not 'hello').
Give just the translation, nothing else. Do not wrap in quotes or anything.`;

  const promptMeaning = `Generate a short meaning of the lyric "${lyric}" from the song ${song.title} by ${song.artist}, which is in ${language}.
The meaning that you generate must be in English.
Give just the breif meaning/interpretation of the lyric, nothing else. Do not wrap in quotes or anything.`;

  try {
    const [resTranslation, resMeaning] = await Promise.all([
      ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptTranslation
      }),
      ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptMeaning
      })
    ]);
    res.json({
      translation: (resTranslation.text || '').trim(),
      meaning: (resMeaning.text || '').trim()
    });
  } catch (error) {
    console.error('Error in /api/bot/lyric-translation:', error);
    res.status(500).send('Failed to generate lyric translation/meaning');
  }
});

/**
 * Endpoint: /api/bot/translate-english
 */
app.post('/api/bot/translate-english', async (req, res) => {
  const { message, language } = req.body;
  const prompt = `Translate the message "${message}" from English to ${language}.
${language === 'Spanish' ? 'Use mexican spanish' : ''} 
Be more literal in your translations (ex: 'Bună ziua' is 'good day' not 'hello').
Give just the translations separated by commas, nothing else. Do not wrap in quotes or anything.
Provide multiple translations if possible.
Ex: if given "beautiful" and the language is Spanish, respond with something like "bonito, hermos, lindo" etc.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    res.send(response.text);
  } catch (error) {
    console.error('Error in /api/bot/translate-english:', error);
    res.status(500).send('Failed to translate English message');
  }
});

/**
 * Endpoint: /api/bot/evaluate-quiz
 */
app.post('/api/bot/evaluate-quiz', async (req, res) => {
  const { foreignWord, foreignLanguage, userTranslation } = req.body;
  const prompt = `The user is doing a vocab quiz. They were asked to translate words from ${foreignLanguage} to English.
The word was "${foreignWord}" and the user's translation was "${userTranslation}".
Respond with "Correct" if the user was fully correct, "Partial" if the user was somewhat right,
and "Wrong" if the user was fully wrong. If partial or wrong, follow up with 1-2 sentences explaining the correct translation
or the mistake. Be VERY brief; your overall response should be short.
Be forgiving in your grading; don't be pedantic. Give them the point if they give a correct definition.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    const msg = (response.text || '').trim();
    if (msg === "Correct") {
      res.json({ correctness: 'Correct', info: null });
    } else if (msg.startsWith("Partial. ")) {
      res.json({ correctness: 'Partial', info: msg.slice("Partial. ".length) });
    } else if (msg.startsWith("Wrong. ")) {
      res.json({ correctness: 'Wrong', info: msg.slice("Wrong. ".length) });
    } else if (msg.startsWith("Partial")) {
      res.json({ correctness: 'Partial', info: msg.slice("Partial".length).trim() });
    } else if (msg.startsWith("Wrong")) {
      res.json({ correctness: 'Wrong', info: msg.slice("Wrong".length).trim() });
    } else {
      res.json({ correctness: 'Wrong', info: msg });
    }
  } catch (error) {
    console.error('Error in /api/bot/evaluate-quiz:', error);
    res.status(500).send('Failed to evaluate quiz');
  }
});

// Serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, build_name, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening @ http://localhost:${port}`);
});
