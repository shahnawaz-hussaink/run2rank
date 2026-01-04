import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, MapPin, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/BottomNav';
import { LeaderboardList } from '@/components/LeaderboardList';
import { useProfile } from '@/hooks/useProfile';
import { useLeaderboard } from '@/hooks/useLeaderboard';

export default function LeaderboardPage() {
  const { profile } = useProfile();
  const [searchPincode, setSearchPincode] = useState(profile?.pincode || '');
  const [activePincode, setActivePincode] = useState(profile?.pincode || '');
  const { leaderboard, loading } = useLeaderboard(activePincode);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchPincode.trim()) {
      setActivePincode(searchPincode.trim());
    }
  };

  const currentMonth = new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-1">
            <Trophy className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold font-display">Leaderboard</h1>
          </div>
          <p className="text-muted-foreground">{currentMonth}</p>
        </motion.div>
      </div>

      {/* Pincode Search */}
      <div className="px-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Enter pincode..."
              value={searchPincode}
              onChange={(e) => setSearchPincode(e.target.value)}
              className="pl-10 input-glow"
            />
          </div>
          <Button type="submit" variant="secondary">
            <Search className="w-4 h-4" />
          </Button>
        </form>
        {activePincode && (
          <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            Showing rankings for: <span className="text-primary font-medium">{activePincode}</span>
          </p>
        )}
      </div>

      {/* Leaderboard Content */}
      <div className="px-4">
        {!activePincode ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl p-8 text-center"
          >
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold mb-1">Enter a Pincode</p>
            <p className="text-sm text-muted-foreground">
              Search for a pincode to see the monthly rankings
            </p>
          </motion.div>
        ) : (
          <LeaderboardList entries={leaderboard} loading={loading} />
        )}
      </div>

      <BottomNav />
    </div>
  );
}
