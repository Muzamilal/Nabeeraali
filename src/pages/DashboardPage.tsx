import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame, Trophy, Target, TrendingUp, Image as ImageIcon, ArrowRight,
  Award, Brain, Zap, CheckCircle2, XCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Navbar } from '@/components/Navbar';
import { PageContainer } from '@/components/PageContainer';
import { supabase } from '@/lib/supabase';
import type { TestSession } from '@/types';

export function DashboardPage() {
  const { profile, user } = useAuth();
  const [recentSessions, setRecentSessions] = useState<TestSession[]>([]);
  const [leaderboardRank, setLeaderboardRank] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: sessions } = await supabase
        .from('test_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      setRecentSessions((sessions as TestSession[]) || []);

      if (profile) {
        const { data: lbData } = await supabase
          .from('leaderboard')
          .select('rank')
          .eq('id', user.id)
          .maybeSingle();
        if (lbData) setLeaderboardRank((lbData as { rank: number }).rank);
      }
    })();
  }, [user, profile]);

  if (!profile) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      </PageContainer>
    );
  }

  const accuracy =
    profile.correct_answers + profile.incorrect_answers > 0
      ? Math.round((profile.correct_answers / (profile.correct_answers + profile.incorrect_answers)) * 100)
      : 0;

  const stats = [
    { label: 'Total Points', value: profile.total_points.toLocaleString(), icon: Zap, gradient: 'from-primary-500 to-emerald-600', iconBg: 'bg-primary-500/10', iconColor: 'text-primary-500' },
    { label: 'Current Streak', value: `${profile.current_streak} days`, icon: Flame, gradient: 'from-orange-500 to-red-600', iconBg: 'bg-orange-500/10', iconColor: 'text-orange-500', flame: true },
    { label: 'Tests Completed', value: profile.tests_completed, icon: Target, gradient: 'from-accent-500 to-blue-600', iconBg: 'bg-accent-500/10', iconColor: 'text-accent-500' },
    { label: 'Accuracy', value: `${accuracy}%`, icon: TrendingUp, gradient: 'from-purple-500 to-pink-600', iconBg: 'bg-purple-500/10', iconColor: 'text-purple-500' },
  ];

  return (
    <PageContainer>
      <Navbar />
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl font-bold font-display">
            Welcome back, <span className="gradient-text">{profile.username}</span>
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Ready to ace your MDCAT? Let's continue where you left off.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 overflow-hidden group hover:shadow-lg transition-shadow animate-fade-in-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`} />
                <div className={`w-11 h-11 rounded-xl ${stat.iconBg} flex items-center justify-center mb-3`}>
                  <Icon size={22} className={`${stat.iconColor} ${stat.flame ? 'animate-streak-flame' : ''}`} />
                </div>
                <div className="text-2xl font-bold font-display">{stat.value}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</div>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 relative bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 rounded-3xl p-8 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-400/20 rounded-full blur-3xl -ml-10 -mb-10" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white text-sm font-medium mb-4">
                <Brain size={16} /> AI-Powered Study
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 font-display">Scan your notes and start a test</h2>
              <p className="text-white/80 mb-6 max-w-lg">
                Upload an image of your textbook, notes, or question sheet. Our AI will extract the content and generate a personalized quiz for you.
              </p>
              <Link
                to="/scan"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-primary-600 font-semibold hover:shadow-xl hover:scale-105 transition-all"
              >
                <ImageIcon size={20} /> Start Scanning <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col items-center justify-center text-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-3">
              <Trophy size={32} className="text-white" />
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Leaderboard Rank</div>
            <div className="text-4xl font-bold font-display mt-1">{leaderboardRank ? `#${leaderboardRank}` : '—'}</div>
            <Link to="/leaderboard" className="mt-3 text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline flex items-center gap-1">
              View leaderboard <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
            <h3 className="font-bold font-display mb-4">Answer Breakdown</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle2 size={16} className="text-primary-500" /> Correct
                  </span>
                  <span className="font-bold text-primary-600 dark:text-primary-400">{profile.correct_answers}</span>
                </div>
                <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500" style={{ width: `${accuracy}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <XCircle size={16} className="text-danger-500" /> Incorrect
                  </span>
                  <span className="font-bold text-danger-500">{profile.incorrect_answers}</span>
                </div>
                <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-danger-400 to-danger-600 rounded-full transition-all duration-500" style={{ width: `${100 - accuracy}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold font-display">Recent Activity</h3>
              <Award size={20} className="text-gray-400" />
            </div>
            {recentSessions.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                  <Target size={28} className="text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">No tests yet. Start your first one now!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentSessions.map((session, i) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    style={{ animationDelay: `${0.4 + i * 0.05}s` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                        <Target size={18} className="text-primary-500" />
                      </div>
                      <div>
                        <div className="font-medium text-sm capitalize">{session.mode} Test</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(session.created_at).toLocaleDateString()} · {session.total_questions} questions
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary-600 dark:text-primary-400">+{session.score}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{session.correct_count}/{session.total_questions} correct</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </PageContainer>
  );
}
