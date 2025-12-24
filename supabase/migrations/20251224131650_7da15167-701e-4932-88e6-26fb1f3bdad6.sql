-- Create storage bucket for employee documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-documents', 'employee-documents', false);

-- Create RLS policies for employee documents bucket
CREATE POLICY "Admin/HR can upload employee documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'employee-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM profiles WHERE company_id = get_user_company_id(auth.uid())
  ) AND
  get_user_role(auth.uid(), get_user_company_id(auth.uid())) IN ('admin', 'hr', 'super_admin')
);

CREATE POLICY "Admin/HR can view all employee documents in company"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'employee-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM profiles WHERE company_id = get_user_company_id(auth.uid())
  ) AND
  get_user_role(auth.uid(), get_user_company_id(auth.uid())) IN ('admin', 'hr', 'super_admin')
);

CREATE POLICY "Employees can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'employee-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admin/HR can delete employee documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'employee-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM profiles WHERE company_id = get_user_company_id(auth.uid())
  ) AND
  get_user_role(auth.uid(), get_user_company_id(auth.uid())) IN ('admin', 'hr', 'super_admin')
);

-- Create table to track document metadata
CREATE TABLE public.employee_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  document_type TEXT NOT NULL, -- e.g., 'contract', 'id_copy', 'certificate', 'other'
  description TEXT,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for employee_documents
CREATE POLICY "Admin/HR can manage all employee documents"
ON public.employee_documents FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = employee_documents.employee_id
    AND p.company_id = get_user_company_id(auth.uid())
    AND get_user_role(auth.uid(), p.company_id) IN ('admin', 'hr', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = employee_documents.employee_id
    AND p.company_id = get_user_company_id(auth.uid())
    AND get_user_role(auth.uid(), p.company_id) IN ('admin', 'hr', 'super_admin')
  )
);

CREATE POLICY "Employees can view their own documents"
ON public.employee_documents FOR SELECT
USING (employee_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_employee_documents_updated_at
BEFORE UPDATE ON public.employee_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();