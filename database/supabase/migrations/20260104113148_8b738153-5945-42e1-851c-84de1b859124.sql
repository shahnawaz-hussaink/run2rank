-- Create profiles table for user data and pincode territory
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  avatar_url TEXT,
  pincode TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create runs table for tracking individual runs
CREATE TABLE public.runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pincode TEXT NOT NULL,
  distance_meters DECIMAL(10,2) NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  path_coordinates JSONB NOT NULL DEFAULT '[]'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  is_valid BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create monthly_stats table for leaderboard aggregation
CREATE TABLE public.monthly_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pincode TEXT NOT NULL,
  year_month TEXT NOT NULL, -- Format: '2025-01'
  total_distance_meters DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_runs INTEGER NOT NULL DEFAULT 0,
  total_duration_seconds INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, pincode, year_month)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_stats ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Runs policies
CREATE POLICY "Users can view own runs" ON public.runs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own runs" ON public.runs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own runs" ON public.runs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own runs" ON public.runs
  FOR DELETE USING (auth.uid() = user_id);

-- Monthly stats policies (viewable by all for leaderboard)
CREATE POLICY "Anyone can view monthly stats" ON public.monthly_stats
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own stats" ON public.monthly_stats
  FOR ALL USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_monthly_stats_updated_at
  BEFORE UPDATE ON public.monthly_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup - creates profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

-- Trigger on auth.users for new signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update monthly stats when a run is completed
CREATE OR REPLACE FUNCTION public.update_monthly_stats_on_run()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  year_month_val TEXT;
BEGIN
  year_month_val := to_char(NEW.started_at, 'YYYY-MM');
  
  INSERT INTO public.monthly_stats (user_id, pincode, year_month, total_distance_meters, total_runs, total_duration_seconds)
  VALUES (NEW.user_id, NEW.pincode, year_month_val, NEW.distance_meters, 1, NEW.duration_seconds)
  ON CONFLICT (user_id, pincode, year_month)
  DO UPDATE SET
    total_distance_meters = monthly_stats.total_distance_meters + NEW.distance_meters,
    total_runs = monthly_stats.total_runs + 1,
    total_duration_seconds = monthly_stats.total_duration_seconds + NEW.duration_seconds,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Trigger to update monthly stats when run is inserted
CREATE TRIGGER on_run_created
  AFTER INSERT ON public.runs
  FOR EACH ROW
  WHEN (NEW.is_valid = true)
  EXECUTE FUNCTION public.update_monthly_stats_on_run();

-- Enable realtime for leaderboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.monthly_stats;