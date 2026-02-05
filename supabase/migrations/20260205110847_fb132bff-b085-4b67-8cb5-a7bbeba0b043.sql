-- Add company_feature_flags table for module toggles
CREATE TABLE public.company_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  attendance_enabled BOOLEAN NOT NULL DEFAULT false,
  overtime_enabled BOOLEAN NOT NULL DEFAULT false,
  loans_enabled BOOLEAN NOT NULL DEFAULT false,
  advanced_reports_enabled BOOLEAN NOT NULL DEFAULT false,
  leave_management_enabled BOOLEAN NOT NULL DEFAULT true,
  api_access_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- Enable RLS
ALTER TABLE public.company_feature_flags ENABLE ROW LEVEL SECURITY;

-- RLS policies for company_feature_flags
CREATE POLICY "Users can view their company feature flags"
ON public.company_feature_flags
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admin can manage feature flags"
ON public.company_feature_flags
FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND get_user_role(auth.uid(), company_id) IN ('admin', 'super_admin')
)
WITH CHECK (
  company_id = get_user_company_id(auth.uid()) 
  AND get_user_role(auth.uid(), company_id) IN ('admin', 'super_admin')
);

-- Add trigger for updated_at
CREATE TRIGGER update_company_feature_flags_updated_at
  BEFORE UPDATE ON public.company_feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create feature flags when company is created
CREATE OR REPLACE FUNCTION public.create_company_feature_flags()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.company_feature_flags (company_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_feature_flags_on_company_insert
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.create_company_feature_flags();

-- Create feature flags for existing companies
INSERT INTO public.company_feature_flags (company_id)
SELECT id FROM public.companies
WHERE id NOT IN (SELECT company_id FROM public.company_feature_flags)
ON CONFLICT (company_id) DO NOTHING;