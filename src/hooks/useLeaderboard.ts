import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LeaderboardEntry {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  total_distance_meters: number;
  total_runs: number;
  rank: number;
}

export function useLeaderboard(pincode: string) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentYearMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    if (!pincode) {
      setLeaderboard([]);
      setLoading(false);
      return;
    }

    fetchLeaderboard();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('leaderboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'monthly_stats',
          filter: `pincode=eq.${pincode}`
        },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pincode]);

  const fetchLeaderboard = async () => {
    if (!pincode) return;

    try {
      setLoading(true);
      
      // Get monthly stats for the pincode
      const { data: statsData, error: statsError } = await supabase
        .from('monthly_stats')
        .select('user_id, total_distance_meters, total_runs')
        .eq('pincode', pincode)
        .eq('year_month', currentYearMonth)
        .order('total_distance_meters', { ascending: false });

      if (statsError) throw statsError;

      if (!statsData || statsData.length === 0) {
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      // Get profiles for these users
      const userIds = statsData.map(s => s.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Merge data
      const leaderboardData: LeaderboardEntry[] = statsData.map((stat, index) => {
        const profile = profilesData?.find(p => p.user_id === stat.user_id);
        return {
          user_id: stat.user_id,
          username: profile?.username || 'Anonymous',
          avatar_url: profile?.avatar_url,
          total_distance_meters: Number(stat.total_distance_meters),
          total_runs: stat.total_runs,
          rank: index + 1
        };
      });

      setLeaderboard(leaderboardData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { leaderboard, loading, error, refetch: fetchLeaderboard };
}
