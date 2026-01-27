-- Migration: Add Organization Portal and Leads support
-- Run this in the Supabase SQL Editor

-- 1. Extend Resources Table
ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS owner_id uuid references auth.users,
ADD COLUMN IF NOT EXISTS scrape_url text,
ADD COLUMN IF NOT EXISTS programs jsonb default '[]'::jsonb,
ADD COLUMN IF NOT EXISTS website text;

-- 2. Create Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references public.resources not null,
  user_id uuid references auth.users not null, -- The seeker
  status text not null default 'new', -- 'new', 'contacted', 'enrolled', 'closed'
  notes text,
  created_at timestamptz default now()
);

-- 3. Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 4. Policies
-- Allow Org Owners to view their leads
CREATE POLICY "Org Owners can view leads" ON public.leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.resources
      WHERE resources.id = leads.resource_id
      AND resources.owner_id = auth.uid()
    )
  );

-- Allow Org Owners to update their leads
CREATE POLICY "Org Owners can update leads" ON public.leads
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.resources
      WHERE resources.id = leads.resource_id
      AND resources.owner_id = auth.uid()
    )
  );
