import { ConversationID } from "./ID";
import supabase from "./supabase-config";
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
}