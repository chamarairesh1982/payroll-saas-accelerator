-- Fix the get_user_company_id function to use profiles table instead of user_roles
-- This ensures it works even when user_roles doesn't exist yet
CREATE OR REPLACE FUNCTION public.get_user_company_id(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT company_id FROM public.profiles WHERE id = p_user_id),
    (SELECT company_id FROM public.user_roles WHERE user_id = p_user_id LIMIT 1)
  );
$$;