import { motion } from 'framer-motion';
import { formatDistance, formatDuration, formatPace, formatCurrentPace } from '@/lib/formatters';

interface RunStatsDisplayProps {
  distance: number;
  duration: number;
  isLive?: boolean;
  currentPace?: number; // seconds per km (real-time)
}

export function RunStatsDisplay({ distance, duration, isLive = false, currentPace }: RunStatsDisplayProps) {
  // For live runs: show real-time pace if moving, otherwise show average if we have enough data
  // For completed runs: show average pace
  let displayPace: string;
  
  if (isLive) {
    if (currentPace !== undefined && currentPace > 0) {
      // Show real-time pace when actively moving
      displayPace = formatCurrentPace(currentPace);
    } else if (distance > 50 && duration > 10) {
      // Fall back to average pace if we have enough data
      displayPace = formatPace(distance, duration);
    } else {
      displayPace = '--:--';
    }
  } else {
    displayPace = formatPace(distance, duration);
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      <motion.div 
        className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 text-center shadow-lg shadow-gray-200/50 border border-white/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Distance</p>
        <p className={`text-2xl font-bold font-display ${isLive ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent' : 'text-gray-800'}`}>
          {formatDistance(distance)}
        </p>
      </motion.div>
      
      <motion.div 
        className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 text-center shadow-lg shadow-gray-200/50 border border-white/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Time</p>
        <p className={`text-2xl font-bold font-display ${isLive ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent' : 'text-gray-800'}`}>
          {formatDuration(duration)}
        </p>
      </motion.div>
      
      <motion.div 
        className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 text-center shadow-lg shadow-gray-200/50 border border-white/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
          {isLive ? 'Pace' : 'Avg Pace'}
        </p>
        <p className={`text-2xl font-bold font-display ${isLive ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent' : 'text-gray-800'}`}>
          {displayPace}
        </p>
        {isLive && <p className="text-[10px] text-gray-400 mt-0.5">/km</p>}
      </motion.div>
    </div>
  );
}
