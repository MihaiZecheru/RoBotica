import OpenAI from "openai";

const openAI = new OpenAI({ apiKey: process.env.REACT_APP_OPENAI_API_KEY!, dangerouslyAllowBrowser: true, organization: process.env.REACT_APP_OPENAI_ORG_ID, project: process.env.REACT_APP_OPENAI_PROJECT_ID });
const HISTORY_SIZE = 15;

/**
 * Generate a bot response to a user's message.
 * 
 * @param user_message The message to respond to.
 * @param language The language to respond in.
 * @returns The AI-generated bot response.
 */
export default async function GetBotResponseToMessage(user_message: string, language: string, user_skill: 'beginner' | 'intermediate', user_gender: 'woman' | 'man', past_messages: Array<{ content: string, is_bot: boolean }>): Promise<string> {
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

  console.log(conversation_history);
  
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