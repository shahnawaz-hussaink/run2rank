-- Drop the security definer view and recreate with proper security
DROP VIEW IF EXISTS public.pincode_territories;

-- Recreate view with SECURITY INVOKER (default, but explicit)
CREATE VIEW public.pincode_territories 
WITH (security_invoker = true) AS
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