import { ConversationID, MessageID } from "./ID";
import { TGrammarCheckData } from "./TGrammarAndSpellcheck";

type TMessage = {
  id: MessageID;
  conversation_id: ConversationID;
  message_content: string;
  is_bot: boolean;
  created_at: Date;
  grammar_check?: TGrammarCheckData | null;
};

export default TMessage;