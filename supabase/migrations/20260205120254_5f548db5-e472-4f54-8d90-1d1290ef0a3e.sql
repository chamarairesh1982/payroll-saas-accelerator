-- Drop the problematic policy causing infinite recursion
DROP POLICY IF EXISTS "Parent company admins can view subsidiary companies" ON public.companies;

-- Create a security definer function to check if user has enterprise admin access
CREATE OR REPLACE FUNCTION public.get_user_enterprise_company_ids(p_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.company_id 
  FROM public.user_roles ur
  JOIN public.companies c ON c.id = ur.company_id
  WHERE ur.user_id = p_user_id
  AND ur.role IN ('admin', 'super_admin')
  AND c.subscription_plan = 'enterprise';
$$;

-- Create a new policy using the security definer function
CREATE POLICY "Parent company admins can view subsidiary companies"
ON public.companies
FOR SELECT
USING (
  parent_company_id IN (SELECT get_user_enterprise_company_ids(auth.uid()))
);