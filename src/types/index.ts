export type TestMode = 'mcq' | 'theoretical' | 'mdcat';

export interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  total_points: number;
  current_streak: number;
  longest_streak: number;
  tests_completed: number;
  correct_answers: number;
  incorrect_answers: number;
  last_test_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TestSession {
  id: string;
  user_id: string;
  mode: TestMode;
  score: number;
  total_questions: number;
  correct_count: number;
  incorrect_count: number;
  source_image_url: string;
  created_at: string;
}

export interface TestQuestion {
  id: string;
  session_id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  user_answer: number | null;
  is_correct: boolean;
  explanation: string;
  created_at: string;
}

export interface QuizQuestion {
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  avatar_url: string;
  total_points: number;
  current_streak: number;
  longest_streak: number;
  tests_completed: number;
  correct_answers: number;
  incorrect_answers: number;
  rank: number;
}

