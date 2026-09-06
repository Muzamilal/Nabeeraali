import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check, X, Sparkles, Flame, Trophy, Volume2, VolumeX,
  ArrowRight, Home, RefreshCw, Award, Target, PartyPopper,
} from 'lucide-react';
import { PageContainer } from '@/components/PageContainer';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { speak, stopSpeaking } from '@/lib/voice';
import type { QuizQuestion, TestMode } from '@/types';

interface QuizState {
  currentIndex: number;
  selectedAnswer: number | null;
  showFeedback: boolean;
  score: number;
  correctCount: number;
  incorrectCount: number;
  streak: number;
  answered: boolean;
  voiceEnabled: boolean;
}

export function QuizPage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [mode, setMode] = useState<TestMode>('mcq');
  const [quizState, setQuizState] = useState<QuizState>({
    currentIndex: 0,
    selectedAnswer: null,
    showFeedback: false,
    score: 0,
    correctCount: 0,
    incorrectCount: 0,
    streak: 0,
    answered: false,
    voiceEnabled: true,
  });
  const [showResults, setShowResults] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [scorePopup, setScorePopup] = useState<string | null>(null);
  const [sessionSaved, setSessionSaved] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('scanned_questions');
    const storedMode = sessionStorage.getItem('selected_mode') as TestMode | null;
    if (!stored) {
      navigate('/scan');
      return;
    }
    const parsed: QuizQuestion[] = JSON.parse(stored);
    if (parsed.length === 0) {
      navigate('/scan');
      return;
    }
    setQuestions(parsed);
    if (storedMode) setMode(storedMode);
  }, [navigate]);

  const currentQuestion = questions[quizState.currentIndex];

  const handleAnswer = useCallback(
    (answerIndex: number) => {
      if (quizState.answered || !currentQuestion) return;

      const isCorrect = answerIndex === currentQuestion.correct_answer;
      const points = isCorrect ? 10 + Math.min(quizState.streak * 2, 20) : 0;

      setQuizState((prev) => ({
        ...prev,
        selectedAnswer: answerIndex,
        showFeedback: true,
        answered: true,
        score: prev.score + points,
        correctCount: prev.correctCount + (isCorrect ? 1 : 0),
        incorrectCount: prev.incorrectCount + (isCorrect ? 0 : 1),
        streak: isCorrect ? prev.streak + 1 : 0,
      }));

      if (isCorrect) {
        setScorePopup(`+${points}`);
        setTimeout(() => setScorePopup(null), 1000);
        if (quizState.voiceEnabled) {
          const phrases = [
            'Correct! Shaabaash! Aapka jawab bilkul sahi hai.',
            'Correct! Well done, you got it right!',
            'Excellent! That is the correct answer!',
          ];
          const phrase = phrases[Math.floor(Math.random() * phrases.length)];
          speak(`${phrase} ${currentQuestion.explanation}`);
        }
        if (quizState.streak > 0 && (quizState.streak + 1) % 3 === 0) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }
      } else {
        if (quizState.voiceEnabled) {
          speak(`Incorrect. Ye jawab galat hai. The correct answer is option ${currentQuestion.correct_answer + 1}. ${currentQuestion.explanation}`);
        }
      }
    },
    [quizState, currentQuestion]
  );

  const handleNext = useCallback(() => {
    stopSpeaking();
    if (quizState.currentIndex + 1 >= questions.length) {
      setShowResults(true);
    } else {
      setQuizState((prev) => ({
        ...prev,
        currentIndex: prev.currentIndex + 1,
        selectedAnswer: null,
        showFeedback: false,
        answered: false,
      }));
    }
  }, [quizState.currentIndex, questions.length]);

  useEffect(() => {
    if (!showResults || sessionSaved || !user) return;

    (async () => {
      const imageUrl = sessionStorage.getItem('scan_image_url') || '';

      const { data: sessionData, error: sessionError } = await supabase
        .from('test_sessions')
        .insert({
          user_id: user.id,
          mode,
          score: quizState.score,
          total_questions: questions.length,
          correct_count: quizState.correctCount,
          incorrect_count: quizState.incorrectCount,
          source_image_url: imageUrl,
        })
        .select()
        .maybeSingle();

      if (sessionError) {
        console.error('Error saving session:', sessionError);
      } else if (sessionData) {
        const sessionId = (sessionData as { id: string }).id;
        const questionRows = questions.map((q) => ({
          session_id: sessionId,
          question_text: q.question_text,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
        }));
        await supabase.from('test_questions').insert(questionRows);
      }

      const today = new Date().toISOString().split('T')[0];
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (currentProfile) {
        const profile = currentProfile as {
          total_points: number;
          current_streak: number;
          longest_streak: number;
          tests_completed: number;
          correct_answers: number;
          incorrect_answers: number;
          last_test_date: string | null;
        };

        const lastDate = profile.last_test_date;
        let newStreak = 1;
        if (lastDate) {
          const last = new Date(lastDate);
          const diffDays = Math.floor((new Date(today).getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) newStreak = profile.current_streak + 1;
          else if (diffDays === 0) newStreak = profile.current_streak;
        }

        await supabase
          .from('profiles')
          .update({
            total_points: profile.total_points + quizState.score,
            current_streak: newStreak,
            longest_streak: Math.max(profile.longest_streak, newStreak),
            tests_completed: profile.tests_completed + 1,
            correct_answers: profile.correct_answers + quizState.correctCount,
            incorrect_answers: profile.incorrect_answers + quizState.incorrectCount,
            last_test_date: today,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        await refreshProfile();
      }

      setSessionSaved(true);
      sessionStorage.removeItem('scanned_questions');
      sessionStorage.removeItem('scan_image_url');
      sessionStorage.removeItem('selected_mode');
    })();
  }, [showResults, sessionSaved, user, quizState, questions, mode, refreshProfile]);

  const toggleVoice = () => {
    if (quizState.voiceEnabled) stopSpeaking();
    setQuizState((prev) => ({ ...prev, voiceEnabled: !prev.voiceEnabled }));
  };

  if (questions.length === 0 || !currentQuestion) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      </PageContainer>
    );
  }

  if (showResults) {
    const accuracy = Math.round((quizState.correctCount / questions.length) * 100);
    const isGoodScore = accuracy >= 70;

    return (
      <PageContainer>
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-2xl">
            <div className="relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-bounce-in">
              <div className={`h-32 bg-gradient-to-br ${isGoodScore ? 'from-primary-500 to-accent-500' : 'from-orange-500 to-red-500'} flex items-center justify-center relative overflow-hidden`}>
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
                <div className="relative flex flex-col items-center">
                  {isGoodScore ? <PartyPopper size={48} className="text-white mb-1" /> : <Award size={48} className="text-white mb-1" />}
                  <h2 className="text-2xl font-bold text-white font-display">{isGoodScore ? 'Excellent Work!' : 'Keep Practicing!'}</h2>
                </div>
              </div>

              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="text-5xl font-bold gradient-text font-display">{quizState.score}</div>
                  <div className="text-gray-500 dark:text-gray-400 mt-1">Total Points Earned</div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="text-center p-4 rounded-2xl bg-primary-500/10">
                    <Check size={24} className="text-primary-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{quizState.correctCount}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Correct</div>
                  </div>
                  <div className="text-center p-4 rounded-2xl bg-danger-500/10">
                    <X size={24} className="text-danger-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-danger-500">{quizState.incorrectCount}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Incorrect</div>
                  </div>
                  <div className="text-center p-4 rounded-2xl bg-accent-500/10">
                    <Target size={24} className="text-accent-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-accent-600 dark:text-accent-400">{accuracy}%</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Accuracy</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={() => navigate('/scan')} className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary-500/25 transition-all">
                    <RefreshCw size={18} /> New Test
                  </button>
                  <button onClick={() => navigate('/leaderboard')} className="flex-1 py-3.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <Trophy size={18} /> Leaderboard
                  </button>
                  <button onClick={() => navigate('/dashboard')} className="py-3.5 px-5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <Home size={18} /> Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {showConfetti && <Confetti />}
      </PageContainer>
    );
  }

  const progress = ((quizState.currentIndex + 1) / questions.length) * 100;
  const isCorrect = quizState.answered && quizState.selectedAnswer === currentQuestion.correct_answer;

  return (
    <PageContainer>
      <div className="min-h-screen px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto pt-6 pb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500/10">
              <Flame size={18} className="text-orange-500 animate-streak-flame" />
              <span className="font-bold text-orange-600 dark:text-orange-400">{quizState.streak}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary-500/10">
              <Trophy size={18} className="text-primary-500" />
              <span className="font-bold text-primary-600 dark:text-primary-400">{quizState.score}</span>
            </div>
          </div>
          <button
            onClick={toggleVoice}
            className={`p-2.5 rounded-xl transition-colors ${quizState.voiceEnabled ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}
            aria-label="Toggle voice"
          >
            {quizState.voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Question {quizState.currentIndex + 1} of {questions.length}</span>
            <span className="font-medium text-gray-600 dark:text-gray-300 capitalize">{mode} Mode</span>
          </div>
          <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div key={quizState.currentIndex} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 animate-fade-in-up relative">
          {scorePopup && (
            <div className="absolute top-4 right-4 text-2xl font-bold text-primary-500 animate-score-popup pointer-events-none">{scorePopup}</div>
          )}

          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shrink-0">
              <Sparkles size={20} className="text-white" />
            </div>
            <h2 className="text-xl font-bold font-display leading-snug pt-1">{currentQuestion.question_text}</h2>
          </div>

          <div className="space-y-3">
            {currentQuestion.options.map((option, i) => {
              const isSelected = quizState.selectedAnswer === i;
              const isCorrectOption = i === currentQuestion.correct_answer;
              const showCorrect = quizState.answered && isCorrectOption;
              const showWrong = quizState.answered && isSelected && !isCorrectOption;

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={quizState.answered}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 flex items-center gap-3 ${
                    showCorrect
                      ? 'border-primary-500 bg-primary-500/10'
                      : showWrong
                      ? 'border-danger-500 bg-danger-500/10 animate-shake'
                      : quizState.answered
                      ? 'border-gray-200 dark:border-gray-800 opacity-50'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-600 hover:bg-primary-500/5 cursor-pointer'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 transition-colors ${
                    showCorrect ? 'bg-primary-500 text-white' : showWrong ? 'bg-danger-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }`}>
                    {showCorrect ? <Check size={18} strokeWidth={3} /> : showWrong ? <X size={18} strokeWidth={3} /> : String.fromCharCode(65 + i)}
                  </div>
                  <span className="flex-1 text-sm sm:text-base font-medium">{option}</span>
                </button>
              );
            })}
          </div>

          {quizState.showFeedback && (
            <div className={`mt-6 p-5 rounded-2xl border animate-fade-in-up ${isCorrect ? 'border-primary-500/30 bg-primary-500/5' : 'border-danger-500/30 bg-danger-500/5'}`}>
              <div className="flex items-center gap-2 mb-2">
                {isCorrect ? <Check size={20} className="text-primary-500" /> : <X size={20} className="text-danger-500" />}
                <h3 className={`font-bold ${isCorrect ? 'text-primary-600 dark:text-primary-400' : 'text-danger-600 dark:text-danger-400'}`}>
                  {isCorrect ? 'Correct! Shaabaash!' : 'Incorrect! Ye jawab galat hai'}
                </h3>
              </div>
              {!isCorrect && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Correct answer: <span className="font-semibold text-primary-600 dark:text-primary-400">{currentQuestion.options[currentQuestion.correct_answer]}</span>
                </p>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{currentQuestion.explanation}</p>
            </div>
          )}

          {quizState.answered && (
            <button
              onClick={handleNext}
              className="mt-6 w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary-500/25 transition-all animate-fade-in-up"
            >
              {quizState.currentIndex + 1 >= questions.length ? 'View Results' : 'Next Question'} <ArrowRight size={18} />
            </button>
          )}
        </div>

        {showConfetti && <Confetti />}
      </div>
    </PageContainer>
  );
}

function Confetti() {
  const colors = ['#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 6 + Math.random() * 8,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute top-0 rounded-sm"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            animation: `confettiFall ${p.duration}s linear ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

