
-- 1. Restrict challenge solutions/hints — drop public SELECT, add safe public view
DROP POLICY IF EXISTS "Anyone can view challenges" ON public.challenges;

CREATE POLICY "Public can view non-sensitive challenge fields"
ON public.challenges FOR SELECT
USING (true);

-- Revoke direct table access to sensitive cols via column grants
REVOKE SELECT ON public.challenges FROM anon, authenticated;
GRANT SELECT (id, title, description, youtube_url, is_daily, created_at, updated_at, expires_at, user_id, lab_type, lab_data, difficulty, challenge_type, objective, instructions, problem, attempt_count, completion_count, points)
  ON public.challenges TO anon, authenticated;
GRANT SELECT (hints, solution, solution_explanation) ON public.challenges TO authenticated;

-- Owners can also see their own full row via update path; create function to fetch solution after completion
CREATE OR REPLACE FUNCTION public.get_challenge_solution(_challenge_id uuid)
RETURNS TABLE(solution text, solution_explanation text, hints jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT c.solution, c.solution_explanation, c.hints
  FROM public.challenges c
  WHERE c.id = _challenge_id
    AND (
      c.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.challenge_participations p
        WHERE p.challenge_id = c.id
          AND p.user_id = auth.uid()
          AND p.completed_at IS NOT NULL
      )
    );
$$;

-- 2. Restrict badges INSERT to admins only
DROP POLICY IF EXISTS "Authenticated users can insert badges" ON public.badges;
CREATE POLICY "Admins can insert badges"
ON public.badges FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update badges"
ON public.badges FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete badges"
ON public.badges FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Restrict challenge_participations SELECT to owner
DROP POLICY IF EXISTS "Anyone can view participations" ON public.challenge_participations;
CREATE POLICY "Users can view their own participations"
ON public.challenge_participations FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 4. Add UPDATE policy for community-images storage bucket
CREATE POLICY "Users can update their own community images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'community-images' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'community-images' AND (auth.uid())::text = (storage.foldername(name))[1]);
