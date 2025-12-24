import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type LeaveType = Tables<"leave_types">;
export type LeaveRequest = Tables<"leave_requests"> & {
  leave_type?: LeaveType;
  employee?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    department: string | null;
  };
};

export const useLeaveTypes = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  const { data: leaveTypes = [], isLoading } = useQuery({
    queryKey: ["leave-types", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("leave_types")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const createLeaveTypeMutation = useMutation({
    mutationFn: async (data: Omit<TablesInsert<"leave_types">, "company_id">) => {
      if (!companyId) throw new Error("No company selected");

      const { error } = await supabase.from("leave_types").insert({
        ...data,
        company_id: companyId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-types", companyId] });
      toast.success("Leave type created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create leave type");
    },
  });

  return {
    leaveTypes,
    isLoading,
    createLeaveType: createLeaveTypeMutation.mutate,
    isCreating: createLeaveTypeMutation.isPending,
  };
};

export const useLeaveRequests = () => {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  const { data: leaveRequests = [], isLoading } = useQuery({
    queryKey: ["leave-requests", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("leave_requests")
        .select(`
          *,
          leave_type:leave_types(*),
          employee:profiles!leave_requests_employee_id_fkey(id, first_name, last_name, department)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as LeaveRequest[];
    },
    enabled: !!companyId,
  });

  const createLeaveRequestMutation = useMutation({
    mutationFn: async (data: {
      leave_type_id: string;
      start_date: string;
      end_date: string;
      days: number;
      reason?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase.from("leave_requests").insert({
        employee_id: user.id,
        leave_type_id: data.leave_type_id,
        start_date: data.start_date,
        end_date: data.end_date,
        days: data.days,
        reason: data.reason,
        status: "pending",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests", companyId] });
      toast.success("Leave request submitted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit leave request");
    },
  });

  const approveLeaveRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("leave_requests")
        .update({
          status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests", companyId] });
      toast.success("Leave request approved");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to approve request");
    },
  });

  const rejectLeaveRequestMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("leave_requests")
        .update({
          status: "rejected",
          rejection_reason: reason,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests", companyId] });
      toast.success("Leave request rejected");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reject request");
    },
  });

  return {
    leaveRequests,
    isLoading,
    createLeaveRequest: createLeaveRequestMutation.mutate,
    approveLeaveRequest: approveLeaveRequestMutation.mutate,
    rejectLeaveRequest: rejectLeaveRequestMutation.mutate,
    isCreating: createLeaveRequestMutation.isPending,
    isApproving: approveLeaveRequestMutation.isPending,
    isRejecting: rejectLeaveRequestMutation.isPending,
  };
};
