import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Trophy, MapPin, TrendingUp, Zap, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/BottomNav';
import { TerritoryMap } from '@/components/TerritoryMap';
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
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <p className="text-muted-foreground text-sm">{greeting()}</p>
            <h1 className="text-2xl font-bold font-display">{username}</h1>
          </div>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Zap className="w-6 h-6 text-primary-foreground" />
          </div>
        </motion.div>
      </div>

      {/* Territory Map Preview */}
      {profile?.pincode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mx-4 mb-4"
        >
          <div className="glass-card rounded-2xl overflow-hidden">
            <TerritoryMap
              height="180px"
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
          <div className="glass-card rounded-2xl p-4 gradient-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your Territory</p>
                  <p className="font-bold text-lg font-display">{profile.pincode}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/profile')}
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
          <div className="glass-card rounded-2xl p-5 border-2 border-dashed border-primary/30">
            <div className="text-center">
              <MapPin className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="font-semibold mb-1">Claim Your Territory</p>
              <p className="text-sm text-muted-foreground mb-3">
                Set your pincode to start competing
              </p>
              <Button onClick={() => navigate('/profile')} className="btn-glow">
                Set Pincode
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Monthly Stats */}
      <div className="px-4 mb-6">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          This Month
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Distance</p>
            <p className="text-xl font-bold font-display text-gradient">
              {formatDistance(totalDistance)}
            </p>
          </motion.div>
          
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Time</p>
            <p className="text-xl font-bold font-display">
              {formatDuration(totalTime)}
            </p>
          </motion.div>
          
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Runs</p>
            <p className="text-xl font-bold font-display">{totalRuns}</p>
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
            className="w-full h-16 text-lg btn-glow flex items-center justify-center gap-3"
            onClick={() => navigate('/run')}
          >
            <Play className="w-6 h-6" />
            Start Running
          </Button>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button 
            variant="outline"
            className="w-full h-14 flex items-center justify-center gap-3"
            onClick={() => navigate('/leaderboard')}
          >
            <Trophy className="w-5 h-5" />
            View Leaderboard
          </Button>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Index;
