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
          <div key={i} className="glass-card rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-muted" />
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-24 mb-2" />
                <div className="h-3 bg-muted rounded w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No runners yet this month</p>
        <p className="text-sm text-muted-foreground mt-1">Be the first to claim the top spot!</p>
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 text-center text-muted-foreground font-medium">{rank}</span>;
    }
  };

  const getRankClass = (rank: number) => {
    switch (rank) {
      case 1:
        return 'rank-gold';
      case 2:
        return 'rank-silver';
      case 3:
        return 'rank-bronze';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-3">
      {entries.map((entry, index) => {
        const isCurrentUser = user?.id === entry.user_id;
        
        return (
          <motion.div
            key={entry.user_id}
            className={`glass-card rounded-xl p-4 ${isCurrentUser ? 'ring-1 ring-primary/50' : ''}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-8">
                {getRankIcon(entry.rank)}
              </div>
              
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {entry.avatar_url ? (
                  <img 
                    src={entry.avatar_url} 
                    alt={entry.username || 'User'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate ${getRankClass(entry.rank)}`}>
                  {entry.username || 'Anonymous'}
                  {isCurrentUser && <span className="text-primary ml-2">(You)</span>}
                </p>
                <p className="text-sm text-muted-foreground">
                  {entry.total_runs} run{entry.total_runs !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="text-right">
                <p className="font-bold text-lg font-display">
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
