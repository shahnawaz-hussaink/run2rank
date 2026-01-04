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
        className="stat-card text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Distance</p>
        <p className={`text-2xl font-bold font-display ${isLive ? 'text-gradient' : 'text-foreground'}`}>
          {formatDistance(distance)}
        </p>
      </motion.div>
      
      <motion.div 
        className="stat-card text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Time</p>
        <p className={`text-2xl font-bold font-display ${isLive ? 'text-gradient' : 'text-foreground'}`}>
          {formatDuration(duration)}
        </p>
      </motion.div>
      
      <motion.div 
        className="stat-card text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Pace</p>
        <p className={`text-2xl font-bold font-display ${isLive ? 'text-gradient' : 'text-foreground'}`}>
          {formatPace(distance, duration)}
        </p>
      </motion.div>
    </div>
  );
}
