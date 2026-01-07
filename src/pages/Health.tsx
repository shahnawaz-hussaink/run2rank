import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Scale, Ruler, Activity, Target, Flame, Footprints, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BottomNav } from '@/components/BottomNav';
import { useHealthData } from '@/hooks/useHealthData';
import { useRuns } from '@/hooks/useRuns';
import { toast } from 'sonner';

export default function HealthPage() {
  const { healthData, loading, saveHealthData, calculateDailyCalories } = useHealthData();
  const { runs } = useRuns();
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    height_cm: '',
    weight_kg: '',
    age: '',
    gender: '',
    activity_level: '',
    daily_steps_goal: '10000'
  });

  useEffect(() => {
    if (healthData) {
      setFormData({
        height_cm: healthData.height_cm?.toString() || '',
        weight_kg: healthData.weight_kg?.toString() || '',
        age: healthData.age?.toString() || '',
        gender: healthData.gender || '',
        activity_level: healthData.activity_level || '',
        daily_steps_goal: healthData.daily_steps_goal?.toString() || '10000'
      });
    }
  }, [healthData]);

  const handleSave = async () => {
    if (!formData.height_cm || !formData.weight_kg || !formData.age || !formData.gender) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    const { error } = await saveHealthData({
      height_cm: parseFloat(formData.height_cm),
      weight_kg: parseFloat(formData.weight_kg),
      age: parseInt(formData.age),
      gender: formData.gender,
      activity_level: formData.activity_level || 'moderate',
      daily_steps_goal: parseInt(formData.daily_steps_goal) || 10000
    });

    if (error) {
      toast.error('Failed to save health data');
    } else {
      toast.success('Health data saved!');
    }
    setSaving(false);
  };

  // Calculate today's running distance
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayRuns = runs.filter(run => new Date(run.started_at) >= today);
  const todayDistance = todayRuns.reduce((sum, run) => sum + run.distance_meters, 0);
  
  // Estimate steps (rough estimate: 1km = ~1300 steps)
  const estimatedSteps = Math.round(todayDistance / 1000 * 1300);
  const dailyCalories = calculateDailyCalories(estimatedSteps, todayDistance);

  const getBmiCategory = (bmi: number | null): { label: string; color: string } => {
    if (!bmi) return { label: 'Not calculated', color: 'text-muted-foreground' };
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-amber-500' };
    if (bmi < 25) return { label: 'Normal', color: 'text-emerald-500' };
    if (bmi < 30) return { label: 'Overweight', color: 'text-amber-500' };
    return { label: 'Obese', color: 'text-red-500' };
  };

  const bmiCategory = getBmiCategory(healthData?.bmi || null);
  const stepsProgress = Math.min((estimatedSteps / (healthData?.daily_steps_goal || 10000)) * 100, 100);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-gradient-to-br from-emerald-50 via-white to-cyan-50">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-200/40 to-cyan-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-200/40 to-emerald-200/40 rounded-full blur-3xl" />
      </div>

      <div className="flex-1 relative z-10 pb-4">
        {/* Header */}
        <div className="px-4 pt-6 pb-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/30">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display text-gray-800">Health</h1>
              <p className="text-gray-500 text-sm">Track your fitness metrics</p>
            </div>
          </motion.div>
        </div>

        {/* Quick Stats */}
        <div className="px-4 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg shadow-gray-200/50 border border-white/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-orange-500" />
                </div>
                <span className="text-xs text-gray-500 font-medium">Today's Calories</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{dailyCalories}</p>
              <p className="text-xs text-gray-400">kcal burned</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg shadow-gray-200/50 border border-white/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                  <Footprints className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-xs text-gray-500 font-medium">Est. Steps</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{estimatedSteps.toLocaleString()}</p>
              <div className="mt-1">
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all"
                    style={{ width: `${stepsProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{Math.round(stepsProgress)}% of goal</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* BMI Card */}
        {healthData?.bmi && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-4 mb-6"
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg shadow-gray-200/50 border border-white/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Body Mass Index</p>
                  <p className="text-3xl font-bold text-gray-800">{healthData.bmi}</p>
                  <p className={`text-sm font-medium ${bmiCategory.color}`}>{bmiCategory.label}</p>
                </div>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 to-cyan-100 flex items-center justify-center">
                  <Scale className="w-8 h-8 text-emerald-600" />
                </div>
              </div>
              {healthData.bmr && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Basal Metabolic Rate: <span className="font-semibold text-gray-700">{healthData.bmr} kcal/day</span></p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Health Data Form */}
        <div className="px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-lg shadow-gray-200/50 border border-white/50"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              Your Metrics
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-gray-700 text-sm font-medium flex items-center gap-1">
                    <Ruler className="w-3.5 h-3.5" /> Height (cm)
                  </Label>
                  <Input
                    type="number"
                    placeholder="170"
                    value={formData.height_cm}
                    onChange={(e) => setFormData(prev => ({ ...prev, height_cm: e.target.value }))}
                    className="h-11 bg-gray-50/50 border-gray-200 rounded-xl focus:bg-white focus:border-emerald-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-700 text-sm font-medium flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5" /> Weight (kg)
                  </Label>
                  <Input
                    type="number"
                    placeholder="70"
                    value={formData.weight_kg}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight_kg: e.target.value }))}
                    className="h-11 bg-gray-50/50 border-gray-200 rounded-xl focus:bg-white focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-gray-700 text-sm font-medium">Age</Label>
                  <Input
                    type="number"
                    placeholder="25"
                    value={formData.age}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                    className="h-11 bg-gray-50/50 border-gray-200 rounded-xl focus:bg-white focus:border-emerald-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-700 text-sm font-medium">Gender</Label>
                  <Select value={formData.gender} onValueChange={(v) => setFormData(prev => ({ ...prev, gender: v as any }))}>
                    <SelectTrigger className="h-11 bg-gray-50/50 border-gray-200 rounded-xl focus:bg-white focus:border-emerald-400">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-gray-700 text-sm font-medium">Activity Level</Label>
                <Select value={formData.activity_level} onValueChange={(v) => setFormData(prev => ({ ...prev, activity_level: v as any }))}>
                  <SelectTrigger className="h-11 bg-gray-50/50 border-gray-200 rounded-xl focus:bg-white focus:border-emerald-400">
                    <SelectValue placeholder="Select your activity level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary (little/no exercise)</SelectItem>
                    <SelectItem value="light">Light (1-3 days/week)</SelectItem>
                    <SelectItem value="moderate">Moderate (3-5 days/week)</SelectItem>
                    <SelectItem value="active">Active (6-7 days/week)</SelectItem>
                    <SelectItem value="very_active">Very Active (athlete)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-gray-700 text-sm font-medium flex items-center gap-1">
                  <Target className="w-3.5 h-3.5" /> Daily Steps Goal
                </Label>
                <Input
                  type="number"
                  placeholder="10000"
                  value={formData.daily_steps_goal}
                  onChange={(e) => setFormData(prev => ({ ...prev, daily_steps_goal: e.target.value }))}
                  className="h-11 bg-gray-50/50 border-gray-200 rounded-xl focus:bg-white focus:border-emerald-400"
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/30"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                Save Health Data
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
