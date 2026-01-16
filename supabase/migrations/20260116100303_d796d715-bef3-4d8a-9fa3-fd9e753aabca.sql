-- Create a function to send notification emails via edge function
CREATE OR REPLACE FUNCTION public.notify_status_change()
RETURNS TRIGGER AS $$
DECLARE
  payload jsonb;
  notification_type text;
  employee_id_val uuid;
  details jsonb;
BEGIN
  -- Determine notification type based on table
  CASE TG_TABLE_NAME
    WHEN 'leave_requests' THEN
      notification_type := 'leave';
      employee_id_val := NEW.employee_id;
      details := jsonb_build_object(
        'start_date', NEW.start_date,
        'end_date', NEW.end_date,
        'days', NEW.days,
        'rejection_reason', NEW.rejection_reason
      );
    WHEN 'overtime_entries' THEN
      notification_type := 'overtime';
      employee_id_val := NEW.employee_id;
      details := jsonb_build_object(
        'date', NEW.date,
        'hours', NEW.hours,
        'calculated_amount', NEW.calculated_amount
      );
    WHEN 'payslips' THEN
      notification_type := 'payroll';
      employee_id_val := NEW.employee_id;
      -- Get payroll run details
      SELECT jsonb_build_object(
        'pay_period_start', pr.pay_period_start,
        'pay_period_end', pr.pay_period_end,
        'net_salary', NEW.net_salary
      ) INTO details
      FROM public.payroll_runs pr
      WHERE pr.id = NEW.payroll_run_id;
    ELSE
      RETURN NEW;
  END CASE;

  -- Build payload
  payload := jsonb_build_object(
    'type', notification_type,
    'employee_id', employee_id_val,
    'status', CASE 
      WHEN TG_TABLE_NAME = 'payslips' THEN 'processed'
      ELSE NEW.status::text 
    END,
    'details', details
  );

  -- Call edge function asynchronously using pg_net
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-notification-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := payload
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Failed to send notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for leave requests (only on status change to approved/rejected)
DROP TRIGGER IF EXISTS trigger_leave_notification ON public.leave_requests;
CREATE TRIGGER trigger_leave_notification
  AFTER UPDATE OF status ON public.leave_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('approved', 'rejected'))
  EXECUTE FUNCTION public.notify_status_change();

-- Create triggers for overtime entries (only on status change to approved/rejected)
DROP TRIGGER IF EXISTS trigger_overtime_notification ON public.overtime_entries;
CREATE TRIGGER trigger_overtime_notification
  AFTER UPDATE OF status ON public.overtime_entries
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('approved', 'rejected'))
  EXECUTE FUNCTION public.notify_status_change();

-- Create trigger for payslips (on insert - when payslip is created)
DROP TRIGGER IF EXISTS trigger_payslip_notification ON public.payslips;
CREATE TRIGGER trigger_payslip_notification
  AFTER INSERT ON public.payslips
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_status_change();