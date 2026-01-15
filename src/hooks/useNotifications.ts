import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export type NotificationKind =
  | "leave_pending"
  | "overtime_pending"
  | "payroll_pending"
  | "invitations_pending";

export type NotificationItem = {
  kind: NotificationKind;
  count: number;
  title: string;
  description: string;
  href: string;
};

type NotificationsResult = {
  totalCount: number;
  items: NotificationItem[];
};

const safeCount = async (fn: () => Promise<number>): Promise<number> => {
  try {
    const v = await fn();
    return Number.isFinite(v) ? v : 0;
  } catch {
    return 0;
  }
};

export function useNotifications() {
  const { profile, isAdmin, isHR, isManager } = useAuth();
  const companyId = profile?.company_id ?? null;
  const queryClient = useQueryClient();

  const canApprove = isAdmin || isHR || isManager;
  const canInvite = isAdmin || isHR;

  // Subscribe to realtime changes on notification-related tables
  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel(`notifications-${companyId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leave_requests' },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications", companyId, canApprove, canInvite] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'overtime_entries' },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications", companyId, canApprove, canInvite] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payroll_runs' },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications", companyId, canApprove, canInvite] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'employee_invitations' },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications", companyId, canApprove, canInvite] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, canApprove, canInvite, queryClient]);

  return useQuery<NotificationsResult>({
    queryKey: ["notifications", companyId, canApprove, canInvite],
    enabled: !!companyId,
    refetchInterval: 30_000,
    queryFn: async () => {
      if (!companyId) return { totalCount: 0, items: [] };

      const [leavePending, overtimePending, payrollPending, invitationsPending] =
        await Promise.all([
          safeCount(async () => {
            if (!canApprove) return 0;
            const { data: companyEmployees } = await supabase
              .from("profiles")
              .select("id")
              .eq("company_id", companyId);
            if (!companyEmployees?.length) return 0;
            const employeeIds = companyEmployees.map((e) => e.id);
            const { count, error } = await supabase
              .from("leave_requests")
              .select("id", { count: "exact", head: true })
              .eq("status", "pending")
              .in("employee_id", employeeIds);
            if (error) return 0;
            return count ?? 0;
          }),
          safeCount(async () => {
            if (!canApprove) return 0;
            const { data: companyEmployees } = await supabase
              .from("profiles")
              .select("id")
              .eq("company_id", companyId);
            if (!companyEmployees?.length) return 0;
            const employeeIds = companyEmployees.map((e) => e.id);
            const { count, error } = await supabase
              .from("overtime_entries")
              .select("id", { count: "exact", head: true })
              .eq("status", "pending")
              .in("employee_id", employeeIds);
            if (error) return 0;
            return count ?? 0;
          }),
          safeCount(async () => {
            if (!canApprove) return 0;
            const { count, error } = await supabase
              .from("payroll_runs")
              .select("id", { count: "exact", head: true })
              .eq("company_id", companyId)
              .eq("status", "pending_approval");
            if (error) return 0;
            return count ?? 0;
          }),
          safeCount(async () => {
            if (!canInvite) return 0;
            const { count, error } = await supabase
              .from("employee_invitations")
              .select("id", { count: "exact", head: true })
              .eq("company_id", companyId)
              .eq("status", "pending")
              .gt("expires_at", new Date().toISOString());
            if (error) return 0;
            return count ?? 0;
          }),
        ]);

      const items: NotificationItem[] = [];

      if (leavePending > 0) {
        items.push({
          kind: "leave_pending",
          count: leavePending,
          title: "Leave approvals",
          description: `${leavePending} request${leavePending === 1 ? "" : "s"} pending`,
          href: "/leave",
        });
      }

      if (overtimePending > 0) {
        items.push({
          kind: "overtime_pending",
          count: overtimePending,
          title: "Overtime approvals",
          description: `${overtimePending} ${overtimePending === 1 ? "entry" : "entries"} pending`,
          href: "/overtime",
        });
      }

      if (payrollPending > 0) {
        items.push({
          kind: "payroll_pending",
          count: payrollPending,
          title: "Payroll approvals",
          description: `${payrollPending} run${payrollPending === 1 ? "" : "s"} pending`,
          href: "/payroll",
        });
      }

      if (invitationsPending > 0) {
        items.push({
          kind: "invitations_pending",
          count: invitationsPending,
          title: "Employee invitations",
          description: `${invitationsPending} invite${invitationsPending === 1 ? "" : "s"} pending`,
          href: "/employees",
        });
      }

      const totalCount = items.reduce((sum, i) => sum + i.count, 0);
      return { totalCount, items };
    },
  });
}
