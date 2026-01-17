-- Create function to notify loan status change
CREATE OR REPLACE FUNCTION public.notify_loan_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload jsonb;
  supabase_url text;
  service_key text;
BEGIN
  -- Only notify when status changes from pending (null approved_by) to approved/rejected
  IF OLD.status = 'active' AND NEW.status IN ('active', 'completed', 'defaulted') AND 
     OLD.approved_by IS NULL AND NEW.approved_by IS NOT NULL THEN
    
    payload := jsonb_build_object(
      'type', 'loan',
      'employee_id', NEW.employee_id,
      'status', 'approved',
      'details', jsonb_build_object(
        'loan_type', NEW.loan_type,
        'principal_amount', NEW.principal_amount,
        'monthly_deduction', NEW.monthly_deduction,
        'interest_rate', NEW.interest_rate,
        'start_date', NEW.start_date,
        'expected_end_date', NEW.expected_end_date
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
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for loan status changes
DROP TRIGGER IF EXISTS on_loan_status_change ON public.loans;
CREATE TRIGGER on_loan_status_change
  AFTER UPDATE ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_loan_status_change();