-- CRITICAL: Enforce payroll immutability at database level
-- Approved/paid payrolls and their payslips must be READ-ONLY forever

-- 1. Create RESTRICTIVE policy to block UPDATE on approved/paid payroll_runs
CREATE POLICY "Block UPDATE on approved payrolls"
ON public.payroll_runs
AS RESTRICTIVE FOR UPDATE
TO authenticated
USING (status NOT IN ('approved', 'paid'));

-- 2. Create RESTRICTIVE policy to block DELETE on approved/paid payroll_runs
CREATE POLICY "Block DELETE on approved payrolls"
ON public.payroll_runs
AS RESTRICTIVE FOR DELETE
TO authenticated
USING (status NOT IN ('approved', 'paid'));

-- 3. Create RESTRICTIVE policy to block UPDATE on payslips of approved/paid payrolls
CREATE POLICY "Block UPDATE on payslips of approved payrolls"
ON public.payslips
AS RESTRICTIVE FOR UPDATE
TO authenticated
USING (
  NOT EXISTS (
    SELECT 1 FROM payroll_runs pr 
    WHERE pr.id = payslips.payroll_run_id 
    AND pr.status IN ('approved', 'paid')
  )
);

-- 4. Create RESTRICTIVE policy to block DELETE on payslips of approved/paid payrolls
CREATE POLICY "Block DELETE on payslips of approved payrolls"
ON public.payslips
AS RESTRICTIVE FOR DELETE
TO authenticated
USING (
  NOT EXISTS (
    SELECT 1 FROM payroll_runs pr 
    WHERE pr.id = payslips.payroll_run_id 
    AND pr.status IN ('approved', 'paid')
  )
);