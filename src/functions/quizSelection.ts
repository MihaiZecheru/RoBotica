import TVocabListItem from "../database/TVocabListItem";

export type TQuizQuestionType = 'typed_translation' | 'multiple_choice';

export type TQuizQuestion = {
  type: TQuizQuestionType;
  item: TVocabListItem;
  word: string;
  englishPrompt?: string; // For multiple choice: the English word prompt
  options?: string[];     // For multiple choice: 4 foreign language options
  correctOption?: string; // For multiple choice: the correct foreign language option
};

/**
 * Calculates a priority weight for Anki-style spaced repetition.
 * Words missed often or with low correct counts receive higher weight.
 */
export function calculateAnkiWeight(item: TVocabListItem): number {
  const incorrect = item.incorrect_count || 0;
  const correct = item.correct_count || 0;
  return (1 + incorrect * 2) / (1 + correct);
}

/**
 * Selects up to `amount` items from `items` using weighted random sampling without replacement.
 */
export function getWeightedQuizItems(items: TVocabListItem[], amount: number): TVocabListItem[] {
  if (items.length <= amount) {
    // Shuffle and return all if fewer than or equal to amount
    return [...items].sort(() => Math.random() - 0.5);
  }

  const pool = [...items];
  const selected: TVocabListItem[] = [];

  for (let i = 0; i < amount && pool.length > 0; i++) {
    const totalWeight = pool.reduce((sum, item) => sum + calculateAnkiWeight(item), 0);
    let randomThreshold = Math.random() * totalWeight;

    let chosenIndex = 0;
    for (let j = 0; j < pool.length; j++) {
      randomThreshold -= calculateAnkiWeight(pool[j]);
      if (randomThreshold <= 0) {
        chosenIndex = j;
        break;
      }
    }

    selected.push(pool[chosenIndex]);
    pool.splice(chosenIndex, 1);
  }

  return selected;
}

/**
 * Builds a 5/5 (or roughly 50/50) split of typed translation vs multiple choice questions.
 * Distractors for multiple choice are drawn from the overall vocabulary list.
 */
export function buildQuizQuestions(
  mcItems: TVocabListItem[],
  typedItems: TVocabListItem[],
  allAvailableItems: TVocabListItem[],
  translationsMap: Record<string, string>
): TQuizQuestion[] {
  const typedQuestions: TQuizQuestion[] = [];
  const mcQuestions: TQuizQuestion[] = [];

  // Generate typed translation questions (Target Language -> English)
  for (const item of typedItems) {
    typedQuestions.push({
      type: 'typed_translation',
      item,
      word: item.word,
    });
  }

  // Generate multiple choice questions (English -> Target Language)
  for (const item of mcItems) {
    const correctWord = item.word;
    const englishPrompt = translationsMap[correctWord] || correctWord;

    // Pick up to 3 distinct distractors from allAvailableItems
    const otherWords = allAvailableItems
      .map((x) => x.word)
      .filter((w) => w.toLowerCase() !== correctWord.toLowerCase());
    
    const shuffledDistractors = otherWords.sort(() => Math.random() - 0.5);
    const chosenDistractors = shuffledDistractors.slice(0, 3);

    const options = [correctWord, ...chosenDistractors].sort(() => Math.random() - 0.5);

    mcQuestions.push({
      type: 'multiple_choice',
      item,
      word: correctWord,
      englishPrompt,
      options,
      correctOption: correctWord,
    });
  }

  // Strictly alternate between multiple choice and free-response (typed) questions
  const alternated: TQuizQuestion[] = [];
  const maxLen = Math.max(mcQuestions.length, typedQuestions.length);

  for (let i = 0; i < maxLen; i++) {
    if (i < mcQuestions.length) alternated.push(mcQuestions[i]);
    if (i < typedQuestions.length) alternated.push(typedQuestions[i]);
  }

  return alternated;
}
