-- Enable realtime for notification-related tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.leave_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.overtime_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payroll_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_invitations;