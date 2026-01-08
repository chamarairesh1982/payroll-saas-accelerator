-- Allow authenticated users to insert a company (for onboarding)
CREATE POLICY "Authenticated users can create their own company"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Allow users to insert their own role (for initial company setup)
CREATE POLICY "Users can insert their own initial role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow users to view roles in their company
CREATE POLICY "Users can view roles in their company"
ON public.user_roles
FOR SELECT
TO authenticated
USING (company_id IN (
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
));