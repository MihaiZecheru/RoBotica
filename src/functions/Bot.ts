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
    const response = await openAI.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        "role": "system",
        "content": `Translate the word "${word}" from ${language} to English 
        and give two example sentences using the word in ${language}, 
        then an English translation for each. 
        Be more literal in your translations (ex: 'Buna ziua' is 'good day' not 'hello'). 
        Response format is strictly the following
        (include angle brackets, all punctuation in sentences, no line breaks, x is the value): 
        WordTranslation:<x>Example1:<x>Example1Translation:<x>Example2:<x>Example2Translation:<x>`
      }]
    });

    const message = response.choices[0].message.content!;
    const match = message.match(/WordTranslation:<(.*)>Example1:<(.*)>Example1Translation:<(.*)>Example2:<(.*)>Example2Translation:<(.*)>/); 
    if (!match) throw new Error('Could not interpret response from AI');

    const word_translation = match[1];
    const example_sentence1 = match[2];
    const example_sentence1_translation = match[3];
    const example_sentence2 = match[4];
    const example_sentence2_translation = match[5];

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
}
