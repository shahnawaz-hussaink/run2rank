import { motion } from 'framer-motion';
import { Trophy, Medal, Award, User } from 'lucide-react';
import { LeaderboardEntry } from '@/hooks/useLeaderboard';
import { formatDistance } from '@/lib/formatters';
import { useAuth } from '@/contexts/AuthContext';

interface LeaderboardListProps {
  entries: LeaderboardEntry[];
  loading?: boolean;
}

export function LeaderboardList({ entries, loading }: LeaderboardListProps) {
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 animate-pulse shadow-lg shadow-gray-200/50 border border-white/50">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 text-center shadow-lg shadow-gray-200/50 border border-white/50">
        <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">No runners yet this month</p>
        <p className="text-sm text-gray-400 mt-1">Be the first to claim the top spot!</p>
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-amber-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 text-center text-gray-400 font-medium">{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200';
      case 3:
        return 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200';
      default:
        return 'border-white/50';
    }
  };

  return (
    <div className="space-y-3">
      {entries.map((entry, index) => {
        const isCurrentUser = user?.id === entry.user_id;
        
        return (
          <motion.div
            key={entry.user_id}
            className={`bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg shadow-gray-200/50 border ${getRankBg(entry.rank)} ${isCurrentUser ? 'ring-2 ring-emerald-500/50' : ''}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-8">
                {getRankIcon(entry.rank)}
              </div>
              
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-cyan-100 flex items-center justify-center overflow-hidden">
                {entry.avatar_url ? (
                  <img 
                    src={entry.avatar_url} 
                    alt={entry.username || 'User'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-emerald-600 font-bold">
                    {(entry.username?.[0] || 'U').toUpperCase()}
                  </span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate text-gray-800">
                  {entry.username || 'Anonymous'}
                  {isCurrentUser && <span className="text-emerald-600 ml-2">(You)</span>}
                </p>
                <p className="text-sm text-gray-500">
                  {entry.total_runs} run{entry.total_runs !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="text-right">
                <p className="font-bold text-lg font-display text-gray-800">
                  {formatDistance(entry.total_distance_meters)}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
