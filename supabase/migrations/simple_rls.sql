CREATE POLICY "Users can view their own leads" ON public.leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their leads" ON public.leads FOR INSERT WITH CHECK (auth.uid() = user_id);
