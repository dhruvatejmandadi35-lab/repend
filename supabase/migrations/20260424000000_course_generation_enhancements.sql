-- Course generation enhancements: richer metadata + module fields

-- courses: difficulty, estimated_time, subject_category, completion_count
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'Intermediate';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS estimated_time TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS subject_category TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS completion_count INTEGER DEFAULT 0;

-- course_modules: real_world_application, key_takeaways, lab_prompt
ALTER TABLE public.course_modules ADD COLUMN IF NOT EXISTS real_world_application TEXT;
ALTER TABLE public.course_modules ADD COLUMN IF NOT EXISTS key_takeaways JSONB;
ALTER TABLE public.course_modules ADD COLUMN IF NOT EXISTS lab_prompt TEXT;

-- Index for subject filtering on explore page
CREATE INDEX IF NOT EXISTS idx_courses_subject_category
  ON public.courses(subject_category)
  WHERE is_public = true AND deleted_at IS NULL;

-- Index for sorting by completion_count
CREATE INDEX IF NOT EXISTS idx_courses_completion_count
  ON public.courses(completion_count DESC)
  WHERE is_public = true AND deleted_at IS NULL;
