import Bot from "./Bot";
import Database from "../database/Database";
import TStory from "../database/TStory";
import TLanguage, { LANGUAGES } from "../database/TLanguage";

/**
 * Generate a story and upload it to the database.
 * This function is not part of the main application.
 * This is called by the admin when he wants to generate a new story.
 * 
 * @param language The language of the story
 * @param synopsis Provide a frame for the story
 * @param logToConsole Optional: log the story to the console when finished (default: false)
 */
export default async function GenerateAndUploadStory(language: TLanguage, synopsis: string, logStoryToConsole: boolean = false) {
  if (synopsis.length === 0) throw new Error('Synopsis cannot be empty if provided'); 

  await Bot.GenerateStory(language, synopsis).then(async (story: Omit<TStory, 'id'>) => {
    const story_id = await Database.UploadStory(story);

    if (logStoryToConsole)
      console.log(`Done generating\n\nID: ${story_id}\nTitle: ${story.title}\nStory: ${story.body}`);
    else
      console.log(`Done generating\n\nID: ${story_id}\nTitle: ${story.title}`);
  });
}

/**
 * Will generate the same story in all supported languages and upload them to the database.
 * 
 * @param synopsis Provide a frame for the story 
 * @param logToConsole Optional: log the story to the console when finished (default: false)
 */
export async function GenerateAndUploadStoryInAllLanguages(synopsis: string, logToConsole: boolean = false) {
  const promises = LANGUAGES.map((language) => 
    GenerateAndUploadStory(language, synopsis, logToConsole)
  );
  
  await Promise.all(promises);
  console.log('Done generating story in all languages');
}
