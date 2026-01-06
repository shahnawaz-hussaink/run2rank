import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, MapPin, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/BottomNav';
import { TerritoryMap } from '@/components/TerritoryMap';
import { RunStatsDisplay } from '@/components/RunStatsDisplay';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useProfile } from '@/hooks/useProfile';
import { useRuns } from '@/hooks/useRuns';
import { useUserPresence } from '@/hooks/useUserPresence';
import { toast } from 'sonner';
import { calculateConvexHull, expandPolygon } from '@/lib/territoryUtils';

type RunState = 'idle' | 'ready' | 'running' | 'saving';

export default function RunPage() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { saveRun } = useRuns();
  const {
    currentPosition,
    error,
    isTracking,
    path,
    distance,
    getCurrentPosition,
    startTracking,
    stopTracking,
    resetTracking
  } = useGeolocation();

  const { nearbyUsers, updatePresence, clearPresence } = useUserPresence(profile?.pincode || null);

  const [runState, setRunState] = useState<RunState>('idle');
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate preview territory from current path
  const previewTerritory = useMemo(() => {
    if (path.length < 3) return undefined;
    const hull = calculateConvexHull(path);
    return expandPolygon(hull, 30);
  }, [path]);

  // Initialize position on mount
  useEffect(() => {
    const init = async () => {
      try {
        const pos = await getCurrentPosition();
        if (pos && profile?.pincode) {
          updatePresence(pos, false);
        }
        setRunState('ready');
      } catch (err) {
        console.error('Failed to get initial position:', err);
        // Still allow user to try starting
        setRunState('ready');
      }
    };
    init();

    return () => {
      clearPresence();
    };
  }, []);

  // Update presence while running
  useEffect(() => {
    if (isTracking && currentPosition && profile?.pincode) {
      updatePresence(currentPosition, true);
    }
  }, [currentPosition, isTracking, profile?.pincode]);

  // Timer effect
  useEffect(() => {
    if (isTracking && startTime) {
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
        setDuration(elapsed);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTracking, startTime]);

  const handleStartRun = useCallback(() => {
    if (!profile?.pincode) {
      toast.error('Please set your territory first', {
        action: {
          label: 'Set Now',
          onClick: () => navigate('/profile')
        }
      });
      return;
    }

    resetTracking();
    setDuration(0);
    setStartTime(new Date());
    startTracking();
    setRunState('running');
    toast.success('Run started! Go get it! 🏃');
  }, [profile, startTracking, resetTracking, navigate]);

  const handleStopRun = useCallback(async () => {
    const result = stopTracking();
    setRunState('saving');
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Update presence to not running
    if (currentPosition && profile?.pincode) {
      updatePresence(currentPosition, false);
    }

    if (result.path.length < 2) {
      toast.error('Run too short to save');
      setRunState('ready');
      return;
    }

    // Calculate territory polygon from path
    const territoryPolygon = result.path.length >= 3 
      ? expandPolygon(calculateConvexHull(result.path), 30)
      : [];

    // Save the run with territory
    const { error } = await saveRun({
      pincode: profile?.pincode || '',
      distance_meters: result.distance,
      duration_seconds: duration,
      path_coordinates: result.path,
      territory_polygon: territoryPolygon,
      started_at: startTime?.toISOString() || new Date().toISOString(),
      ended_at: new Date().toISOString(),
      is_valid: true
    });

    if (error) {
      toast.error('Failed to save run: ' + error.message);
      setRunState('ready');
    } else {
      toast.success(`Run saved! ${(result.distance / 1000).toFixed(2)}km completed! 🎉`);
      setRunState('ready');
      setDuration(0);
      setStartTime(null);
    }
  }, [stopTracking, duration, startTime, profile, saveRun, currentPosition, updatePresence]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 pb-24">
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-200/40 to-cyan-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-200/40 to-emerald-200/40 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="px-4 pt-6 pb-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl font-bold font-display text-gray-800">
              {runState === 'running' ? 'Running' : 'Start a Run'}
            </h1>
            {profile?.pincode && (
              <p className="text-gray-500 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Territory: {profile.pincode}
              </p>
            )}
          </motion.div>
        </div>

        {/* Map */}
        <div className="px-4 mb-4">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl overflow-hidden shadow-lg shadow-gray-200/50 border border-white/50">
            <TerritoryMap
              center={currentPosition || undefined}
              path={path}
              height="50vh"
              showCurrentLocation={true}
              isTracking={isTracking}
              pincode={profile?.pincode}
              showTerritories={true}
              previewTerritory={previewTerritory}
              nearbyUsers={nearbyUsers}
            />
          </div>
        </div>

        {/* Nearby runners indicator */}
        {nearbyUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mb-4"
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-xl p-3 shadow-lg shadow-gray-200/50 border border-white/50 flex items-center gap-2">
              <div className="flex -space-x-2">
                {nearbyUsers.slice(0, 3).map((user, i) => (
                  <div 
                    key={user.id} 
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white"
                  >
                    {user.username?.[0]?.toUpperCase() || '?'}
                  </div>
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {nearbyUsers.length} {nearbyUsers.length === 1 ? 'runner' : 'runners'} nearby
              </span>
            </div>
          </motion.div>
        )}

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-4 mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2"
            >
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Display */}
        <div className="px-4 mb-6">
          <RunStatsDisplay 
            distance={distance} 
            duration={duration}
            isLive={isTracking}
          />
        </div>

        {/* Control Button */}
        <div className="px-4">
          {runState === 'idle' && (
            <div className="text-center bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-white/50">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-2" />
              <p className="text-gray-500">Getting your location...</p>
            </div>
          )}

          {runState === 'ready' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Button 
                className="w-full h-20 text-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-2xl font-semibold shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-3"
                onClick={handleStartRun}
              >
                <Play className="w-8 h-8" />
                Start Run
              </Button>
            </motion.div>
          )}

          {runState === 'running' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Button 
                className="w-full h-20 text-xl bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-2xl font-semibold shadow-lg shadow-red-500/30 flex items-center justify-center gap-3"
                onClick={handleStopRun}
              >
                <Square className="w-8 h-8" />
                Stop Run
              </Button>
              <p className="text-center text-sm text-gray-500 mt-3 flex items-center justify-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                GPS tracking active
              </p>
            </motion.div>
          )}

          {runState === 'saving' && (
            <div className="text-center bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-white/50">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-2" />
              <p className="text-gray-500">Saving your run...</p>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
