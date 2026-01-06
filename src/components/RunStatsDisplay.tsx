import { motion } from 'framer-motion';
import { formatDistance, formatDuration, formatPace } from '@/lib/formatters';

interface RunStatsDisplayProps {
  distance: number;
  duration: number;
  isLive?: boolean;
}

export function RunStatsDisplay({ distance, duration, isLive = false }: RunStatsDisplayProps) {
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
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Pace</p>
        <p className={`text-2xl font-bold font-display ${isLive ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent' : 'text-gray-800'}`}>
          {formatPace(distance, duration)}
        </p>
      </motion.div>
    </div>
  );
}
