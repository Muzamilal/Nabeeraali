import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Flame, Target, TrendingUp, Crown, Medal, Award, ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { PageContainer } from '@/components/PageContainer';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { LeaderboardEntry } from '@/types';

export function LeaderboardPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('rank', { ascending: true })
        .limit(50);

      if (error) {
        console.error('Leaderboard error:', error);
      } else if (data) {
        setEntries(data as LeaderboardEntry[]);
        if (user) {
          const mine = (data as LeaderboardEntry[]).find((e) => e.id === user.id);
          setMyRank(mine || null);
        }
      }
      setLoading(false);
    })();
  }, [user]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { icon: Crown, bg: 'from-amber-400 to-yellow-500' };
    if (rank === 2) return { icon: Medal, bg: 'from-gray-300 to-gray-400' };
    if (rank === 3) return { icon: Award, bg: 'from-orange-400 to-orange-600' };
    return null;
  };

  return (
    <PageContainer>
      <Navbar />
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl font-bold font-display flex items-center gap-3">
            <Trophy size={32} className="text-amber-500" /> Leaderboard
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            See how you rank against other learners. Keep practicing to climb the ranks!
          </p>
        </div>

        {entries.length >= 3 && !loading && (
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
            {[1, 0, 2].map((displayIdx) => {
              const entry = entries[displayIdx];
              if (!entry) return null;
              const badge = getRankBadge(entry.rank);
              const Icon = badge?.icon || Trophy;
              const podiumHeight = entry.rank === 1 ? 'sm:pt-2' : 'sm:pt-6';
              const scale = entry.rank === 1 ? 'sm:scale-110' : '';

              return (
                <div key={entry.id} className={`flex flex-col items-center ${podiumHeight} ${scale} animate-bounce-in`} style={{ animationDelay: `${displayIdx * 0.15}s` }}>
                  <div className="relative mb-3">
                    <div className={`absolute inset-0 bg-gradient-to-br ${badge?.bg || 'from-gray-300 to-gray-400'} blur-lg opacity-50`} />
                    <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${badge?.bg || 'from-gray-300 to-gray-400'} flex items-center justify-center`}>
                      <Icon size={28} className="text-white" />
                    </div>
                  </div>
                  <div className={`bg-white dark:bg-gray-900 rounded-2xl border-2 ${entry.rank === 1 ? 'border-amber-400/50' : 'border-gray-200 dark:border-gray-800'} p-4 text-center w-full`}>
                    <div className="font-bold text-sm sm:text-base truncate">{entry.username}</div>
                    <div className="text-lg sm:text-2xl font-bold gradient-text font-display mt-1">{entry.total_points.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">points</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {myRank && (
          <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-primary-500/20 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center font-bold text-white">{myRank.rank}</div>
              <div className="flex-1">
                <div className="font-bold">{myRank.username} <span className="text-primary-600 dark:text-primary-400 text-sm font-normal">(You)</span></div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{myRank.total_points.toLocaleString()} points · {myRank.tests_completed} tests</div>
              </div>
              <Flame size={20} className="text-orange-500" />
              <span className="font-bold text-orange-500">{myRank.current_streak}</span>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <Trophy size={32} className="text-gray-400" />
              </div>
              <h3 className="font-bold mb-1">No rankings yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Complete a test to appear on the leaderboard.</p>
              <Link to="/scan" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium text-sm hover:shadow-lg transition-all">Start a test</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {entries.map((entry, i) => {
                const isMe = user?.id === entry.id;
                const badge = getRankBadge(entry.rank);
                return (
                  <div key={entry.id} className={`flex items-center gap-4 p-4 transition-colors animate-fade-in ${isMe ? 'bg-primary-500/5' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`} style={{ animationDelay: `${i * 0.03}s` }}>
                    <div className="w-10 text-center shrink-0">
                      {badge ? (
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${badge.bg} flex items-center justify-center mx-auto`}>
                          <span className="text-white font-bold text-sm">{entry.rank}</span>
                        </div>
                      ) : (
                        <span className="font-bold text-gray-400">{entry.rank}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {entry.username}
                        {isMe && <span className="text-primary-600 dark:text-primary-400 text-sm ml-2">(You)</span>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        <span className="flex items-center gap-1"><Target size={12} /> {entry.tests_completed} tests</span>
                        <span className="flex items-center gap-1"><TrendingUp size={12} /> {entry.correct_answers} correct</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Flame size={16} className="text-orange-500" />
                      <span className="font-bold text-orange-500 text-sm">{entry.current_streak}</span>
                    </div>
                    <div className="text-right shrink-0 w-20">
                      <div className="font-bold gradient-text">{entry.total_points.toLocaleString()}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">points</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            <ArrowLeft size={16} /> Back to dashboard
          </Link>
        </div>
      </main>
    </PageContainer>
  );
}

