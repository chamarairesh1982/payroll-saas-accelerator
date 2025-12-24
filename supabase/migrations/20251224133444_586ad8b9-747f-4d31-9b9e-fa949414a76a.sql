-- Create attendance_records table for tracking daily attendance
CREATE TABLE public.attendance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  worked_hours NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'half_day', 'leave', 'holiday', 'weekend')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Enable RLS
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX idx_attendance_employee_date ON public.attendance_records(employee_id, date);
CREATE INDEX idx_attendance_date ON public.attendance_records(date);

-- RLS Policies
CREATE POLICY "Admin/HR/Manager can manage all attendance records"
ON public.attendance_records
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = attendance_records.employee_id
    AND p.company_id = get_user_company_id(auth.uid())
    AND get_user_role(auth.uid(), p.company_id) IN ('admin', 'hr', 'manager', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = attendance_records.employee_id
    AND p.company_id = get_user_company_id(auth.uid())
    AND get_user_role(auth.uid(), p.company_id) IN ('admin', 'hr', 'manager', 'super_admin')
  )
);

CREATE POLICY "Employees can view their own attendance"
ON public.attendance_records
FOR SELECT
USING (employee_id = auth.uid());

CREATE POLICY "Employees can create their own attendance"
ON public.attendance_records
FOR INSERT
WITH CHECK (employee_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_attendance_records_updated_at
BEFORE UPDATE ON public.attendance_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();