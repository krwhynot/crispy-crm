-- Fix RLS policies for tasks and opportunityNotes tables
-- These tables have RLS enabled but no policies, causing 403 errors

-- Tasks table policies
CREATE POLICY "Enable read access for authenticated users on tasks"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users on tasks"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users on tasks"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users on tasks"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (auth.role() = 'authenticated');

-- OpportunityNotes table policies
CREATE POLICY "Enable read access for authenticated users on opportunityNotes"
  ON public."opportunityNotes" FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users on opportunityNotes"
  ON public."opportunityNotes" FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users on opportunityNotes"
  ON public."opportunityNotes" FOR UPDATE
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users on opportunityNotes"
  ON public."opportunityNotes" FOR DELETE
  TO authenticated
  USING (auth.role() = 'authenticated');