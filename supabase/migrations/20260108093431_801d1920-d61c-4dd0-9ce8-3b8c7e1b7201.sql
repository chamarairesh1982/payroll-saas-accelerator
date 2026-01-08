-- Drop the current restrictive policy
DROP POLICY IF EXISTS "Users without company can create one" ON public.companies;

-- Create a function to check if user has a company already
CREATE OR REPLACE FUNCTION public.user_has_company(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = p_user_id 
    AND company_id IS NOT NULL
  );
$$;

-- Allow users to create a company if they don't have one yet
CREATE POLICY "Users without company can create one"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (
  NOT public.user_has_company(auth.uid())
);