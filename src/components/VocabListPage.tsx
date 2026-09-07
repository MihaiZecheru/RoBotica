import { useEffect, useState } from "react";
import Database from "../database/Database";
import { AuthenticatedComponentDefaultProps } from "./base/Authenticator";
import { UserID } from "../database/ID";
import TLanguage from "../database/TLanguage";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import UnarchiveOutlinedIcon from '@mui/icons-material/UnarchiveOutlined';
import { Box, Button, CircularProgress, IconButton, Paper, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import TVocabListItem from "../database/TVocabListItem";
import ClickableWord from "./ClickableWord";
import useInfoModal from "./base/useInfoModal";
import { GetUserSettings } from "../database/GetUser";

const VocabListPage = ({ user, user_settings }: AuthenticatedComponentDefaultProps) => {
  const [vocabList, setVocabList] = useState<TVocabListItem[]>();
  const [currentTab, setCurrentTab] = useState<'active' | 'archived'>('active');
  const [quizLength, setQuizLength] = useState<number>(() => {
    const stored = localStorage.getItem('quiz_length');
    return stored ? parseInt(stored, 10) : 10;
  });
  const [questionsAnswered, setQuestionsAnswered] = useState<number>(
    user_settings?.vocab_questions_answered || 0
  );

  const user_id = user?.id as UserID;
  const language = user_settings?.language as TLanguage;
  const navigate = useNavigate();
  const showInfoModal = useInfoModal();

  useEffect(() => {
    if (!user_id || !language) return;

    Database.GetVocabList(user_id, language).then((data) => {
      setVocabList(data);
    });

    GetUserSettings(user_id).then((settings) => {
      if (settings?.vocab_questions_answered !== undefined) {
        setQuestionsAnswered(settings.vocab_questions_answered);
      }
    }).catch((err) => console.warn('Could not refresh user settings:', err));
  }, [language, user_id, navigate]);

  const handleQuizLengthChange = (length: number) => {
    setQuizLength(length);
    localStorage.setItem('quiz_length', length.toString());
  };

  const archiveWord = (item: TVocabListItem, archive: boolean) => {
    Database.ArchiveVocabListItem(item.user_id, item.word, archive);
    setVocabList((prev) =>
      prev?.map((x) => (x.word === item.word ? { ...x, is_archived: archive } : x))
    );
  };

  const deletePermanently = (item: TVocabListItem) => {
    Database.DeleteVocabListItem(item.user_id, item.word);
    setVocabList((prev) => prev?.filter((x) => x.word !== item.word));
  };

  const activeWords = (vocabList || [])
    .filter((x) => !x.is_archived)
    .sort((a, b) => (b.correct_count || 0) - (a.correct_count || 0));

  const archivedWords = (vocabList || [])
    .filter((x) => x.is_archived)
    .sort((a, b) => (b.correct_count || 0) - (a.correct_count || 0));

  const displayWords = currentTab === 'active' ? activeWords : archivedWords;

  const startQuiz = () => {
    if (activeWords.length === 0) {
      showInfoModal(
        'Error',
        `You can't start a quiz without active words in your vocab list. Add words by clicking on them while holding 'Alt' or restore them from the archive.`
      );
      return;
    }

    const words = activeWords.map((item: TVocabListItem) => item.word);
    localStorage.setItem('words', JSON.stringify(words));
    localStorage.setItem('language', language);
    localStorage.setItem('quiz_length', quizLength.toString());
    navigate('/vocab/quiz');
  };

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
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: '440px',
          p: { xs: 3, sm: 4 },
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Header with All-Time Questions Stat */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box>
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#9ca3af',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  mb: 0.5,
                }}
              >
                Vocabulary List
              </Typography>
              <Typography
                variant="h5"
                component="h1"
                sx={{ fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}
              >
                Saved Words
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1.2,
                  py: 0.35,
                  borderRadius: '12px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#15803d',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  mb: 0.5,
                }}
                title="All-time vocabulary quiz questions answered"
              >
                ⚡ {questionsAnswered} answered
              </Box>
              {vocabList && (
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#9ca3af' }}>
                  {activeWords.length} active
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* Tab Toggle: Active vs Archived */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            size="small"
            disableElevation
            onClick={() => setCurrentTab('active')}
            sx={{
              flex: 1,
              py: 0.8,
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              backgroundColor: currentTab === 'active' ? '#eff6ff' : '#f8fafc',
              color: currentTab === 'active' ? 'var(--primary-blue)' : '#64748b',
              border: currentTab === 'active' ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
              '&:hover': {
                backgroundColor: currentTab === 'active' ? '#dbeafe' : '#f1f5f9',
              },
            }}
          >
            Active ({activeWords.length})
          </Button>
          <Button
            size="small"
            disableElevation
            onClick={() => setCurrentTab('archived')}
            sx={{
              flex: 1,
              py: 0.8,
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              backgroundColor: currentTab === 'archived' ? '#eff6ff' : '#f8fafc',
              color: currentTab === 'archived' ? 'var(--primary-blue)' : '#64748b',
              border: currentTab === 'archived' ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
              '&:hover': {
                backgroundColor: currentTab === 'archived' ? '#dbeafe' : '#f1f5f9',
              },
            }}
          >
            Archive ({archivedWords.length})
          </Button>
        </Box>

        {/* Quiz Length Selector */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
            <Typography
              sx={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Quiz Length
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
              {quizLength} questions
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {[
              { label: 'Short', value: 5 },
              { label: 'Medium', value: 10 },
              { label: 'Long', value: 20 },
            ].map(({ label, value }) => {
              const isSelected = quizLength === value;
              return (
                <Button
                  key={value}
                  size="small"
                  onClick={() => handleQuizLengthChange(value)}
                  sx={{
                    flex: 1,
                    py: 0.7,
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    backgroundColor: isSelected ? 'var(--primary-blue)' : '#f8fafc',
                    color: isSelected ? '#ffffff' : '#64748b',
                    border: isSelected ? '1px solid var(--primary-blue)' : '1px solid #e2e8f0',
                    boxShadow: 'none',
                    '&:hover': {
                      backgroundColor: isSelected ? '#0072de' : '#f1f5f9',
                    },
                  }}
                >
                  {label}
                </Button>
              );
            })}
          </Box>
        </Box>

        {/* Start Quiz Action */}
        <Button
          variant="contained"
          disableElevation
          onClick={startQuiz}
          disabled={!vocabList || activeWords.length === 0}
          sx={{
            width: '100%',
            py: 1.25,
            mb: 3,
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
          Start Practice Quiz ({Math.min(quizLength, activeWords.length)} words)
        </Button>

        {/* Words List or Loading/Empty State */}
        {!vocabList ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} sx={{ color: 'var(--primary-blue)' }} />
          </Box>
        ) : displayWords.length === 0 ? (
          <Box sx={{ py: 5, px: 2, textAlign: 'center' }}>
            <Typography sx={{ color: '#475569', fontSize: '0.95rem', fontWeight: 600, mb: 1 }}>
              {currentTab === 'active' ? 'No active words' : 'Archive is empty'}
            </Typography>
            <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.6 }}>
              {currentTab === 'active'
                ? 'Click on words while holding Alt while reading or chatting to add them here.'
                : 'Words you archive when you feel comfortable with them will appear here.'}
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              maxHeight: '340px',
              overflowY: 'auto',
              pr: 0.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              scrollbarWidth: 'thin',
              '&::-webkit-scrollbar': { width: '4px' },
              '&::-webkit-scrollbar-thumb': { backgroundColor: '#e2e8f0', borderRadius: '4px' },
            }}
          >
            {displayWords.map((item: TVocabListItem) => (
              <Box
                key={item.word + item.when_added.getTime()}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 2,
                  py: 1.1,
                  borderRadius: '10px',
                  border: '1px solid #f1f5f9',
                  backgroundColor: '#f8fafc',
                  transition: 'background-color 0.15s ease, border-color 0.15s ease',
                  '&:hover': {
                    backgroundColor: '#f1f5f9',
                    borderColor: '#e2e8f0',
                  },
                }}
              >
                <Box sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem' }}>
                  <ClickableWord word={item.word} language={item.language} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.4,
                        px: 1,
                        py: 0.2,
                        borderRadius: '12px',
                        backgroundColor: (item.correct_count || 0) > 0 ? '#ecfdf5' : '#f1f5f9',
                        color: (item.correct_count || 0) > 0 ? '#059669' : '#9ca3af',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                      title={`${item.correct_count || 0} correct`}
                    >
                      ✓ {item.correct_count || 0}
                    </Box>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.4,
                        px: 1,
                        py: 0.2,
                        borderRadius: '12px',
                        backgroundColor: (item.incorrect_count || 0) > 0 ? '#fef2f2' : '#f1f5f9',
                        color: (item.incorrect_count || 0) > 0 ? '#dc2626' : '#9ca3af',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                      title={`${item.incorrect_count || 0} incorrect`}
                    >
                      ✕ {item.incorrect_count || 0}
                    </Box>
                  </Box>

                  {currentTab === 'active' ? (
                    <IconButton
                      size="small"
                      title="Archive word (comfortable with it)"
                      onClick={() => archiveWord(item, true)}
                      sx={{
                        color: '#9ca3af',
                        p: 0.5,
                        '&:hover': { color: 'var(--primary-blue)', backgroundColor: 'transparent' },
                      }}
                    >
                      <ArchiveOutlinedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  ) : (
                    <>
                      <IconButton
                        size="small"
                        title="Restore to active practice"
                        onClick={() => archiveWord(item, false)}
                        sx={{
                          color: '#9ca3af',
                          p: 0.5,
                          '&:hover': { color: 'var(--primary-blue)', backgroundColor: 'transparent' },
                        }}
                      >
                        <UnarchiveOutlinedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        title="Delete permanently"
                        onClick={() => deletePermanently(item)}
                        sx={{
                          color: '#9ca3af',
                          p: 0.5,
                          '&:hover': { color: '#ef4444', backgroundColor: 'transparent' },
                        }}
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default VocabListPage;