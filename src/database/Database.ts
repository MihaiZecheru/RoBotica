import { ConversationID, StoryID, UserID } from "./ID";
import supabase from "./supabase-config";
import TTranslationAndExamples from "./TTranslationAndExamples";
import TLanguage from "./TLanguage";
import TMessage from "./TMessage";
import TStory from "./TStory";
import { TUserSettings } from "./GetUser";

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

  /**
   * Get all conversations and their messages
   * 
   * @param user_id The ID of the user
   * @returns The user's conversations, including messages
   */
  public static async GetAllUserConversations(user_id: UserID): Promise<Array<{
    id: ConversationID,
    last_bot_msg: string,
    last_user_msg: string,
    all_messages: Array<{
      content: string;
      is_bot: boolean;
    }>
  }> | null> {
    const { data, error } = await supabase
      .from('Conversations')
      .select(`
        id,
        user_id,
        created_at,
        Messages(id, message_content, is_bot, created_at)
      `)
      .eq('user_id', user_id)
      .order('created_at', { ascending: false }); // newest first

    if (error) {
      console.error("Error fetching messages:", error.message);
      return null;
    }

    if (!data) return null;

    return data.map((conversation: any) => {
      const msgs = conversation.Messages.sort((a: any, b: any) => {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); // oldest to newest
      });

      return {
        id: conversation.id as ConversationID,
        last_bot_msg: msgs[msgs.length - 1].message_content,
        last_user_msg: msgs[msgs.length - 2].message_content,
        all_messages: msgs.map((msg: any) => {
          return {
            content: msg.message_content,
            is_bot: msg.is_bot
          };
        })
      }
    });
  }

  /**
   * Get all stories from the database that are written in `language`
   * @returns 
   */
  public static async GetAllStories(language: TLanguage): Promise<TStory[]> {
    const { data, error } = await supabase
      .from('Stories')
      .select('*')
      .eq('language', language);

    if (error) {
      console.error(error);
      throw error;
    }

    return data.map((story: any) => {
      return {
        id: story.id as StoryID,
        language: story.language as TLanguage,
        title: story.title,
        body: story.body
      };
    });
  }

  /**
   * Insert a story into the Stories table in the database
   * 
   * @param story The story to add to the Stories table in the database
   * @returns The ID of the newly-inserted story
   */
  public static async UploadStory(story: Omit<TStory, 'id'>): Promise<StoryID> {
    const { data, error } = await supabase
      .from('Stories')
      .insert([{
        language: story.language,
        title: story.title,
        body: story.body
      }])
      .select('id');

    if (error) {
      console.error(error);
      throw error;
    }

    return data[0].id as StoryID;
  }

  public static async UpdateUserSettings(user_settings: TUserSettings, user_id: UserID): Promise<void> {
    const { error } = await supabase
      .from('UserSettings')
      .update({
        level: user_settings.level,
        gender: user_settings.gender,
        language: user_settings.language
      })
      .eq('user_id', user_id);

    if (error) {
      console.error(error);
      throw error;
    }
  }
}