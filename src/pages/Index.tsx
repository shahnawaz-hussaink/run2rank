import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Trophy, MapPin, TrendingUp, Zap, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/BottomNav';
import { TerritoryMap } from '@/components/TerritoryMap';
import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useRuns } from '@/hooks/useRuns';
import { formatDistance, formatDuration } from '@/lib/formatters';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { runs } = useRuns();
  
  // Calculate stats
  const thisMonthRuns = runs.filter(run => {
    const runDate = new Date(run.started_at);
    const now = new Date();
    return runDate.getMonth() === now.getMonth() && runDate.getFullYear() === now.getFullYear();
  });
  
  const totalDistance = thisMonthRuns.reduce((sum, run) => sum + run.distance_meters, 0);
  const totalTime = thisMonthRuns.reduce((sum, run) => sum + run.duration_seconds, 0);
  const totalRuns = thisMonthRuns.length;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const username = profile?.username?.split('@')[0] || 'Runner';

  return (
    <div className="flex flex-col min-h-full bg-gradient-to-br from-emerald-50 via-white to-cyan-50">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-200/40 to-cyan-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-200/40 to-emerald-200/40 rounded-full blur-3xl" />
      </div>

      <div className="flex-1 relative z-10 pb-4">
        {/* Header */}
        <PageHeader 
          title={username}
          subtitle={greeting()}
          icon={Zap}
          iconGradient="from-emerald-500 to-cyan-500"
        />

        {/* Territory Map Preview */}
        {profile?.pincode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="mx-4 mb-4"
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl overflow-hidden shadow-lg shadow-gray-200/50 border border-white/50">
              <TerritoryMap
                height="280px"
                pincode={profile.pincode}
                showTerritories={true}
                showCurrentLocation={false}
                zoom={13}
              />
            </div>
          </motion.div>
        )}

        {/* Territory Card */}
        {profile?.pincode ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="mx-4 mb-6"
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg shadow-gray-200/50 border border-white/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Your Territory</p>
                    <p className="font-bold text-lg font-display text-gray-800">{profile.pincode}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/profile')}
                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                >
                  Change
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="mx-4 mb-6"
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 border-2 border-dashed border-emerald-300 shadow-lg">
              <div className="text-center">
                <MapPin className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-gray-800 mb-1">Claim Your Territory</p>
                <p className="text-sm text-gray-500 mb-3">
                  Set your pincode to start competing
                </p>
                <Button 
                  onClick={() => navigate('/profile')} 
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-lg shadow-emerald-500/30"
                >
                  Set Pincode
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Monthly Stats */}
        <div className="px-4 mb-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-800">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            This Month
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <motion.div 
              className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg shadow-gray-200/50 border border-white/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Distance</p>
              <p className="text-xl font-bold font-display bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                {formatDistance(totalDistance)}
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg shadow-gray-200/50 border border-white/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Time</p>
              <p className="text-xl font-bold font-display text-gray-800">
                {formatDuration(totalTime)}
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg shadow-gray-200/50 border border-white/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Runs</p>
              <p className="text-xl font-bold font-display text-gray-800">{totalRuns}</p>
            </motion.div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 space-y-3">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button 
              className="w-full h-16 text-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-2xl font-semibold shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-3"
              onClick={() => navigate('/run')}
            >
              <Play className="w-6 h-6" />
              Start Running
            </Button>
          </motion.div>
          
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button 
                variant="outline"
                className="w-full h-14 flex items-center justify-center gap-2 bg-white/80 backdrop-blur-xl border-gray-200 hover:bg-white text-gray-700 rounded-xl"
                onClick={() => navigate('/leaderboard')}
              >
                <Trophy className="w-5 h-5 text-amber-500" />
                Leaderboard
              </Button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button 
                variant="outline"
                className="w-full h-14 flex items-center justify-center gap-2 bg-white/80 backdrop-blur-xl border-gray-200 hover:bg-white text-gray-700 rounded-xl"
                onClick={() => navigate('/health')}
              >
                <Heart className="w-5 h-5 text-rose-500" />
                Health
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Index;
