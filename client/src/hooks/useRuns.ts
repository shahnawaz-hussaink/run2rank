import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Run {
  id: string;
  user_id: string;
  pincode: string;
  distance_meters: number;
  duration_seconds: number;
  path_coordinates: Array<{ lat: number; lng: number }>;
  territory_polygon: Array<{ lat: number; lng: number }>;
  started_at: string;
  ended_at: string | null;
  is_valid: boolean;
  created_at: string;
}

export function useRuns() {
  const { user } = useAuth();
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setRuns([]);
      setLoading(false);
      return;
    }

    fetchRuns();
  }, [user]);

  const fetchRuns = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('runs')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });

      if (error) throw error;
      
      // Parse the JSON coordinates
      const parsedRuns = data?.map(run => ({
        ...run,
        distance_meters: Number(run.distance_meters),
        path_coordinates: typeof run.path_coordinates === 'string' 
          ? JSON.parse(run.path_coordinates) 
          : run.path_coordinates,
        territory_polygon: typeof run.territory_polygon === 'string'
          ? JSON.parse(run.territory_polygon)
          : (run.territory_polygon || [])
      })) || [];
      
      setRuns(parsedRuns);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveRun = async (runData: Omit<Run, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return { error: new Error('Not authenticated'), data: null };

    try {
      const { data, error } = await supabase
        .from('runs')
        .insert({
          user_id: user.id,
          pincode: runData.pincode,
          distance_meters: runData.distance_meters,
          duration_seconds: runData.duration_seconds,
          path_coordinates: runData.path_coordinates,
          territory_polygon: runData.territory_polygon || [],
          started_at: runData.started_at,
          ended_at: runData.ended_at,
          is_valid: runData.is_valid
        })
        .select()
        .single();

      if (error) throw error;

      await fetchRuns();
      return { error: null, data };
    } catch (err: any) {
      return { error: err, data: null };
    }
  };

  return { runs, loading, error, saveRun, refetch: fetchRuns };
}
