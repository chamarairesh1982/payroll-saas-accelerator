-- Add notification preferences column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{"email_leave_updates": true, "email_payroll_updates": true, "email_overtime_updates": true, "email_loan_updates": true}'::jsonb;