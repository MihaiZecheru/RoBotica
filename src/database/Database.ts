import { ConversationID } from "./ID";
import supabase from "./supabase-config";
import TTranslationAndExamples from "./TTranslationAndExamples";
import TLanguage from "./TLanguage";
import TMessage from "./TMessage";

export default class Database {

  /**
   * Add a message to a conversation in the database.
   * 
   * @param message The message itself; the content.
   * @param conversation_id The ID of the conversation the message is to be added to
   * @param is_bot True if the message is from the bot, false if it is from the user
   */
  public static async AddMessageToConversation(message: string, conversation_id: ConversationID, is_bot: boolean): Promise<TMessage> {
    const { data, error } = await supabase
      .from('Messages')
      .insert([ { conversation_id: conversation_id, message_content: message, is_bot } ])
      .select('*');

    if (error) {
      console.error(error);
      throw error;
    }

    return data[0];
  }

  /**
   * Create a new conversation in the database.
   * 
   * @returns The ID of the newly-created conversation
   */
  public static async CreateConversation(): Promise<ConversationID> {
    const { data, error } = await supabase
      .from('Conversations')
      .insert([{}]) // conversation will create itself with default values
      .select('id');

    if (error) {
      console.error(error);
      throw error;
    }

    return data![0].id;
  }

  /**
   * Get an existing DefintionAndExample from the database, if it exists.
   * @param word 
   * @param language 
   * @returns 
   */
  public static async GetTranslationAndExamples(word: string, language: TLanguage): Promise<TTranslationAndExamples | null> {
    const { data, error } = await supabase
      .from('TranslationAndExamples')
      .select('translation,example_sentence1,example_sentence2,example_sentence1_translation,example_sentence2_translation')
      .eq('word', word)
      .eq('language', language);

    if (error) {
      console.error(error);
      throw error;
    }

    if (data.length === 0) return null;
    return {
      word,
      language,
      translation: data[0].translation,
      example_sentence1: data[0].example_sentence1,
      example_sentence2: data[0].example_sentence2,
      example_sentence1_translation: data[0].example_sentence1_translation,
      example_sentence2_translation: data[0].example_sentence2_translation
    };
  }

  /**
   * Add a translation to the database
   * 
   * @param translation_and_examples The object to add to the database. Represents an entry.
   */
  public static async AddTranslationAndExample(translation_and_examples: TTranslationAndExamples): Promise<void> {
    const { error } = await supabase
      .from('TranslationAndExamples')
      .insert([{
        word: translation_and_examples.word,
        language: translation_and_examples.language,
        translation: translation_and_examples.translation,
        example_sentence1: translation_and_examples.example_sentence1,
        example_sentence2: translation_and_examples.example_sentence2,
        example_sentence1_translation: translation_and_examples.example_sentence1_translation,
        example_sentence2_translation: translation_and_examples.example_sentence2_translation
      }]);

    if (error) {
      console.error(error);
      throw error;
    }
  }
}