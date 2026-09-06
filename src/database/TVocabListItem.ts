import { UserID } from "./ID";
import TLanguage from "./TLanguage";

type TVocabListItem = {
  user_id: UserID;
  word: string;
  language: TLanguage;
  when_added: Date;
  correct_count: number;
  incorrect_count: number;
  is_archived: boolean;
};

export default TVocabListItem;