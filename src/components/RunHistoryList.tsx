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
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 text-center shadow-lg shadow-gray-200/50 border border-white/50">
        <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">No runs yet</p>
        <p className="text-sm text-gray-400 mt-1">Start your first run to see it here!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {runs.map((run, index) => (
        <motion.div
          key={run.id}
          className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 cursor-pointer hover:bg-white transition-colors shadow-lg shadow-gray-200/50 border border-white/50"
          onClick={() => onRunClick?.(run)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-cyan-100 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-emerald-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-gray-800">{formatDistance(run.distance_meters)}</p>
                <span className="text-gray-300">•</span>
                <p className="text-gray-500">{formatDuration(run.duration_seconds)}</p>
              </div>
              <p className="text-sm text-gray-400">
                {formatDate(run.started_at)} at {formatTime(run.started_at)}
              </p>
            </div>
            
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
