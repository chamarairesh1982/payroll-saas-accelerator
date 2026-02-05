-- Create audit_logs table for payroll compliance
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_audit_logs_company_id ON public.audit_logs(company_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admin/HR can view audit logs in their company
CREATE POLICY "Admin/HR can view audit logs"
ON public.audit_logs
FOR SELECT
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND get_user_role(auth.uid(), company_id) = ANY (ARRAY['admin'::app_role, 'hr'::app_role, 'super_admin'::app_role])
);

-- Super admins can view all audit logs
CREATE POLICY "Super admins can view all audit logs"
ON public.audit_logs
FOR SELECT
USING (is_super_admin(auth.uid()));

-- Only system can insert (via triggers)
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- Trigger function for payroll status changes (approval/payment)
CREATE OR REPLACE FUNCTION public.audit_payroll_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log payroll approval
  IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
    INSERT INTO public.audit_logs (company_id, user_id, action, entity_type, entity_id, metadata)
    VALUES (
      NEW.company_id,
      COALESCE(NEW.approved_by, auth.uid()),
      'payroll_approved',
      'payroll_run',
      NEW.id,
      jsonb_build_object(
        'pay_period_start', NEW.pay_period_start,
        'pay_period_end', NEW.pay_period_end,
        'employee_count', NEW.employee_count,
        'total_net_salary', NEW.total_net_salary
      )
    );
  END IF;

  -- Log payroll marked as paid
  IF OLD.status != 'paid' AND NEW.status = 'paid' THEN
    INSERT INTO public.audit_logs (company_id, user_id, action, entity_type, entity_id, metadata)
    VALUES (
      NEW.company_id,
      auth.uid(),
      'payroll_paid',
      'payroll_run',
      NEW.id,
      jsonb_build_object(
        'pay_period_start', NEW.pay_period_start,
        'pay_period_end', NEW.pay_period_end,
        'employee_count', NEW.employee_count,
        'total_net_salary', NEW.total_net_salary,
        'pay_date', NEW.pay_date
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger function for salary component changes
CREATE OR REPLACE FUNCTION public.audit_salary_component_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (company_id, user_id, action, entity_type, entity_id, metadata)
    VALUES (
      NEW.company_id,
      auth.uid(),
      'salary_component_created',
      'salary_component',
      NEW.id,
      jsonb_build_object('name', NEW.name, 'type', NEW.type, 'value', NEW.value)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (company_id, user_id, action, entity_type, entity_id, metadata)
    VALUES (
      NEW.company_id,
      auth.uid(),
      'salary_component_updated',
      'salary_component',
      NEW.id,
      jsonb_build_object('name', NEW.name, 'type', NEW.type, 'value', NEW.value, 'is_active', NEW.is_active)
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (company_id, user_id, action, entity_type, entity_id, metadata)
    VALUES (
      OLD.company_id,
      auth.uid(),
      'salary_component_deleted',
      'salary_component',
      OLD.id,
      jsonb_build_object('name', OLD.name, 'type', OLD.type)
    );
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger function for tax slab changes
CREATE OR REPLACE FUNCTION public.audit_tax_slab_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (company_id, user_id, action, entity_type, entity_id, metadata)
    VALUES (
      NEW.company_id,
      auth.uid(),
      'tax_slab_created',
      'tax_slab',
      NEW.id,
      jsonb_build_object('min_income', NEW.min_income, 'max_income', NEW.max_income, 'rate', NEW.rate)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (company_id, user_id, action, entity_type, entity_id, metadata)
    VALUES (
      NEW.company_id,
      auth.uid(),
      'tax_slab_updated',
      'tax_slab',
      NEW.id,
      jsonb_build_object('min_income', NEW.min_income, 'max_income', NEW.max_income, 'rate', NEW.rate, 'is_active', NEW.is_active)
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (company_id, user_id, action, entity_type, entity_id, metadata)
    VALUES (
      OLD.company_id,
      auth.uid(),
      'tax_slab_deleted',
      'tax_slab',
      OLD.id,
      jsonb_build_object('min_income', OLD.min_income, 'max_income', OLD.max_income, 'rate', OLD.rate)
    );
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
CREATE TRIGGER audit_payroll_status
AFTER UPDATE ON public.payroll_runs
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.audit_payroll_status_change();

CREATE TRIGGER audit_salary_components
AFTER INSERT OR UPDATE OR DELETE ON public.salary_components
FOR EACH ROW
EXECUTE FUNCTION public.audit_salary_component_change();

CREATE TRIGGER audit_tax_slabs
AFTER INSERT OR UPDATE OR DELETE ON public.tax_slabs
FOR EACH ROW
EXECUTE FUNCTION public.audit_tax_slab_change();