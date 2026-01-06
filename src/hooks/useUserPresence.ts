import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Coordinates } from './useGeolocation';

export interface UserPresence {
  id: string;
  user_id: string;
  pincode: string;
  latitude: number;
  longitude: number;
  last_seen: string;
  is_running: boolean;
  username?: string;
}

export function useUserPresence(pincode: string | null) {
  const { user } = useAuth();
  const [nearbyUsers, setNearbyUsers] = useState<UserPresence[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNearbyUsers = useCallback(async () => {
    if (!pincode) {
      setNearbyUsers([]);
      return;
    }

    try {
      setLoading(true);
      // Get users active in the last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data: presenceData, error } = await supabase
        .from('user_presence')
        .select('*')
        .eq('pincode', pincode)
        .gte('last_seen', fiveMinutesAgo);

      if (error) throw error;

      // Fetch usernames
      const userIds = presenceData?.map(p => p.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      const profileMap = new Map(profilesData?.map(p => [p.user_id, p.username]) || []);

      const usersWithNames = (presenceData || []).map(p => ({
        ...p,
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
        username: profileMap.get(p.user_id) || 'Runner'
      })).filter(p => p.user_id !== user?.id); // Exclude current user

      setNearbyUsers(usersWithNames);
    } catch (err) {
      console.error('Error fetching nearby users:', err);
    } finally {
      setLoading(false);
    }
  }, [pincode, user?.id]);

  const updatePresence = useCallback(async (position: Coordinates, isRunning: boolean = false) => {
    if (!user || !pincode) return;

    try {
      // Upsert presence
      const { data: existing } = await supabase
        .from('user_presence')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('user_presence')
          .update({
            pincode,
            latitude: position.lat,
            longitude: position.lng,
            last_seen: new Date().toISOString(),
            is_running: isRunning
          })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('user_presence')
          .insert({
            user_id: user.id,
            pincode,
            latitude: position.lat,
            longitude: position.lng,
            is_running: isRunning
          });
      }
    } catch (err) {
      console.error('Error updating presence:', err);
    }
  }, [user, pincode]);

  const clearPresence = useCallback(async () => {
    if (!user) return;

    try {
      await supabase
        .from('user_presence')
        .delete()
        .eq('user_id', user.id);
    } catch (err) {
      console.error('Error clearing presence:', err);
    }
  }, [user]);

  // Subscribe to real-time presence updates
  useEffect(() => {
    if (!pincode) return;

    fetchNearbyUsers();

    const channel = supabase
      .channel(`presence-${pincode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `pincode=eq.${pincode}`
        },
        () => {
          fetchNearbyUsers();
        }
      )
      .subscribe();

    // Refresh every 30 seconds
    const interval = setInterval(fetchNearbyUsers, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [pincode, fetchNearbyUsers]);

  return { nearbyUsers, loading, updatePresence, clearPresence, refetch: fetchNearbyUsers };
}
