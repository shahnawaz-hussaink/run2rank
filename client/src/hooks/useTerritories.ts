import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Coordinates } from '@/hooks/useGeolocation';
import { getUserTerritoryColor } from '@/lib/territoryUtils';

export interface Territory {
  run_id: string;
  user_id: string;
  pincode: string;
  territory_polygon: Coordinates[];
  distance_meters: number;
  started_at: string;
  username?: string;
  color: string;
}

export function useTerritories(pincode: string | null) {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTerritories = async () => {
    if (!pincode) {
      setTerritories([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch all runs with territories for this pincode
      const { data: runsData, error: runsError } = await supabase
        .from('runs')
        .select('id, user_id, pincode, territory_polygon, distance_meters, started_at')
        .eq('pincode', pincode)
        .eq('is_valid', true)
        .not('territory_polygon', 'eq', '[]')
        .order('started_at', { ascending: false });

      if (runsError) throw runsError;

      // Get unique user territories (latest per user)
      const userTerritoryMap = new Map<string, typeof runsData[0]>();
      runsData?.forEach(run => {
        if (!userTerritoryMap.has(run.user_id)) {
          userTerritoryMap.set(run.user_id, run);
        }
      });

      const uniqueRuns = Array.from(userTerritoryMap.values());

      // Fetch usernames for the territories
      const userIds = uniqueRuns.map(r => r.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      const profileMap = new Map(profilesData?.map(p => [p.user_id, p.username]) || []);

      const territoriesWithMeta: Territory[] = uniqueRuns.map(run => {
        // Parse territory polygon from JSON
        let polygon: Coordinates[] = [];
        if (Array.isArray(run.territory_polygon)) {
          polygon = run.territory_polygon.map(p => {
            const point = p as { lat?: number; lng?: number };
            return { lat: point.lat || 0, lng: point.lng || 0 };
          });
        }
        
        return {
          run_id: run.id,
          user_id: run.user_id,
          pincode: run.pincode,
          territory_polygon: polygon,
          distance_meters: Number(run.distance_meters),
          started_at: run.started_at,
          username: profileMap.get(run.user_id) || 'Runner',
          color: getUserTerritoryColor(run.user_id)
        };
      });

      setTerritories(territoriesWithMeta);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerritories();

    // Subscribe to realtime updates
    if (pincode) {
      const channel = supabase
        .channel(`territories-${pincode}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'runs',
            filter: `pincode=eq.${pincode}`
          },
          () => {
            fetchTerritories();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [pincode]);

  return { territories, loading, error, refetch: fetchTerritories };
}
