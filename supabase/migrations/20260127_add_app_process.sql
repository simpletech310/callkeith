-- Add application_process to resources table
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS application_process text;
