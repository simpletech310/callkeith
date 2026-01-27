-- Enable Vector extension for RAG
create extension if not exists vector;

-- RESOURCES TABLE
-- Stores humanitarian resources scraped by Agent Delta
create table public.resources (
  id uuid primary key default gen_random_uuid(),
  category text not null, -- 'food', 'housing', 'legal', 'health'
  name text not null,
  description text,
  contact_info jsonb default '{}'::jsonb, -- { phone, email, website }
  location jsonb default '{}'::jsonb, -- { address, lat, long }
  suitability_tags text[] default array[]::text[], -- ['families', 'veterans', 'spanish-speakers']
  embedding vector(768), -- For Gemini embedding
  created_at timestamptz default now(),
  
  -- Organization Portal Extensions
  owner_id uuid references auth.users, -- The Org Admin
  scrape_url text, -- The URL they want to scrape
  programs jsonb default '[]'::jsonb, -- Array of program objects
  website text -- Official website
);

-- LEADS TABLE
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references public.resources not null,
  user_id uuid references auth.users not null, -- The seeker
  status text not null default 'new', -- 'new', 'contacted', 'enrolled', 'closed'
  notes text,
  created_at timestamptz default now()
);

-- Enable RLS on Leads
alter table public.leads enable row level security;

-- Leads Policy: Org Owners can see leads for their resources
create policy "Org Owners can view leads" on public.leads
  for select using (
    exists (
      select 1 from public.resources
      where resources.id = leads.resource_id
      and resources.owner_id = auth.uid()
    )
  );
  
-- Leads Policy: Org Owners can update leads
create policy "Org Owners can update leads" on public.leads
  for update using (
    exists (
      select 1 from public.resources
      where resources.id = leads.resource_id
      and resources.owner_id = auth.uid()
    )
  );

-- AGENT TASKS TABLE
-- Source of Truth for Agent orchestration
create table public.agent_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'pending', -- 'pending', 'in-progress', 'completed', 'failed'
  assigned_agent text not null, -- 'Alpha', 'Beta', 'Gamma', 'Delta'
  payload jsonb default '{}'::jsonb, -- Task details
  result jsonb default '{}'::jsonb, -- Output
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS POLICIES
alter table public.resources enable row level security;
alter table public.agent_tasks enable row level security;

-- Public read access for resources
create policy "Allow public read access" on public.resources
  for select using (true);

-- Agents (Service Role) have full access implicitly, 
-- but we can add policies for authenticated users if needed later.
