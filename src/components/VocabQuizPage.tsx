import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useInfoModal from "./base/useInfoModal";
import { Box, Button, CircularProgress, LinearProgress, Paper, TextField, Typography } from "@mui/material";
import Bot, { TAiQuizResponseEvaluation } from "../functions/Bot";
import TLanguage from "../database/TLanguage";
import Confetti from 'react-confetti';
import { AuthenticatedComponentDefaultProps } from "./base/Authenticator";
import { UserID } from "../database/ID";
import Database from "../database/Database";
import { buildQuizQuestions, getWeightedQuizItems, TQuizQuestion } from "../functions/quizSelection";

const CONFETTI_ANIMATION_DURATION_MS: number = 5000;

const VocabQuizPage = ({ user, user_settings }: AuthenticatedComponentDefaultProps) => {
  const user_id = user?.id as UserID;
  const language = (user_settings?.language || localStorage.getItem("language")) as TLanguage;
  const navigate = useNavigate();
  const openInfoModal = useInfoModal();

  const [questions, setQuestions] = useState<TQuizQuestion[]>();
  const [activeQuizWordIndex, setActiveQuizWordIndex] = useState<number>(0);
  const [inputValue, setInputValue] = useState<string>("");
  const [botLoading, setBotLoading] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [loadingQuiz, setLoadingQuiz] = useState<boolean>(true);
  const [, setQuizScores] = useState<number[]>([]);
  const [is_confetti_open, set_is_confetti_open] = useState<boolean>();
  const inputRef = useRef<HTMLInputElement>(null);
  const questionsAnsweredRef = useRef<number>(user_settings?.vocab_questions_answered || 0);

  useEffect(() => {
    if (!user_id || !language) return;

    let isMounted = true;
    setLoadingQuiz(true);

    const storedQuizLength = parseInt(localStorage.getItem('quiz_length') || '10', 10);
    const targetQuizLength = isNaN(storedQuizLength) || storedQuizLength <= 0 ? 10 : storedQuizLength;

    Database.GetVocabList(user_id, language).then(async (vocab) => {
      if (!isMounted) return;

      const activeItems = vocab.filter((item) => !item.is_archived);
      if (activeItems.length === 0) {
        openInfoModal(
          "Error",
          "You have no active words in your vocab list to practice. Add words or restore them from the archive.",
          undefined,
          () => navigate('/vocab')
        );
        return;
      }

      // 1. Select up to targetQuizLength items using Anki-weighted sampling
      const selected = getWeightedQuizItems(activeItems, targetQuizLength);

      // 2. Partition selected items into multiple choice and typed
      const shuffled = [...selected].sort(() => Math.random() - 0.5);
      const mcCount = Math.floor(shuffled.length / 2);
      const mcItems = shuffled.slice(0, mcCount);
      const typedItems = shuffled.slice(mcCount);

      // 3. Preload English translations for all multiple choice items
      const translationsMap: Record<string, string> = {};
      await Promise.all(
        mcItems.map(async (item) => {
          const word = item.word;
          const cleanWord = word.replace(/[\.\,\/\\\#\!\?\$\%\^\&\*\;\:\{\}\=\_\`\~\(\)\¡\¿\"\”]/g, '').toLowerCase().trim();
          try {
            let cached = await Database.GetTranslationAndExamples(cleanWord, language);
            if (cached && cached.translation && cached.translation.trim() && cached.translation.trim().toLowerCase() !== cleanWord) {
              translationsMap[word] = cached.translation.trim();
              return;
            }

            // Generate if not cached or cached translation is invalid
            cached = await Bot.GenerateTranslationAndExamplesForWord(cleanWord, language);
            if (cached && cached.translation && cached.translation.trim() && cached.translation.trim().toLowerCase() !== cleanWord) {
              Database.AddTranslationAndExample(cached).catch(() => {});
              translationsMap[word] = cached.translation.trim();
              return;
            }
          } catch (e) {
            console.warn(`Could not load full translation for ${word}:`, e);
          }

          // Fallback: direct translation endpoint if translate-word regex or database failed
          try {
            const direct = await Bot.GenerateMessageTranslation(cleanWord, language);
            if (direct && direct.trim() && direct.trim().toLowerCase() !== cleanWord) {
              translationsMap[word] = direct.trim().replace(/^["']|["']$/g, '');
              return;
            }
          } catch (e2) {
            console.warn(`Direct translation also failed for ${word}:`, e2);
          }

          translationsMap[word] = cleanWord;
        })
      );

      if (!isMounted) return;

      // 4. Build balanced bidirectional quiz questions (strictly alternated)
      const generatedQuestions = buildQuizQuestions(mcItems, typedItems, activeItems, translationsMap);
      setQuestions(generatedQuestions);
      setActiveQuizWordIndex(0);
      setLoadingQuiz(false);
    }).catch((err) => {
      console.error("Failed to load vocab quiz questions:", err);
      openInfoModal("Error", "Failed to load vocab quiz. Returning to vocab list.", undefined, () => navigate('/vocab'));
    });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user_id, language, navigate]);

  useEffect(() => {
    (document.activeElement as HTMLElement)?.blur();
    if (questions && questions[activeQuizWordIndex]?.type === 'typed_translation') {
      inputRef.current?.focus();
    }
  }, [activeQuizWordIndex, questions]);

  const currentQuestionRef = useRef<TQuizQuestion | null>(null);
  currentQuestionRef.current = questions && questions[activeQuizWordIndex] ? questions[activeQuizWordIndex] : null;

  const isEvaluatingRef = useRef<boolean>(false);
  isEvaluatingRef.current = isEvaluating;

  const botLoadingRef = useRef<boolean>(false);
  botLoadingRef.current = botLoading;

  const launch_confetti = () => {
    set_is_confetti_open(true);
    setTimeout(() => set_is_confetti_open(false), CONFETTI_ANIMATION_DURATION_MS);
  };

  const advanceOrFinishQuiz = (
    newScore: number,
    isCorrect: boolean,
    feedbackTitle: string,
    feedbackMsg: string
  ) => {
    if (!questions) return;
    const currentQ = questions[activeQuizWordIndex];
    setIsEvaluating(true);

    // Persist updated mastery counts in database
    Database.UpdateVocabWordScore(
      user_id,
      currentQ.word,
      language,
      isCorrect,
      currentQ.item.correct_count || 0,
      currentQ.item.incorrect_count || 0
    ).then((updated) => {
      currentQ.item.correct_count = updated.correct_count;
      currentQ.item.incorrect_count = updated.incorrect_count;
    }).catch((err) => {
      console.error("Failed to update vocab word score:", err);
    });

    // Increment all-time questions answered in UserSettings
    Database.IncrementUserQuestionsAnswered(user_id, questionsAnsweredRef.current)
      .then((newTotal) => {
        questionsAnsweredRef.current = newTotal;
      })
      .catch((err) => {
        console.warn("Failed to increment user questions answered:", err);
      });

    setQuizScores((prevScores) => {
      const updatedScores = [...prevScores, newScore];
      const isQuizDone = activeQuizWordIndex === questions.length - 1;

      if (isQuizDone) {
        launch_confetti();
        const sum = updatedScores.reduce((acc: number, score: number) => acc + score, 0);
        const scoreBreakdown = updatedScores.reduce(
          (acc: string, score: number, index: number) =>
            acc + `${questions[index].word}: ${score === 1 ? 'Correct (+1)' : score === 0.5 ? 'Partial (+0.5)' : 'Missed (0)'}\n`,
          ''
        );

        openInfoModal(
          "Quiz Results",
          `${feedbackMsg}\n\nYou scored ${sum}/${questions.length} points!\n\n${scoreBreakdown}`,
          undefined,
          () => {
            setIsEvaluating(false);
            navigate('/vocab');
          }
        );
        return [];
      } else {
        openInfoModal(
          feedbackTitle,
          feedbackMsg,
          undefined,
          () => {
            (document.activeElement as HTMLElement)?.blur();
            setIsEvaluating(false);
            setActiveQuizWordIndex((prev) => prev + 1);
            setInputValue("");
            setTimeout(() => inputRef.current?.focus(), 50);
          }
        );
      }

      return updatedScores;
    });
  };

  const handleTypedSubmission = async () => {
    if (!inputValue.trim() || botLoading || isEvaluating || !questions || questions.length === 0) return;

    const submittedText = inputValue.trim();
    const currentQ = questions[activeQuizWordIndex];
    const foreignWord: string = currentQ.word;
    setInputValue("");
    setBotLoading(true);
    setIsEvaluating(true);

    try {
      const response: TAiQuizResponseEvaluation = await Bot.IsQuizResponseCorrect(
        foreignWord,
        language,
        submittedText
      );
      setBotLoading(false);

      const isCorrect = response.correctness === 'Correct';
      const score: number = response.correctness === "Correct" ? 1 : response.correctness === "Partial" ? 0.5 : 0;
      const title = response.correctness === 'Correct' ? 'Yipee!' : response.correctness === 'Partial' ? 'Almost!' : "That's not right...";
      const msg = response.correctness === 'Correct'
        ? `"${submittedText}" is a correct translation for "${foreignWord}".`
        : response.info || `"${submittedText}" was not recognized as a correct translation for "${foreignWord}".`;

      advanceOrFinishQuiz(score, isCorrect, title, msg);
    } catch (err) {
      setBotLoading(false);
      setIsEvaluating(false);
      setInputValue(submittedText);
      openInfoModal("Error", "Failed to evaluate response. Please try again.", undefined, () => inputRef.current?.focus());
    }
  };

  const handleMultipleChoiceSelect = (selectedOption: string) => {
    if (botLoadingRef.current || isEvaluatingRef.current) return;
    (document.activeElement as HTMLElement)?.blur();
    setIsEvaluating(true);

    const currentQ = currentQuestionRef.current;
    if (!currentQ) return;
    const isCorrect = selectedOption.toLowerCase() === (currentQ.correctOption || '').toLowerCase();
    const score = isCorrect ? 1 : 0;
    const title = isCorrect ? 'Yipee!' : "That's not right...";
    const msg = isCorrect
      ? `"${selectedOption}" is correct for "${currentQ.englishPrompt}"!`
      : `The correct ${language} word for "${currentQ.englishPrompt}" is "${currentQ.correctOption}". You selected "${selectedOption}".`;

    advanceOrFinishQuiz(score, isCorrect, title, msg);
  };



  const inputOnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTypedSubmission();
    }
  };

  if (loadingQuiz || !questions || questions.length === 0) {
    return (
      <Box
        sx={{
          backgroundColor: '#ffffff',
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <CircularProgress sx={{ color: 'var(--primary-blue)' }} />
        <Typography sx={{ color: '#9ca3af', fontSize: '0.9rem', fontWeight: 500 }}>
          Preparing personalized quiz...
        </Typography>
      </Box>
    );
  }

  const currentQ = questions[activeQuizWordIndex];
  const progressPercent = Math.round(((activeQuizWordIndex + 1) / questions.length) * 100);

  return (
    <Box
      sx={{
        backgroundColor: '#ffffff',
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        p: 2,
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {is_confetti_open && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          initialVelocityY={20}
          style={{ zIndex: 1000 }}
        />
      )}

      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: '440px',
          p: { xs: 3, sm: 4.5 },
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Minimal Progress Indicator */}
        <Box sx={{ width: '100%', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
            <Typography
              sx={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#9ca3af',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Question {activeQuizWordIndex + 1} of {questions.length}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#9ca3af',
              }}
            >
              {progressPercent}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progressPercent}
            sx={{
              height: 5,
              borderRadius: 3,
              backgroundColor: '#f3f4f6',
              '& .MuiLinearProgress-bar': {
                backgroundColor: 'var(--primary-blue)',
                borderRadius: 3,
              },
            }}
          />
        </Box>

        {/* Question Prompt */}
        {currentQ.type === 'typed_translation' ? (
          <>
            <Typography
              sx={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                mb: 1,
              }}
            >
              Translate to English
            </Typography>

            <Typography
              variant="h4"
              component="h2"
              sx={{
                fontWeight: 700,
                color: '#111827',
                mb: 3.5,
                wordBreak: 'break-word',
                letterSpacing: '-0.02em',
              }}
            >
              {currentQ.word}
            </Typography>

            {/* Translation Input */}
            <TextField
              inputRef={inputRef}
              variant="outlined"
              placeholder="Type your translation..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={inputOnKeyDown}
              disabled={botLoading}
              fullWidth
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  backgroundColor: '#f9fafb',
                  fontSize: '1.05rem',
                  transition: 'border-color 0.2s, background-color 0.2s',
                  '& fieldset': {
                    borderColor: '#e5e7eb',
                  },
                  '&:hover fieldset': {
                    borderColor: '#d1d5db',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'var(--primary-blue)',
                  },
                  '&.Mui-focused': {
                    backgroundColor: '#ffffff',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  textAlign: 'center',
                  padding: '12px 14px',
                },
              }}
            />

            {/* Submit Button */}
            <Button
              variant="contained"
              disableElevation
              onClick={handleTypedSubmission}
              disabled={botLoading || !inputValue.trim()}
              sx={{
                width: '100%',
                py: 1.25,
                borderRadius: '10px',
                backgroundColor: 'var(--primary-blue)',
                color: '#ffffff',
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 600,
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: '#0072de',
                  boxShadow: 'none',
                },
                '&.Mui-disabled': {
                  backgroundColor: '#f3f4f6',
                  color: '#9ca3af',
                },
              }}
            >
              {botLoading ? (
                <CircularProgress size={22} sx={{ color: 'inherit' }} />
              ) : (
                'Submit'
              )}
            </Button>
          </>
        ) : (
          <>
            <Typography
              sx={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                mb: 1,
              }}
            >
              Select the {language} word for
            </Typography>

            <Typography
              variant="h4"
              component="h2"
              sx={{
                fontWeight: 700,
                color: '#111827',
                mb: 3,
                wordBreak: 'break-word',
                letterSpacing: '-0.02em',
              }}
            >
              {currentQ.englishPrompt}
            </Typography>

            {/* Multiple Choice Options */}
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {currentQ.options?.map((option, idx) => (
                <Button
                  key={`q-${activeQuizWordIndex}-opt-${idx}`}
                  variant="outlined"
                  onClick={() => handleMultipleChoiceSelect(option)}
                  disabled={botLoading || isEvaluating}
                  sx={{
                    width: '100%',
                    py: 1.3,
                    px: 2,
                    borderRadius: '10px',
                    borderColor: '#e5e7eb',
                    backgroundColor: '#f9fafb',
                    color: '#1e293b',
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      borderColor: 'var(--primary-blue)',
                      backgroundColor: '#eff6ff',
                      color: 'var(--primary-blue)',
                    },
                    '&:focus, &:focus-visible, &.Mui-focusVisible': {
                      outline: 'none',
                      borderColor: '#e5e7eb',
                      backgroundColor: '#f9fafb',
                      color: '#1e293b',
                    },
                    '&.Mui-disabled': {
                      backgroundColor: '#f9fafb',
                      borderColor: '#f1f5f9',
                    },
                  }}
                >
                  {option}
                </Button>
              ))}
            </Box>
          </>
        )}
      </Paper>

      {/* Subtle bottom navigation */}
      <Button
        type="button"
        onClick={() => navigate('/vocab')}
        sx={{
          position: 'fixed',
          bottom: '1.25rem',
          left: '1.5rem',
          color: '#9ca3af',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.9rem',
          '&:hover': {
            color: '#4b5563',
            backgroundColor: 'transparent',
          },
        }}
      >
        Exit Quiz
      </Button>
    </Box>
  );
};

export default VocabQuizPage;