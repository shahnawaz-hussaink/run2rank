import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface HealthData {
  id: string;
  user_id: string;
  height_cm: number | null;
  weight_kg: number | null;
  age: number | null;
  gender: string | null;
  activity_level: string | null;
  daily_steps_goal: number;
  daily_calories_goal: number | null;
  bmi: number | null;
  bmr: number | null;
  created_at: string;
  updated_at: string;
}

export function useHealthData() {
  const { user } = useAuth();
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setHealthData(null);
      setLoading(false);
      return;
    }

    fetchHealthData();
  }, [user]);

  const fetchHealthData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('health_data')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setHealthData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveHealthData = async (data: Partial<Omit<HealthData, 'id' | 'user_id' | 'bmi' | 'bmr' | 'created_at' | 'updated_at'>>) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      // Check if health data exists
      const { data: existing } = await supabase
        .from('health_data')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('health_data')
          .update(data)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('health_data')
          .insert({
            user_id: user.id,
            ...data
          });

        if (error) throw error;
      }

      await fetchHealthData();
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  // Calculate estimated daily calories burned based on activity
  const calculateDailyCalories = (steps: number = 0, runningDistance: number = 0): number => {
    if (!healthData?.bmr) return 0;
    
    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };

    const multiplier = activityMultipliers[healthData.activity_level || 'sedentary'];
    const baseCalories = healthData.bmr * multiplier;
    
    // Steps burn approx 0.04 calories per step
    const stepCalories = steps * 0.04;
    
    // Running burns approx 60-80 calories per km depending on weight
    const weightFactor = (healthData.weight_kg || 70) / 70;
    const runningCalories = (runningDistance / 1000) * 70 * weightFactor;

    return Math.round(baseCalories + stepCalories + runningCalories);
  };

  return { 
    healthData, 
    loading, 
    error, 
    saveHealthData, 
    calculateDailyCalories,
    refetch: fetchHealthData 
  };
}
