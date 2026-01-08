-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can create their own company" ON public.companies;

-- Create a more restrictive policy - users can only create company if they don't have one yet
CREATE POLICY "Users without company can create one"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND company_id IS NOT NULL
  )
);