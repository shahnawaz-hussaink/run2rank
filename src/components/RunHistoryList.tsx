import { motion } from 'framer-motion';
import { MapPin, ChevronRight } from 'lucide-react';
import { Run } from '@/hooks/useRuns';
import { formatDistance, formatDuration, formatDate, formatTime } from '@/lib/formatters';

interface RunHistoryListProps {
  runs: Run[];
  onRunClick?: (run: Run) => void;
}

export function RunHistoryList({ runs, onRunClick }: RunHistoryListProps) {
  if (runs.length === 0) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No runs yet</p>
        <p className="text-sm text-muted-foreground mt-1">Start your first run to see it here!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {runs.map((run, index) => (
        <motion.div
          key={run.id}
          className="glass-card rounded-xl p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => onRunClick?.(run)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold">{formatDistance(run.distance_meters)}</p>
                <span className="text-muted-foreground">•</span>
                <p className="text-muted-foreground">{formatDuration(run.duration_seconds)}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(run.started_at)} at {formatTime(run.started_at)}
              </p>
            </div>
            
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
