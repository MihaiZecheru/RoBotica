const express = require('express');
const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
const path = require('path');
const cors = require('cors');

// Set the environment variable for the Google Cloud credentials
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, 'google-service-credentials.json');

const app = express();
app.use(express.json());
app.use(cors());

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
    // LINEAR16 is higher quality, MP3 is smaller. MP3 is good enough; the audio is pretty clear.
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

const port = 4000;
app.listen(port, () => {
  console.log(`Server listening @ http://localhost:${port}`);
});
