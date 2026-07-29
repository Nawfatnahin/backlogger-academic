-- Add color_tag to tasks table for customization
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS color_tag TEXT NOT NULL DEFAULT 'slate';
