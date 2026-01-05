import { useState, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Zap, Trophy, MapPin, Camera, User, Mail, Lock, Hash } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function AuthPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    pincode: ''
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-cyan-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center animate-pulse">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      if (!formData.email || !formData.password) {
        toast.error('Please fill in all fields');
        return;
      }
    } else {
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.pincode) {
        toast.error('Please fill in all required fields');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      if (!/^\d{5,6}$/.test(formData.pincode)) {
        toast.error('Please enter a valid pincode (5-6 digits)');
        return;
      }
    }

    setSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Welcome back!');
        }
      } else {
        const { error } = await signUp(formData.email, formData.password);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('This email is already registered. Try logging in.');
          } else {
            toast.error(error.message);
          }
        } else {
          // Update profile with name, pincode after signup
          const { data: { user: newUser } } = await supabase.auth.getUser();
          if (newUser) {
            await supabase
              .from('profiles')
              .update({
                username: formData.name,
                pincode: formData.pincode
              })
              .eq('user_id', newUser.id);
          }
          toast.success('Account created! Welcome to Run2Rank.');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 flex flex-col">
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-200/40 to-cyan-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-200/40 to-emerald-200/40 rounded-full blur-3xl" />
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto w-full"
        >
          {/* Logo */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
            >
              <Zap className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold font-display bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              Run2Rank
            </h1>
            <p className="text-gray-500">Claim your territory. Run to the top.</p>
          </div>

          {/* Features (only show on login) */}
          <AnimatePresence>
            {isLogin && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex justify-center gap-8 mb-6 overflow-hidden"
              >
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center shadow-sm">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-xs text-gray-500 font-medium">GPS Tracking</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-cyan-100 to-cyan-50 flex items-center justify-center shadow-sm">
                    <Trophy className="w-5 h-5 text-cyan-600" />
                  </div>
                  <p className="text-xs text-gray-500 font-medium">Leaderboards</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Auth Form Card */}
          <motion.div 
            layout
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-200/50 border border-white/50 p-6"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    key="signup-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    {/* Avatar Upload */}
                    <div className="flex justify-center mb-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="relative group"
                      >
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-cyan-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg transition-transform group-hover:scale-105">
                          {avatarPreview ? (
                            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                          ) : formData.name ? (
                            <span className="text-2xl font-bold text-emerald-600">{getInitials(formData.name)}</span>
                          ) : (
                            <User className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg border-2 border-white">
                          <Camera className="w-3.5 h-3.5 text-white" />
                        </div>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </div>
                    <p className="text-xs text-center text-gray-400 -mt-2">Optional: Add a profile photo</p>

                    {/* Name Field */}
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-gray-700 text-sm font-medium">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="name"
                          type="text"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="pl-10 h-12 bg-gray-50/50 border-gray-200 rounded-xl focus:bg-white focus:border-emerald-400 focus:ring-emerald-400/20 transition-all"
                          disabled={submitting}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Field */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-gray-700 text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-10 h-12 bg-gray-50/50 border-gray-200 rounded-xl focus:bg-white focus:border-emerald-400 focus:ring-emerald-400/20 transition-all"
                    disabled={submitting}
                  />
                </div>
              </div>
              
              {/* Password Field */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-gray-700 text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="pl-10 h-12 bg-gray-50/50 border-gray-200 rounded-xl focus:bg-white focus:border-emerald-400 focus:ring-emerald-400/20 transition-all"
                    disabled={submitting}
                  />
                </div>
              </div>

              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    key="signup-extra"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword" className="text-gray-700 text-sm font-medium">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          className="pl-10 h-12 bg-gray-50/50 border-gray-200 rounded-xl focus:bg-white focus:border-emerald-400 focus:ring-emerald-400/20 transition-all"
                          disabled={submitting}
                        />
                      </div>
                    </div>

                    {/* Pincode */}
                    <div className="space-y-1.5">
                      <Label htmlFor="pincode" className="text-gray-700 text-sm font-medium">Your Territory Pincode</Label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="pincode"
                          type="text"
                          placeholder="110001"
                          value={formData.pincode}
                          onChange={(e) => handleInputChange('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="pl-10 h-12 bg-gray-50/50 border-gray-200 rounded-xl focus:bg-white focus:border-emerald-400 focus:ring-emerald-400/20 transition-all"
                          disabled={submitting}
                          maxLength={6}
                        />
                      </div>
                      <p className="text-xs text-gray-400">This will be your running territory</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/30 transition-all hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5"
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : null}
                {isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setFormData({ name: '', email: '', password: '', confirmPassword: '', pincode: '' });
                  setAvatarPreview(null);
                  setAvatarFile(null);
                }}
                className="text-sm text-gray-500 hover:text-emerald-600 transition-colors font-medium"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </motion.div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-6">
            By continuing, you agree to our Terms of Service
          </p>
        </motion.div>
      </div>
    </div>
  );
}
