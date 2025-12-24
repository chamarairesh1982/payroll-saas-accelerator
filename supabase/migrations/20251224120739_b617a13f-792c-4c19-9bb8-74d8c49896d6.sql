-- Create enums for various status types
CREATE TYPE public.employment_type AS ENUM ('permanent', 'contract', 'probation', 'intern');
CREATE TYPE public.employee_status AS ENUM ('active', 'inactive', 'terminated');
CREATE TYPE public.component_type AS ENUM ('allowance', 'deduction');
CREATE TYPE public.component_category AS ENUM ('fixed', 'percentage', 'variable');
CREATE TYPE public.calculation_type AS ENUM ('basic', 'gross', 'fixed');
CREATE TYPE public.payroll_status AS ENUM ('draft', 'processing', 'pending_approval', 'approved', 'paid');
CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE public.overtime_day_type AS ENUM ('weekday', 'saturday', 'sunday', 'holiday');
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.loan_type AS ENUM ('salary_advance', 'personal_loan', 'emergency_loan');
CREATE TYPE public.loan_status AS ENUM ('active', 'completed', 'defaulted');
CREATE TYPE public.recovery_status AS ENUM ('pending', 'paid', 'partial', 'overdue');

-- Salary Components table
CREATE TABLE public.salary_components (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type component_type NOT NULL,
  category component_category NOT NULL,
  calculation_type calculation_type NOT NULL DEFAULT 'fixed',
  value NUMERIC NOT NULL DEFAULT 0,
  is_taxable BOOLEAN NOT NULL DEFAULT true,
  is_epf_applicable BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Leave Types table
CREATE TABLE public.leave_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  days_per_year INTEGER NOT NULL DEFAULT 0,
  is_carry_forward BOOLEAN NOT NULL DEFAULT false,
  max_carry_forward INTEGER NOT NULL DEFAULT 0,
  is_paid BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

-- Leave Requests table
CREATE TABLE public.leave_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days NUMERIC NOT NULL,
  reason TEXT,
  status leave_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Overtime Rates table
CREATE TABLE public.overtime_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  multiplier NUMERIC NOT NULL DEFAULT 1.5,
  day_type overtime_day_type NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Overtime Entries table
CREATE TABLE public.overtime_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  overtime_rate_id UUID NOT NULL REFERENCES public.overtime_rates(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours NUMERIC NOT NULL,
  calculated_amount NUMERIC NOT NULL DEFAULT 0,
  status approval_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Loans table
CREATE TABLE public.loans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  loan_type loan_type NOT NULL,
  principal_amount NUMERIC NOT NULL,
  outstanding_amount NUMERIC NOT NULL,
  monthly_deduction NUMERIC NOT NULL,
  interest_rate NUMERIC NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  expected_end_date DATE NOT NULL,
  status loan_status NOT NULL DEFAULT 'active',
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Loan Recovery Schedule table
CREATE TABLE public.loan_recovery_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  principal_amount NUMERIC NOT NULL,
  interest_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  paid_date DATE,
  status recovery_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tax Slabs table
CREATE TABLE public.tax_slabs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  min_income NUMERIC NOT NULL,
  max_income NUMERIC NOT NULL,
  rate NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Payroll Runs table
CREATE TABLE public.payroll_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  pay_date DATE NOT NULL,
  status payroll_status NOT NULL DEFAULT 'draft',
  total_gross_salary NUMERIC NOT NULL DEFAULT 0,
  total_net_salary NUMERIC NOT NULL DEFAULT 0,
  total_epf_employee NUMERIC NOT NULL DEFAULT 0,
  total_epf_employer NUMERIC NOT NULL DEFAULT 0,
  total_etf NUMERIC NOT NULL DEFAULT 0,
  total_paye NUMERIC NOT NULL DEFAULT 0,
  employee_count INTEGER NOT NULL DEFAULT 0,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Payslips table
CREATE TABLE public.payslips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payroll_run_id UUID NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  basic_salary NUMERIC NOT NULL,
  allowances JSONB NOT NULL DEFAULT '[]',
  deductions JSONB NOT NULL DEFAULT '[]',
  gross_salary NUMERIC NOT NULL,
  taxable_income NUMERIC NOT NULL DEFAULT 0,
  epf_employee NUMERIC NOT NULL DEFAULT 0,
  epf_employer NUMERIC NOT NULL DEFAULT 0,
  etf_employer NUMERIC NOT NULL DEFAULT 0,
  paye_tax NUMERIC NOT NULL DEFAULT 0,
  net_salary NUMERIC NOT NULL,
  working_days INTEGER NOT NULL DEFAULT 22,
  worked_days INTEGER NOT NULL DEFAULT 22,
  ot_hours NUMERIC NOT NULL DEFAULT 0,
  ot_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.salary_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overtime_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overtime_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_recovery_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_slabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;

-- RLS Policies for salary_components
CREATE POLICY "Users can view salary components in their company"
  ON public.salary_components FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admin/HR can manage salary components"
  ON public.salary_components FOR ALL
  USING (company_id = get_user_company_id(auth.uid()) AND get_user_role(auth.uid(), company_id) IN ('admin', 'hr', 'super_admin'))
  WITH CHECK (company_id = get_user_company_id(auth.uid()) AND get_user_role(auth.uid(), company_id) IN ('admin', 'hr', 'super_admin'));

-- RLS Policies for leave_types
CREATE POLICY "Users can view leave types in their company"
  ON public.leave_types FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admin/HR can manage leave types"
  ON public.leave_types FOR ALL
  USING (company_id = get_user_company_id(auth.uid()) AND get_user_role(auth.uid(), company_id) IN ('admin', 'hr', 'super_admin'))
  WITH CHECK (company_id = get_user_company_id(auth.uid()) AND get_user_role(auth.uid(), company_id) IN ('admin', 'hr', 'super_admin'));

-- RLS Policies for leave_requests
CREATE POLICY "Users can view leave requests in their company"
  ON public.leave_requests FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM public.profiles WHERE company_id = get_user_company_id(auth.uid())
    ) OR employee_id = auth.uid()
  );

