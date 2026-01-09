-- Drop the problematic SELECT policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view company they just created" ON public.companies;
DROP POLICY IF EXISTS "Users can view their company" ON public.companies;
DROP POLICY IF EXISTS "Super admins can view all companies" ON public.companies;
DROP POLICY IF EXISTS "Admins can view their company" ON public.companies;

-- Create a security definer function to get user's company_id without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_company_id_safe(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = p_user_id;
$$;

-- Create a security definer function to check if user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_user_id 
    AND role = 'super_admin'
  );
$$;

-- Policy: Users can view their own company (using security definer function)
CREATE POLICY "Users can view their company"
ON public.companies
FOR SELECT
TO authenticated
USING (
  id = public.get_user_company_id_safe(auth.uid())
  OR public.is_super_admin(auth.uid())
  OR NOT public.user_has_company(auth.uid())
);