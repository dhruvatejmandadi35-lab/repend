-- Tighten cache insert policies; backend service calls bypass RLS, signed-in users remain allowed.
DROP POLICY IF EXISTS "Auth insert course_cache" ON public.course_cache;
CREATE POLICY "Signed-in users can create course cache entries"
ON public.course_cache
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth insert lab_cache" ON public.lab_cache;
CREATE POLICY "Signed-in users can create lab cache entries"
ON public.lab_cache
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Ensure helper functions use a stable schema search path.
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- The auth trigger invokes this internally; app clients should not call it directly.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;