CREATE POLICY "Employees can create their own leave requests"
  ON public.leave_requests FOR INSERT
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Employees can update their own pending leave requests"
  ON public.leave_requests FOR UPDATE
  USING (employee_id = auth.uid() AND status = 'pending')
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Admin/HR/Manager can manage all leave requests"
  ON public.leave_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = leave_requests.employee_id 
      AND p.company_id = get_user_company_id(auth.uid())
      AND get_user_role(auth.uid(), p.company_id) IN ('admin', 'hr', 'manager', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = leave_requests.employee_id 
      AND p.company_id = get_user_company_id(auth.uid())
      AND get_user_role(auth.uid(), p.company_id) IN ('admin', 'hr', 'manager', 'super_admin')
    )
  );

-- RLS Policies for overtime_rates
CREATE POLICY "Users can view overtime rates in their company"
  ON public.overtime_rates FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admin/HR can manage overtime rates"
  ON public.overtime_rates FOR ALL
  USING (company_id = get_user_company_id(auth.uid()) AND get_user_role(auth.uid(), company_id) IN ('admin', 'hr', 'super_admin'))
  WITH CHECK (company_id = get_user_company_id(auth.uid()) AND get_user_role(auth.uid(), company_id) IN ('admin', 'hr', 'super_admin'));

-- RLS Policies for overtime_entries
CREATE POLICY "Users can view overtime entries in their company"
  ON public.overtime_entries FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM public.profiles WHERE company_id = get_user_company_id(auth.uid())
    ) OR employee_id = auth.uid()
  );

CREATE POLICY "Employees can create their own overtime entries"
  ON public.overtime_entries FOR INSERT
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Admin/HR/Manager can manage all overtime entries"
  ON public.overtime_entries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = overtime_entries.employee_id 
      AND p.company_id = get_user_company_id(auth.uid())
      AND get_user_role(auth.uid(), p.company_id) IN ('admin', 'hr', 'manager', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = overtime_entries.employee_id 
      AND p.company_id = get_user_company_id(auth.uid())
      AND get_user_role(auth.uid(), p.company_id) IN ('admin', 'hr', 'manager', 'super_admin')
    )
  );

-- RLS Policies for loans
CREATE POLICY "Users can view their own loans"
  ON public.loans FOR SELECT
  USING (employee_id = auth.uid());

CREATE POLICY "Admin/HR can view all loans in company"
  ON public.loans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = loans.employee_id 
      AND p.company_id = get_user_company_id(auth.uid())
      AND get_user_role(auth.uid(), p.company_id) IN ('admin', 'hr', 'super_admin')
    )
  );

CREATE POLICY "Admin/HR can manage loans"
  ON public.loans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = loans.employee_id 
      AND p.company_id = get_user_company_id(auth.uid())
      AND get_user_role(auth.uid(), p.company_id) IN ('admin', 'hr', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = loans.employee_id 
      AND p.company_id = get_user_company_id(auth.uid())
      AND get_user_role(auth.uid(), p.company_id) IN ('admin', 'hr', 'super_admin')
    )
  );

-- RLS Policies for loan_recovery_schedules
CREATE POLICY "Users can view their own loan schedules"
  ON public.loan_recovery_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.loans l 
      WHERE l.id = loan_recovery_schedules.loan_id 
      AND l.employee_id = auth.uid()
    )
  );

