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
        await getCurrentPosition();
        setRunState('ready');
      } catch (err) {
        console.error('Failed to get initial position:', err);
      }
    };
    init();
  }, []);

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
  }, [stopTracking, duration, startTime, profile, saveRun]);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold font-display">
            {runState === 'running' ? 'Running' : 'Start a Run'}
          </h1>
          {profile?.pincode && (
            <p className="text-muted-foreground flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Territory: {profile.pincode}
            </p>
          )}
        </motion.div>
      </div>

      {/* Map */}
      <div className="px-4 mb-4">
        <TerritoryMap
          center={currentPosition || undefined}
          path={path}
          height="40vh"
          showCurrentLocation={true}
          isTracking={isTracking}
          pincode={profile?.pincode}
          showTerritories={true}
          previewTerritory={previewTerritory}
        />
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-4 mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
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
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
            <p className="text-muted-foreground">Getting your location...</p>
          </div>
        )}

        {runState === 'ready' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Button 
              className="w-full h-20 text-xl btn-glow flex items-center justify-center gap-3"
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
              variant="destructive"
              className="w-full h-20 text-xl flex items-center justify-center gap-3"
              onClick={handleStopRun}
            >
              <Square className="w-8 h-8" />
              Stop Run
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-3">
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse mr-2" />
              GPS tracking active
            </p>
          </motion.div>
        )}

        {runState === 'saving' && (
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
            <p className="text-muted-foreground">Saving your run...</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
