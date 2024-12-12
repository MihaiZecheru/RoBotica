import TLanguage from "../database/TLanguage";

/**
 * 
 * @param text The text to convert to speech
 * @param language The language of the text (and therefore the speech)
 * @param ssml True if the text is SSML, false otherwise. SSML is the markup language for the speech API. Used for adding pauses with <break time="1s" />.
 */
export default async function TextToSpeechAPI(text: string, language: TLanguage, ssml: boolean): Promise<Blob> {
  // TODO: check that the URL works after setting up in production
  const response = await fetch("http://localhost:4000/text-to-speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, language, ssml }),
  })

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return await response.blob();
}