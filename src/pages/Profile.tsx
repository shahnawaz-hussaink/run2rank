import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, MapPin, LogOut, Save, Loader2, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BottomNav } from '@/components/BottomNav';
import { RunHistoryList } from '@/components/RunHistoryList';
import { UserAvatar } from '@/components/UserAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useRuns, Run } from '@/hooks/useRuns';
import { formatDistance, formatDuration } from '@/lib/formatters';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RunMap } from '@/components/RunMap';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { runs, loading: runsLoading } = useRuns();
  
  const [username, setUsername] = useState('');
  const [pincode, setPincode] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedRun, setSelectedRun] = useState<Run | null>(null);

  // Sync state when profile loads
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setPincode(profile.pincode || '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!pincode.trim()) {
      toast.error('Please enter a pincode');
      return;
    }

    setSaving(true);
    const { error } = await updateProfile({
      username: username.trim() || user?.email || 'Runner',
      pincode: pincode.trim()
    });

    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated!');
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
    toast.success('Signed out successfully');
  };

  // Calculate total stats
  const totalDistance = runs.reduce((sum, run) => sum + run.distance_meters, 0);
  const totalTime = runs.reduce((sum, run) => sum + run.duration_seconds, 0);
  const totalRuns = runs.length;

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
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <UserAvatar 
                name={profile?.username || user?.email || 'User'} 
                size="lg"
              />
              <div>
                <h1 className="text-xl font-bold font-display text-gray-800">
                  {profile?.username?.split('@')[0] || 'Runner'}
                </h1>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSignOut}
              className="text-gray-500 hover:text-red-500 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>

        {/* Total Stats */}
        <div className="px-4 mb-6">
          <div className="grid grid-cols-3 gap-3">
            <motion.div 
              className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg shadow-gray-200/50 border border-white/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Distance</p>
              <p className="text-xl font-bold font-display bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                {formatDistance(totalDistance)}
              </p>
            </motion.div>
            <motion.div 
              className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg shadow-gray-200/50 border border-white/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Time</p>
              <p className="text-xl font-bold font-display text-gray-800">
                {formatDuration(totalTime)}
              </p>
            </motion.div>
            <motion.div 
              className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg shadow-gray-200/50 border border-white/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Runs</p>
              <p className="text-xl font-bold font-display text-gray-800">{totalRuns}</p>
            </motion.div>
          </div>
        </div>

        {/* Profile Settings */}
        <div className="px-4 mb-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-800">
            <User className="w-5 h-5 text-emerald-500" />
            Profile Settings
          </h2>
          <motion.div 
            className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-lg shadow-gray-200/50 border border-white/50 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-gray-700 text-sm font-medium">Display Name</Label>
              <Input
                id="username"
                placeholder="Your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11 bg-gray-50/50 border-gray-200 rounded-xl focus:bg-white focus:border-emerald-400"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="pincode" className="flex items-center gap-2 text-gray-700 text-sm font-medium">
                <MapPin className="w-4 h-4 text-emerald-500" />
                Your Territory (Pincode)
              </Label>
              <Input
                id="pincode"
                placeholder="e.g., 10001"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="h-11 bg-gray-50/50 border-gray-200 rounded-xl focus:bg-white focus:border-emerald-400"
              />
              <p className="text-xs text-gray-400">
                Only runs in this pincode will count towards the leaderboard
              </p>
            </div>

            <Button 
              onClick={handleSave} 
              className="w-full h-11 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/30"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </motion.div>
        </div>

        {/* Run History */}
        <div className="px-4">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-800">
            <History className="w-5 h-5 text-emerald-500" />
            Run History
          </h2>
          {runsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          ) : (
            <RunHistoryList 
              runs={runs.slice(0, 10)} 
              onRunClick={(run) => setSelectedRun(run)} 
            />
          )}
        </div>
      </div>

      {/* Run Detail Dialog */}
      <Dialog open={!!selectedRun} onOpenChange={() => setSelectedRun(null)}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-800">Run Details</DialogTitle>
          </DialogHeader>
          {selectedRun && (
            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden">
                <RunMap
                  path={selectedRun.path_coordinates}
                  height="200px"
                  showCurrentLocation={false}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Distance</p>
                  <p className="font-bold text-lg text-gray-800">{formatDistance(selectedRun.distance_meters)}</p>
                </div>
                <div className="text-center bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Time</p>
                  <p className="font-bold text-lg text-gray-800">{formatDuration(selectedRun.duration_seconds)}</p>
                </div>
                <div className="text-center bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Territory</p>
                  <p className="font-bold text-lg text-gray-800">{selectedRun.pincode}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
