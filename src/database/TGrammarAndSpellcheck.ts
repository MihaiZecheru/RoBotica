import { MessageID } from "./ID";

export type TGrammarCheckData = {
  mistake_count: number;
  modal_message: string | null;
};

export type TGrammarAndSpellcheck = {
  id?: string;
  message_id: MessageID;
  mistake_count: number;
  modal_message: string | null;
};

export default TGrammarAndSpellcheck;
