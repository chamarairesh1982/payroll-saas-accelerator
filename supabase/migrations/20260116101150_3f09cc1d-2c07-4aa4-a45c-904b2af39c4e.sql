-- Create notification_logs table to track all sent notifications
CREATE TABLE public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  subject TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX idx_notification_logs_employee_id ON public.notification_logs(employee_id);
CREATE INDEX idx_notification_logs_created_at ON public.notification_logs(created_at DESC);
CREATE INDEX idx_notification_logs_status ON public.notification_logs(status);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Admins and HR can view all notification logs for their company
CREATE POLICY "Admins and HR can view notification logs"
  ON public.notification_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.user_roles ur ON ur.user_id = p.id
      WHERE p.id = auth.uid()
      AND ur.role IN ('admin', 'hr', 'super_admin')
      AND p.company_id = (
        SELECT company_id FROM public.profiles WHERE id = notification_logs.employee_id
      )
    )
  );

-- Employees can view their own notification logs
CREATE POLICY "Employees can view own notification logs"
  ON public.notification_logs
  FOR SELECT
  USING (employee_id = auth.uid());

-- Service role can insert logs (from edge function)
CREATE POLICY "Service role can insert logs"
  ON public.notification_logs
  FOR INSERT
  WITH CHECK (true);