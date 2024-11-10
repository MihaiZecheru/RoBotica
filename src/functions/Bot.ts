import OpenAI from "openai";
import TLanguage from "../database/TLanguage";
import TTranslationAndExamples from "../database/TTranslationAndExamples";

const openAI = new OpenAI({ apiKey: process.env.REACT_APP_OPENAI_API_KEY!, dangerouslyAllowBrowser: true, organization: process.env.REACT_APP_OPENAI_ORG_ID, project: process.env.REACT_APP_OPENAI_PROJECT_ID });
const HISTORY_SIZE = 15;

export default class Bot {
  /**
   * Generate a bot response to a user's message in a conversation.
   * 
   * @param user_message The message to respond to.
   * @param language The language to respond in.
   * @param user_skill The skill level of the user, either 'beginner' or 'intermediate'.
   * @param user_gender Whether the user is a man or a woman. Used for latin languages where gender matters.
   * @param past_messages The conversation history, exluding the message to respond to.
   * @returns The AI-generated bot response.
   */
  public static async GetBotResponseToMessage(user_message: string, language: string, user_skill: 'beginner' | 'intermediate', user_gender: 'woman' | 'man', past_messages: Array<{ content: string, is_bot: boolean }>): Promise<string> {
    if (past_messages.length > HISTORY_SIZE) {
      past_messages = past_messages.slice(past_messages.length - HISTORY_SIZE);
    }

    const conversation_history: string = past_messages.reduce((acc: string, msg: { content: string, is_bot: boolean }) => {
      if (msg.is_bot) {
        return acc + `You said: ${msg.content}\n`;
      } else {
        return acc + `The user said: ${msg.content}\n`;
      }
    }, '');

    const response = await openAI.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        "role": "system",
        "content": `You are a native human ${language} speaker talking to a ${user_skill} ${user_gender}. Do not be formal. Be chill and very breif, only speak in ${language}. Swearing is encouraged.
        Here is the conversation history: ${conversation_history}
        Respond to the user's last message given the context: ${user_message}`
      }]
    });

    return response.choices[0].message.content!;
  }

  /**
   * Generate a translation and two example sentences for a word in a given language.
   * 
   * @param word The word to translate and generate two example sentences for. 
   * @param language The language the word is in. Will be translated to English.
   * @returns The translation and two example sentences. TTranslationAndExamples
   */
  public static async GenerateTranslationAndExamplesForWord(word: string, language: TLanguage): Promise<TTranslationAndExamples> {
    console.log(word);
    const response = await openAI.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        "role": "system",
        "content": `Translate the word "${word}" from ${language} to English 

        Then give two example sentences using the word "${word}" in ${language}, 
        and an English translation for each. 
        Be more literal in your translations (ex: 'Bună  ziua' is 'good day' not 'hello'). 
        
        Response format is strictly the following, you must use the format exactly as is:
        
        WordTranslation:
        Example1:
        Example1Translation:
        Example2:
        Example2Translation:
        
        Include punctuation in sentences. Do not wrap in quotes or anything.
        Have no line breaks. <x> is the value.`
      }]
    });

    const message = response.choices[0].message.content!;
    const match = message.match(/WordTranslation:(.*)\sExample1:(.*)\sExample1Translation:(.*)\sExample2:(.*)\sExample2Translation:(.*)/); 
    if (!match) throw new Error('Could not interpret response from AI. Try again.');

    const word_translation = match[1].trim();
    const example_sentence1 = match[2].trim();
    const example_sentence1_translation = match[3].trim();
    const example_sentence2 = match[4].trim();
    const example_sentence2_translation = match[5].trim();

    return {
      word,
      language,
      translation: word_translation,
      example_sentence1,
      example_sentence1_translation,
      example_sentence2,
      example_sentence2_translation
    };
  }

  /**
   * Generate an English translation for a message in a given language.
   * 
   * @param message The message in `language` to translate to Englush.
   * @param language The language the message is in. 
   * @returns The English translation of the message.
   */
  public static async GenerateMessageTranslation(message: string, language: TLanguage): Promise<string> {
    const response = await openAI.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        "role": "system",
        "content": `Translate the message "${message}" from ${language} to English. 
        Be more literal in your translations (ex: 'Bună ziua' is 'good day' not 'hello'). 
        Give just the translation, nothing else. Do not wrap in quotes or anything.`
      }]
    });

    return response.choices[0].message.content!;
  }

  /**
   * Perform a grammar and spelling check on a message in a given language,
   * returning the amount of mistakes and the corrected message.
   * 
   * @param message The message to check for grammar and spelling mistakes.
   * @param language The language the message is in.
   * @returns The amount of mistakes contained in the message and the corrected message.
   */
  public static async PerformGrammarAndSpellingCheck(message: string, language: TLanguage): Promise<{ mistake_count: number, result: string }> {
    const response = await openAI.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        "role": "system",
        "content": `Given a message in ${language}, check for grammar and spelling mistakes by 
        providing a corrected version of the message. Grammar mistakes do not include punctuation 
        or capitalization, but include hyphen. Give the corrected message, and only the corrected message. 
        Nothing else, no quotations or nothing around the message. Here is the message: ${message}`
      }]
    });

    const corrected_message = response.choices[0].message.content!;
    const mistake_count = this.GetMistakeCount(message, corrected_message);
    return { mistake_count, result: corrected_message };
  }

  /**
   * Get the amount of mistakes between the original string had, given the corrected string from the AI.
   * 
   * @param original The original string.
   * @param corrected The corrected string (generated by gpt AI).
   * @returns The amount of mistakes the original string had.
   */
  private static GetMistakeCount(original: string, corrected: string): number {
    // I have no idea how this ChatGPT algorithm works, but it does work.
    // It uses 'edit distance' to make sure the strings are being compared properly,
    // in case the corrected version is missing a word or has an extra word.

    // Does not strip the hyphen (-) because it is used in compound words.
    const strip_punctuation = (str: string) => str.replace(/[.,/#!$%^&*;:{}=_`~()]/g, '');
    const strip_diactritics = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Split both strings into word arrays
    const originalWords = original.split(' ');
    const correctedWords = corrected.split(' ');

    // Initialize the DP table
    const dp: number[][] = Array.from({ length: originalWords.length + 1 }, () =>
        Array(correctedWords.length + 1).fill(0)
    );

    // Base cases for transformations
    for (let i = 0; i <= originalWords.length; i++) dp[i][0] = i; // cost of deletions
    for (let j = 0; j <= correctedWords.length; j++) dp[0][j] = j; // cost of insertions

    // Fill the DP table with the minimum edit distance values
    for (let i = 1; i <= originalWords.length; i++) {
        for (let j = 1; j <= correctedWords.length; j++) {
            // Strip punctuation and diacritics, and compare words
            const originalWord = strip_punctuation(strip_diactritics(originalWords[i - 1].toLowerCase()));
            const correctedWord = strip_punctuation(strip_diactritics(correctedWords[j - 1].toLowerCase()));

            const cost = originalWord === correctedWord ? 0 : 1;

            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,    // Deletion
                dp[i][j - 1] + 1,    // Insertion
                dp[i - 1][j - 1] + cost // Substitution
            );
        }
    }

    // Return the edit distance between the two strings
    return dp[originalWords.length][correctedWords.length];
}

}
