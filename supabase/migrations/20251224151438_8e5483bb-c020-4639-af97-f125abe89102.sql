-- Add unique constraint for employee_id and date combination to support upserts
ALTER TABLE public.attendance_records 
ADD CONSTRAINT attendance_records_employee_date_unique 
UNIQUE (employee_id, date);