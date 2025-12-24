-- Create employee invitations table
CREATE TABLE public.employee_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  department TEXT,
  designation TEXT,
  basic_salary NUMERIC,
  employment_type TEXT DEFAULT 'permanent',
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  invited_by UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admin/HR can manage invitations in their company"
ON public.employee_invitations FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) AND
  get_user_role(auth.uid(), company_id) IN ('admin', 'hr', 'super_admin')
)
WITH CHECK (
  company_id = get_user_company_id(auth.uid()) AND
  get_user_role(auth.uid(), company_id) IN ('admin', 'hr', 'super_admin')
);

CREATE POLICY "Users can view invitations in their company"
ON public.employee_invitations FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- Allow public read access for invitation acceptance (by token)
CREATE POLICY "Public can read pending invitations by token"
ON public.employee_invitations FOR SELECT
USING (status = 'pending' AND expires_at > now());

-- Create trigger for updated_at
CREATE TRIGGER update_employee_invitations_updated_at
BEFORE UPDATE ON public.employee_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();