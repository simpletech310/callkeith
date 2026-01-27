-- Allow Users to view their own leads
CREATE POLICY "Users can view their own leads" ON public.leads
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Allow Users to insert their own leads (if needed for client-side submission, though usually done via worker)
CREATE POLICY "Users can create their leads" ON public.leads
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Allow Users to update their own leads (e.g. modify notes, if applicable)
CREATE POLICY "Users can update their leads" ON public.leads
  FOR UPDATE USING (
    auth.uid() = user_id
  );
