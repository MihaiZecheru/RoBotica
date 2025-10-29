import { UserID } from "./ID";
import TLanguage from "./TLanguage";

type TVocabListItem = {
  user_id: UserID;
  word: string;
  language: TLanguage;
  when_added: Date;
};

export default TVocabListItem;