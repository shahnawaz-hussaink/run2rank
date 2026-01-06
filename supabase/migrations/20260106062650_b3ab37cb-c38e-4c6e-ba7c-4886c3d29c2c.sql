-- Create health_data table for tracking user health metrics
CREATE TABLE public.health_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  height_cm NUMERIC,
  weight_kg NUMERIC,
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  daily_steps_goal INTEGER DEFAULT 10000,
  daily_calories_goal INTEGER,
  bmi NUMERIC GENERATED ALWAYS AS (
    CASE WHEN height_cm > 0 AND weight_kg > 0 
    THEN ROUND(weight_kg / ((height_cm / 100) * (height_cm / 100)), 2)
    ELSE NULL END
  ) STORED,
  bmr NUMERIC GENERATED ALWAYS AS (
    CASE 
      WHEN gender = 'male' AND weight_kg > 0 AND height_cm > 0 AND age > 0
      THEN ROUND(88.362 + (13.397 * weight_kg) + (4.799 * height_cm) - (5.677 * age), 0)
      WHEN gender = 'female' AND weight_kg > 0 AND height_cm > 0 AND age > 0  
      THEN ROUND(447.593 + (9.247 * weight_kg) + (3.098 * height_cm) - (4.330 * age), 0)
      ELSE NULL 
    END
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.health_data ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own health data" 
ON public.health_data 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health data" 
ON public.health_data 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health data" 
ON public.health_data 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_health_data_updated_at
BEFORE UPDATE ON public.health_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create user_presence table for live user tracking
CREATE TABLE public.user_presence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pincode TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_running BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Create policies - everyone in same pincode can see each other
CREATE POLICY "Users can view presence in same pincode" 
ON public.user_presence 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert own presence" 
ON public.user_presence 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presence" 
ON public.user_presence 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own presence" 
ON public.user_presence 
FOR DELETE 
USING (auth.uid() = user_id);

-- Enable realtime for runs table (for live territory updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.runs;

-- Enable realtime for user_presence
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;

-- Create index for faster presence queries
CREATE INDEX idx_user_presence_pincode ON public.user_presence(pincode);
CREATE INDEX idx_user_presence_last_seen ON public.user_presence(last_seen DESC);