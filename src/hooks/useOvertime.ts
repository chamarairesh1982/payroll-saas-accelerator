import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type OvertimeRate = Tables<"overtime_rates">;
export type OvertimeEntry = Tables<"overtime_entries"> & {
  overtime_rate?: OvertimeRate;
  employee?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    employee_number: string | null;
    department: string | null;
    basic_salary: number | null;
  };
};

export const formatDayType = (dayType: string): string => {
  const labels: Record<string, string> = {
    weekday: "Weekday",
    saturday: "Saturday",
    sunday: "Sunday",
    holiday: "Holiday",
  };
  return labels[dayType] || dayType;
};

export const useOvertimeRates = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  const { data: overtimeRates = [], isLoading } = useQuery({
    queryKey: ["overtime-rates", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("overtime_rates")
        .select("*")
        .eq("company_id", companyId)
        .order("multiplier");

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const createOvertimeRateMutation = useMutation({
    mutationFn: async (data: Omit<TablesInsert<"overtime_rates">, "company_id">) => {
      if (!companyId) throw new Error("No company selected");

      const { error } = await supabase.from("overtime_rates").insert({
        ...data,
        company_id: companyId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overtime-rates", companyId] });
      toast.success("Overtime rate created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create overtime rate");
    },
  });

  const updateOvertimeRateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<OvertimeRate> }) => {
      const { error } = await supabase.from("overtime_rates").update(updates).eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overtime-rates", companyId] });
      toast.success("Overtime rate updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update overtime rate");
    },
  });

  return {
    overtimeRates,
    isLoading,
    createOvertimeRate: createOvertimeRateMutation.mutate,
    updateOvertimeRate: updateOvertimeRateMutation.mutate,
    isCreating: createOvertimeRateMutation.isPending,
    isUpdating: updateOvertimeRateMutation.isPending,
  };
};

export const useOvertimeEntries = () => {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  const { data: overtimeEntries = [], isLoading } = useQuery({
    queryKey: ["overtime-entries", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("overtime_entries")
        .select(`
          *,
          overtime_rate:overtime_rates(*),
          employee:profiles!overtime_entries_employee_id_fkey(id, first_name, last_name, employee_number, department, basic_salary)
        `)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as OvertimeEntry[];
    },
    enabled: !!companyId,
  });

  const stats = {
    totalHours: overtimeEntries
      .filter((e) => e.status !== "rejected")
      .reduce((sum, e) => sum + Number(e.hours), 0),
    totalAmount: overtimeEntries
      .filter((e) => e.status !== "rejected")
      .reduce((sum, e) => sum + Number(e.calculated_amount), 0),
    pendingCount: overtimeEntries.filter((e) => e.status === "pending").length,
    pendingAmount: overtimeEntries
      .filter((e) => e.status === "pending")
      .reduce((sum, e) => sum + Number(e.calculated_amount), 0),
    approvedCount: overtimeEntries.filter((e) => e.status === "approved").length,
  };

  const createOvertimeEntryMutation = useMutation({
    mutationFn: async (data: {
      employee_id: string;
      date: string;
      hours: number;
      overtime_rate_id: string;
      calculated_amount: number;
    }) => {
      const { error } = await supabase.from("overtime_entries").insert({
        employee_id: data.employee_id,
        date: data.date,
        hours: data.hours,
        overtime_rate_id: data.overtime_rate_id,
        calculated_amount: data.calculated_amount,
        status: "pending",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overtime-entries", companyId] });
      toast.success("Overtime entry created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create overtime entry");
    },
  });

  const approveOvertimeEntryMutation = useMutation({
    mutationFn: async (entryId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("overtime_entries")
        .update({
          status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", entryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overtime-entries", companyId] });
      toast.success("Overtime entry approved");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to approve entry");
    },
  });

  const rejectOvertimeEntryMutation = useMutation({
    mutationFn: async (entryId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("overtime_entries")
        .update({
          status: "rejected",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", entryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overtime-entries", companyId] });
      toast.success("Overtime entry rejected");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reject entry");
    },
  });

  return {
    overtimeEntries,
    stats,
    isLoading,
    createOvertimeEntry: createOvertimeEntryMutation.mutate,
    approveOvertimeEntry: approveOvertimeEntryMutation.mutate,
    rejectOvertimeEntry: rejectOvertimeEntryMutation.mutate,
    isCreating: createOvertimeEntryMutation.isPending,
    isApproving: approveOvertimeEntryMutation.isPending,
    isRejecting: rejectOvertimeEntryMutation.isPending,
  };
};
