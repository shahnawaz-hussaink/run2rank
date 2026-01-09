import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Scale, Ruler, Activity, Target, Flame, Footprints, Save, Loader2, Droplets, TrendingUp, Zap, Award, Plus, Minus, Utensils, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BottomNav } from '@/components/BottomNav';
import { PageHeader } from '@/components/PageHeader';
import { useHealthData } from '@/hooks/useHealthData';
import { useRuns } from '@/hooks/useRuns';
import { toast } from 'sonner';

export default function HealthPage() {
  const navigate = useNavigate();
  const { healthData, loading, saveHealthData, calculateDailyCalories } = useHealthData();
  const { runs } = useRuns();
  const [saving, setSaving] = useState(false);
  const [waterGlasses, setWaterGlasses] = useState(0);
  
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

  // Weekly stats
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekRuns = runs.filter(run => new Date(run.started_at) >= weekAgo);
  const weekDistance = weekRuns.reduce((sum, run) => sum + run.distance_meters, 0);
  const weekCalories = weekRuns.length * 300; // Rough estimate

  // Water tracking
  const waterGoal = 8;
  const waterProgress = (waterGlasses / waterGoal) * 100;

  const getBmiCategory = (bmi: number | null): { label: string; color: string } => {
    if (!bmi) return { label: 'Not calculated', color: 'text-muted-foreground' };
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-amber-500' };
    if (bmi < 25) return { label: 'Normal', color: 'text-emerald-500' };
    if (bmi < 30) return { label: 'Overweight', color: 'text-amber-500' };
    return { label: 'Obese', color: 'text-red-500' };
  };

  const bmiCategory = getBmiCategory(healthData?.bmi || null);
  const stepsProgress = Math.min((estimatedSteps / (healthData?.daily_steps_goal || 10000)) * 100, 100);

  // Heart rate zones (mock data for premium feature showcase)
  const heartRateZones = [
    { zone: 'Rest', range: '50-60%', color: 'bg-blue-400', width: 20 },
    { zone: 'Fat Burn', range: '60-70%', color: 'bg-green-400', width: 30 },
    { zone: 'Cardio', range: '70-80%', color: 'bg-yellow-400', width: 35 },
    { zone: 'Peak', range: '80-90%', color: 'bg-red-400', width: 15 },
  ];

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
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-rose-200/40 to-pink-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-200/40 to-rose-200/40 rounded-full blur-3xl" />
      </div>

      <div className="flex-1 relative z-10 pb-4">
        {/* Header */}
        <PageHeader 
          title="Health"
          subtitle="Track your fitness metrics"
          icon={Heart}
          iconGradient="from-rose-500 to-pink-500"
        />

        {/* Premium Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-4 mb-4"
        >
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-2xl p-[1px]">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span className="font-semibold text-gray-800">Health Pro</span>
              </div>
              <span className="text-xs bg-gradient-to-r from-amber-500 to-rose-500 text-white px-3 py-1 rounded-full font-medium">
                Free Trial
              </span>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="px-4 mb-4">
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

        {/* Water Tracking */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-4 mb-4"
        >
          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 backdrop-blur-xl rounded-2xl p-4 shadow-lg shadow-blue-200/30 border border-cyan-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Water Intake</p>
                  <p className="text-xs text-gray-500">{waterGlasses}/{waterGoal} glasses today</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-xl border-gray-200"
                  onClick={() => setWaterGlasses(Math.max(0, waterGlasses - 1))}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  className="h-9 w-9 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500"
                  onClick={() => setWaterGlasses(Math.min(12, waterGlasses + 1))}
                >
                  <Plus className="w-4 h-4 text-white" />
                </Button>
              </div>
            </div>
            <div className="w-full h-2 bg-white rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${waterProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </motion.div>

        {/* Weekly Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mx-4 mb-4"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg shadow-gray-200/50 border border-white/50">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <h3 className="font-semibold text-gray-800">Weekly Insights</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Distance</p>
                <p className="text-lg font-bold text-gray-800">{(weekDistance / 1000).toFixed(1)}km</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Runs</p>
                <p className="text-lg font-bold text-gray-800">{weekRuns.length}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Calories</p>
                <p className="text-lg font-bold text-gray-800">{weekCalories}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Heart Rate Zones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mx-4 mb-4"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg shadow-gray-200/50 border border-white/50">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-rose-500" />
              <h3 className="font-semibold text-gray-800">Heart Rate Zones</h3>
              <span className="text-xs bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full ml-auto">Pro</span>
            </div>
            <div className="space-y-3">
              {heartRateZones.map((zone, i) => (
                <div key={zone.zone} className="flex items-center gap-3">
                  <div className="w-16 text-xs text-gray-600">{zone.zone}</div>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full ${zone.color} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${zone.width}%` }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                    />
                  </div>
                  <div className="w-14 text-xs text-gray-500 text-right">{zone.range}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* BMI & Form Section */}
        <div className="px-4 space-y-4">
          {/* BMI Card */}
          {healthData?.bmi && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
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
                
                {/* Nutrition Recommendation Button - shows for underweight or overweight */}
                {(healthData.bmi < 18.5 || healthData.bmi >= 25) && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    onClick={() => navigate('/nutrition')}
                    className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-xl p-3 flex items-center justify-between shadow-lg shadow-emerald-500/20 transition-all hover:shadow-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                        <Utensils className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-sm">Get Nutrition Tips</p>
                        <p className="text-xs text-white/80">
                          {healthData.bmi < 18.5 ? 'Foods to help gain healthy weight' : 'Foods to help achieve ideal BMI'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/80" />
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}

          {/* Health Data Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
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
