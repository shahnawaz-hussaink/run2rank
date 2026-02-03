-- Add territory polygon column to runs table
ALTER TABLE public.runs 
ADD COLUMN IF NOT EXISTS territory_polygon jsonb DEFAULT '[]'::jsonb;

-- Create territories view for easy querying of latest territories per user/pincode
CREATE OR REPLACE VIEW public.pincode_territories AS
SELECT DISTINCT ON (user_id, pincode)
  id as run_id,
  user_id,
  pincode,
  territory_polygon,
  distance_meters,
  started_at,
  created_at
FROM public.runs
WHERE territory_polygon != '[]'::jsonb
  AND is_valid = true
ORDER BY user_id, pincode, started_at DESC;

-- Create index for faster territory queries
CREATE INDEX IF NOT EXISTS idx_runs_territory ON public.runs USING GIN (territory_polygon);
CREATE INDEX IF NOT EXISTS idx_runs_pincode_valid ON public.runs (pincode, is_valid) WHERE is_valid = true;