-- Drop the problematic recursive policies
DROP POLICY IF EXISTS "Users can view roles in their company" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles in their company" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view profiles in their company" ON public.profiles;
DROP POLICY IF EXISTS "Admins and HR can manage profiles in their company" ON public.profiles;

-- Create simpler non-recursive policies for user_roles
-- Users can view their own roles (simple direct check, no subquery on same table)
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

-- Admins can manage all roles in their company using security definer function
CREATE POLICY "Admins can manage roles in their company" 
ON public.user_roles 
FOR ALL 
USING (
  company_id = get_user_company_id(auth.uid()) AND 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  company_id = get_user_company_id(auth.uid()) AND 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create simpler non-recursive policies for profiles
-- Users can view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (id = auth.uid());

-- Users can view profiles in their company (use security definer function)
CREATE POLICY "Users can view profiles in same company" 
ON public.profiles 
FOR SELECT 
USING (company_id = get_user_company_id(auth.uid()));

-- Admins and HR can manage profiles in their company
CREATE POLICY "Admins and HR can manage profiles in their company" 
ON public.profiles 
FOR ALL 
USING (
  company_id = get_user_company_id(auth.uid()) AND 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  company_id = get_user_company_id(auth.uid()) AND 
  has_role(auth.uid(), 'admin'::app_role)
);