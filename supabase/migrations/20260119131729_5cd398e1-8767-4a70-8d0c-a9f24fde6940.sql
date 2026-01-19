-- Add pending and rejected to loan_status enum
ALTER TYPE public.loan_status ADD VALUE IF NOT EXISTS 'pending' BEFORE 'active';
ALTER TYPE public.loan_status ADD VALUE IF NOT EXISTS 'rejected' AFTER 'defaulted';

-- Add rejection_reason column to loans table
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Update the notify function to handle both approvals and rejections
CREATE OR REPLACE FUNCTION public.notify_loan_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload jsonb;
  notification_status text;
BEGIN
  -- Handle approval: status changes from pending to active
  IF OLD.status = 'pending' AND NEW.status = 'active' THEN
    notification_status := 'approved';
  -- Handle rejection: status changes from pending to rejected
  ELSIF OLD.status = 'pending' AND NEW.status = 'rejected' THEN
    notification_status := 'rejected';
  ELSE
    RETURN NEW;
  END IF;
  
  payload := jsonb_build_object(
    'type', 'loan',
    'employee_id', NEW.employee_id,
    'status', notification_status,
    'details', jsonb_build_object(
      'loan_type', NEW.loan_type,
      'principal_amount', NEW.principal_amount,
      'monthly_deduction', NEW.monthly_deduction,
      'interest_rate', NEW.interest_rate,
      'start_date', NEW.start_date,
      'expected_end_date', NEW.expected_end_date,
      'rejection_reason', NEW.rejection_reason
    )
  );
  
  -- Call the edge function
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-notification-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := payload
  );
  
  RETURN NEW;
END;
$$;