import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, MapPin, LogOut, Save, Loader2, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BottomNav } from '@/components/BottomNav';
import { RunHistoryList } from '@/components/RunHistoryList';
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
  
  const [username, setUsername] = useState(profile?.username || '');
  const [pincode, setPincode] = useState(profile?.pincode || '');
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

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <User className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display">
                {profile?.username?.split('@')[0] || 'Runner'}
              </h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </motion.div>
      </div>

      {/* Total Stats */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Distance</p>
            <p className="text-2xl font-bold font-display text-gradient">
              {formatDistance(totalDistance)}
            </p>
          </motion.div>
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Time</p>
            <p className="text-2xl font-bold font-display">
              {formatDuration(totalTime)}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Profile Settings */}
      <div className="px-4 mb-6">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Profile Settings
        </h2>
        <motion.div 
          className="glass-card rounded-xl p-4 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="space-y-2">
            <Label htmlFor="username">Display Name</Label>
            <Input
              id="username"
              placeholder="Your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-glow"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pincode" className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Your Territory (Pincode)
            </Label>
            <Input
              id="pincode"
              placeholder="e.g., 10001"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              className="input-glow"
            />
            <p className="text-xs text-muted-foreground">
              Only runs in this pincode will count towards the leaderboard
            </p>
          </div>

          <Button 
            onClick={handleSave} 
            className="w-full btn-glow"
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
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Run History
        </h2>
        {runsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <RunHistoryList 
            runs={runs.slice(0, 10)} 
            onRunClick={(run) => setSelectedRun(run)} 
          />
        )}
      </div>

      {/* Run Detail Dialog */}
      <Dialog open={!!selectedRun} onOpenChange={() => setSelectedRun(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Run Details</DialogTitle>
          </DialogHeader>
          {selectedRun && (
            <div className="space-y-4">
              <RunMap
                path={selectedRun.path_coordinates}
                height="200px"
                showCurrentLocation={false}
              />
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Distance</p>
                  <p className="font-bold text-lg">{formatDistance(selectedRun.distance_meters)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="font-bold text-lg">{formatDuration(selectedRun.duration_seconds)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Territory</p>
                  <p className="font-bold text-lg">{selectedRun.pincode}</p>
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
