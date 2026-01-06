import { useState, useEffect } from 'react';
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
  const [searchPincode, setSearchPincode] = useState('');
  const [activePincode, setActivePincode] = useState('');
  const { leaderboard, loading } = useLeaderboard(activePincode);

  // Initialize with user's pincode
  useEffect(() => {
    if (profile?.pincode && !activePincode) {
      setSearchPincode(profile.pincode);
      setActivePincode(profile.pincode);
    }
  }, [profile?.pincode]);

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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 pb-24">
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-amber-200/40 to-orange-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-orange-200/40 to-amber-200/40 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="px-4 pt-6 pb-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-display text-gray-800">Leaderboard</h1>
                <p className="text-gray-500 text-sm">{currentMonth}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Pincode Search */}
        <div className="px-4 mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Enter pincode..."
                value={searchPincode}
                onChange={(e) => setSearchPincode(e.target.value)}
                className="pl-10 h-11 bg-white/80 backdrop-blur-xl border-gray-200 rounded-xl focus:bg-white focus:border-amber-400"
              />
            </div>
            <Button 
              type="submit" 
              className="h-11 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl shadow-lg shadow-amber-500/30"
            >
              <Search className="w-4 h-4" />
            </Button>
          </form>
          {activePincode && (
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Showing rankings for: <span className="text-amber-600 font-medium">{activePincode}</span>
            </p>
          )}
        </div>

        {/* Leaderboard Content */}
        <div className="px-4">
          {!activePincode ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 text-center shadow-lg shadow-gray-200/50 border border-white/50"
            >
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="font-semibold text-gray-800 mb-1">Enter a Pincode</p>
              <p className="text-sm text-gray-500">
                Search for a pincode to see the monthly rankings
              </p>
            </motion.div>
          ) : (
            <LeaderboardList entries={leaderboard} loading={loading} />
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
