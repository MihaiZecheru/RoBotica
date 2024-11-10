import TLanguage from "./TLanguage";

type TTranslationAndExamples = {
  word: string,
  language: TLanguage,
  translation: string,
  example_sentence1: string,
  example_sentence2: string,
  example_sentence1_translation: string,
  example_sentence2_translation: string,
};

export default TTranslationAndExamples;