CREATE POLICY "Admin/HR can manage loan schedules"
  ON public.loan_recovery_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.loans l 
      JOIN public.profiles p ON l.employee_id = p.id
      WHERE l.id = loan_recovery_schedules.loan_id 
      AND p.company_id = get_user_company_id(auth.uid())
      AND get_user_role(auth.uid(), p.company_id) IN ('admin', 'hr', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.loans l 
      JOIN public.profiles p ON l.employee_id = p.id
      WHERE l.id = loan_recovery_schedules.loan_id 
      AND p.company_id = get_user_company_id(auth.uid())
      AND get_user_role(auth.uid(), p.company_id) IN ('admin', 'hr', 'super_admin')
    )
  );

-- RLS Policies for tax_slabs
CREATE POLICY "Users can view tax slabs in their company"
  ON public.tax_slabs FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admin can manage tax slabs"
  ON public.tax_slabs FOR ALL
  USING (company_id = get_user_company_id(auth.uid()) AND get_user_role(auth.uid(), company_id) IN ('admin', 'super_admin'))
  WITH CHECK (company_id = get_user_company_id(auth.uid()) AND get_user_role(auth.uid(), company_id) IN ('admin', 'super_admin'));

-- RLS Policies for payroll_runs
CREATE POLICY "Users can view payroll runs in their company"
  ON public.payroll_runs FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admin/HR can manage payroll runs"
  ON public.payroll_runs FOR ALL
  USING (company_id = get_user_company_id(auth.uid()) AND get_user_role(auth.uid(), company_id) IN ('admin', 'hr', 'super_admin'))
  WITH CHECK (company_id = get_user_company_id(auth.uid()) AND get_user_role(auth.uid(), company_id) IN ('admin', 'hr', 'super_admin'));

-- RLS Policies for payslips
CREATE POLICY "Employees can view their own payslips"
  ON public.payslips FOR SELECT
  USING (employee_id = auth.uid());

CREATE POLICY "Admin/HR can view all payslips in company"
  ON public.payslips FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.payroll_runs pr 
      WHERE pr.id = payslips.payroll_run_id 
      AND pr.company_id = get_user_company_id(auth.uid())
      AND get_user_role(auth.uid(), pr.company_id) IN ('admin', 'hr', 'super_admin')
    )
  );

CREATE POLICY "Admin/HR can manage payslips"
  ON public.payslips FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.payroll_runs pr 
      WHERE pr.id = payslips.payroll_run_id 
      AND pr.company_id = get_user_company_id(auth.uid())
      AND get_user_role(auth.uid(), pr.company_id) IN ('admin', 'hr', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.payroll_runs pr 
      WHERE pr.id = payslips.payroll_run_id 
      AND pr.company_id = get_user_company_id(auth.uid())
      AND get_user_role(auth.uid(), pr.company_id) IN ('admin', 'hr', 'super_admin')
    )
  );

-- Create triggers for updated_at columns
CREATE TRIGGER update_salary_components_updated_at
  BEFORE UPDATE ON public.salary_components
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_types_updated_at
  BEFORE UPDATE ON public.leave_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_overtime_rates_updated_at
  BEFORE UPDATE ON public.overtime_rates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_overtime_entries_updated_at
  BEFORE UPDATE ON public.overtime_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loans_updated_at
  BEFORE UPDATE ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loan_recovery_schedules_updated_at
  BEFORE UPDATE ON public.loan_recovery_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tax_slabs_updated_at
  BEFORE UPDATE ON public.tax_slabs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payroll_runs_updated_at
  BEFORE UPDATE ON public.payroll_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_salary_components_company ON public.salary_components(company_id);
CREATE INDEX idx_leave_types_company ON public.leave_types(company_id);
CREATE INDEX idx_leave_requests_employee ON public.leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX idx_overtime_rates_company ON public.overtime_rates(company_id);
CREATE INDEX idx_overtime_entries_employee ON public.overtime_entries(employee_id);
CREATE INDEX idx_overtime_entries_status ON public.overtime_entries(status);
CREATE INDEX idx_loans_employee ON public.loans(employee_id);
CREATE INDEX idx_loans_status ON public.loans(status);
CREATE INDEX idx_loan_recovery_schedules_loan ON public.loan_recovery_schedules(loan_id);
CREATE INDEX idx_tax_slabs_company ON public.tax_slabs(company_id);
CREATE INDEX idx_payroll_runs_company ON public.payroll_runs(company_id);
CREATE INDEX idx_payroll_runs_status ON public.payroll_runs(status);
CREATE INDEX idx_payslips_payroll_run ON public.payslips(payroll_run_id);
CREATE INDEX idx_payslips_employee ON public.payslips(employee_id);