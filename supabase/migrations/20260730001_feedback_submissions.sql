-- Create feedback_submissions table for user bug reports and feature requests
CREATE TABLE IF NOT EXISTS public.feedback_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.feedback_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can submit feedback
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can submit feedback' AND tablename = 'feedback_submissions') THEN
        CREATE POLICY "Anyone can submit feedback" ON public.feedback_submissions FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage feedback' AND tablename = 'feedback_submissions') THEN
        CREATE POLICY "Admins can manage feedback" ON public.feedback_submissions FOR ALL USING (true);
    END IF;
END $$;
