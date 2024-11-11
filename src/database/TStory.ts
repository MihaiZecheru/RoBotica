import { StoryID } from "./ID";
import TLanguage from "./TLanguage";

type TStory = {
  id: StoryID;
  language: TLanguage;
  title: string;
  body: string;
}

export default TStory;