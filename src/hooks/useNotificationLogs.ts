import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface NotificationLog {
  id: string;
  employee_id: string;
  notification_type: string;
  status: string;
  subject: string;
  recipient_email: string;
  details: Record<string, unknown> | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
  employee?: {
    first_name: string | null;
    last_name: string | null;
    employee_number: string | null;
  };
}

export const useNotificationLogs = () => {
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  return useQuery({
    queryKey: ["notification-logs", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("notification_logs")
        .select(`
          *,
          employee:profiles!notification_logs_employee_id_fkey(
            first_name, last_name, employee_number
          )
        `)
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;
      return data as NotificationLog[];
    },
    enabled: !!companyId,
  });
};
