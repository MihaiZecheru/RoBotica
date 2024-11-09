import { ConversationID, MessageID } from "./ID";

type TMessage = {
  id: MessageID;
  conversation_id: ConversationID;
  message_content: string;
  is_bot: boolean;
  created_at: Date;
};

export default TMessage;