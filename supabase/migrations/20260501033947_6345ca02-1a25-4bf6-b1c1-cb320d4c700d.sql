-- Align course generation schema with application and edge function expectations.

-- Courses: metadata used by generation, public browsing, and sorting.
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'Intermediate',
  ADD COLUMN IF NOT EXISTS estimated_time text,
  ADD COLUMN IF NOT EXISTS subject_category text,
  ADD COLUMN IF NOT EXISTS completion_count integer DEFAULT 0;

UPDATE public.courses
SET completion_count = 0
WHERE completion_count IS NULL;

ALTER TABLE public.courses
  ALTER COLUMN completion_count SET DEFAULT 0;

-- Course modules: fields written by the generation function and read by CourseView.
ALTER TABLE public.course_modules
  ADD COLUMN IF NOT EXISTS real_world_application text,
  ADD COLUMN IF NOT EXISTS key_takeaways jsonb,
  ADD COLUMN IF NOT EXISTS lab_prompt text;

-- Course cache: the current generation function stores outline/modules directly.
ALTER TABLE public.course_cache
  ADD COLUMN IF NOT EXISTS outline jsonb,
  ADD COLUMN IF NOT EXISTS modules jsonb DEFAULT '{}'::jsonb;

ALTER TABLE public.course_cache
  ALTER COLUMN course_data DROP NOT NULL;

UPDATE public.course_cache
SET topic = COALESCE(NULLIF(topic, ''), topic_normalized),
    modules = COALESCE(modules, '{}'::jsonb)
WHERE topic IS NULL OR topic = '' OR modules IS NULL;

-- Lab cache: upserts require a unique conflict target and non-null topic.
UPDATE public.lab_cache
SET topic = COALESCE(NULLIF(topic, ''), topic_normalized)
WHERE topic IS NULL OR topic = '';

-- De-duplicate caches before adding uniqueness.
WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY topic_normalized ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC) AS rn
  FROM public.course_cache
)
DELETE FROM public.course_cache c
USING ranked r
WHERE c.id = r.id AND r.rn > 1;

WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY topic_normalized ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC) AS rn
  FROM public.lab_cache
)
DELETE FROM public.lab_cache l
USING ranked r
WHERE l.id = r.id AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS course_cache_topic_normalized_key
  ON public.course_cache(topic_normalized);

CREATE UNIQUE INDEX IF NOT EXISTS lab_cache_topic_normalized_key
  ON public.lab_cache(topic_normalized);

CREATE INDEX IF NOT EXISTS idx_courses_user_active_created
  ON public.courses(user_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_courses_user_deleted_created
  ON public.courses(user_id, created_at DESC)
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_course_modules_course_order
  ON public.course_modules(course_id, module_order);

CREATE INDEX IF NOT EXISTS idx_courses_public_subject
  ON public.courses(subject_category)
  WHERE is_public = true AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_courses_public_completion
  ON public.courses(completion_count DESC)
  WHERE is_public = true AND deleted_at IS NULL;

-- Ensure profile creation is idempotent and does not create courses for new users.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role, points, streak, bio)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'learner'),
    0,
    0,
    ''
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
    updated_at = now();
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'handle_new_user error for %: % %', NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_id_unique'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();