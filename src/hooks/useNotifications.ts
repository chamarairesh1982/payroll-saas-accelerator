import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

  const canApprove = isAdmin || isHR || isManager;
  const canInvite = isAdmin || isHR;

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
            const { count, error } = await supabase
              .from("leave_requests")
              .select("id", { count: "exact", head: true })
              .eq("status", "pending");
            if (error) return 0;
            return count ?? 0;
          }),
          safeCount(async () => {
            if (!canApprove) return 0;
            const { count, error } = await supabase
              .from("overtime_entries")
              .select("id", { count: "exact", head: true })
              .eq("status", "pending");
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
          description: `${overtimePending} entry${overtimePending === 1 ? "" : "ies"} pending`,
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
