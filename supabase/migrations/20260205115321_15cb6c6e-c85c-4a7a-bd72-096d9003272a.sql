-- Add parent_company_id column for company hierarchy (single parent)
ALTER TABLE public.companies 
ADD COLUMN parent_company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

-- Create index for hierarchy queries
CREATE INDEX idx_companies_parent_company_id ON public.companies(parent_company_id);

-- Create a function to get all subsidiary companies of a parent company
CREATE OR REPLACE FUNCTION public.get_subsidiary_companies(p_parent_company_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.companies 
  WHERE parent_company_id = p_parent_company_id 
  AND is_active = true;
$$;

-- Create a function to get all accessible companies for a user
-- Returns: companies where user has a role (via user_roles) + their subsidiaries (for enterprise users)
CREATE OR REPLACE FUNCTION public.get_accessible_companies(p_user_id uuid)
RETURNS TABLE (company_id uuid, is_subsidiary boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Get direct companies from user_roles
  SELECT ur.company_id, false AS is_subsidiary
  FROM public.user_roles ur
  WHERE ur.user_id = p_user_id
  UNION
  -- Get subsidiary companies (only for enterprise parent companies)
  SELECT c.id AS company_id, true AS is_subsidiary
  FROM public.user_roles ur
  JOIN public.companies parent_c ON parent_c.id = ur.company_id
  JOIN public.companies c ON c.parent_company_id = ur.company_id
  WHERE ur.user_id = p_user_id
  AND parent_c.subscription_plan = 'enterprise'
  AND c.is_active = true;
$$;

-- Create a function to check if user can manage a company (either direct or parent access)
CREATE OR REPLACE FUNCTION public.can_manage_company(p_user_id uuid, p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.get_accessible_companies(p_user_id) ac
    WHERE ac.company_id = p_company_id
  );
$$;

-- Create a function to get aggregated stats across all accessible companies
CREATE OR REPLACE FUNCTION public.get_multi_company_stats(p_user_id uuid)
RETURNS TABLE (
  total_companies bigint,
  total_employees bigint,
  total_payroll_processed numeric,
  pending_leave_requests bigint,
  pending_loan_approvals bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (SELECT COUNT(*) FROM public.get_accessible_companies(p_user_id)) as total_companies,
    (SELECT COUNT(*) FROM public.profiles p 
     WHERE p.company_id IN (SELECT ac.company_id FROM public.get_accessible_companies(p_user_id) ac)
     AND p.status = 'active') as total_employees,
    (SELECT COALESCE(SUM(pr.total_net_salary), 0) FROM public.payroll_runs pr
     WHERE pr.company_id IN (SELECT ac.company_id FROM public.get_accessible_companies(p_user_id) ac)
     AND pr.status = 'paid') as total_payroll_processed,
    (SELECT COUNT(*) FROM public.leave_requests lr
     JOIN public.profiles p ON p.id = lr.employee_id
     WHERE p.company_id IN (SELECT ac.company_id FROM public.get_accessible_companies(p_user_id) ac)
     AND lr.status = 'pending') as pending_leave_requests,
    (SELECT COUNT(*) FROM public.loans l
     JOIN public.profiles p ON p.id = l.employee_id
     WHERE p.company_id IN (SELECT ac.company_id FROM public.get_accessible_companies(p_user_id) ac)
     AND l.status = 'pending') as pending_loan_approvals;
$$;

-- Add RLS policy for parent company access to subsidiaries
CREATE POLICY "Parent company admins can view subsidiary companies"
ON public.companies
FOR SELECT
USING (
  parent_company_id IN (
    SELECT ur.company_id FROM public.user_roles ur
    JOIN public.companies c ON c.id = ur.company_id
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin')
    AND c.subscription_plan = 'enterprise'
  )
);