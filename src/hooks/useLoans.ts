import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Loan = Tables<"loans"> & {
  employee?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    employee_number: string | null;
    department: string | null;
  };
};

export type LoanRecoverySchedule = Tables<"loan_recovery_schedules">;

export const loanTypes = [
  { value: "salary_advance", label: "Salary Advance", maxTenure: 24 },
  { value: "personal_loan", label: "Personal Loan", maxTenure: 24 },
  { value: "emergency_loan", label: "Emergency Loan", maxTenure: 24 },
] as const;

export const formatLoanType = (type: string): string => {
  const labels: Record<string, string> = {
    salary_advance: "Salary Advance",
    personal_loan: "Personal Loan",
    emergency_loan: "Emergency Loan",
  };
  return labels[type] || type;
};

export const useLoans = () => {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  const { data: loans = [], isLoading } = useQuery({
    queryKey: ["loans", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("loans")
        .select(`
          *,
          employee:profiles!loans_employee_id_fkey(id, first_name, last_name, employee_number, department)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Loan[];
    },
    enabled: !!companyId,
  });

  const stats = {
    pendingLoans: loans.filter((l) => l.status === "pending").length,
    activeLoans: loans.filter((l) => l.status === "active").length,
    completedLoans: loans.filter((l) => l.status === "completed").length,
    rejectedLoans: loans.filter((l) => l.status === "rejected").length,
    totalDisbursed: loans
      .filter((l) => l.status === "active" || l.status === "completed")
      .reduce((sum, l) => sum + Number(l.principal_amount), 0),
    totalOutstanding: loans
      .filter((l) => l.status === "active")
      .reduce((sum, l) => sum + Number(l.outstanding_amount), 0),
    monthlyDeductions: loans
      .filter((l) => l.status === "active")
      .reduce((sum, l) => sum + Number(l.monthly_deduction), 0),
  };

  const createLoanMutation = useMutation({
    mutationFn: async (data: {
      employee_id: string;
      loan_type: "salary_advance" | "personal_loan" | "emergency_loan";
      principal_amount: number;
      monthly_deduction: number;
      interest_rate?: number;
      start_date: string;
      expected_end_date: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase.from("loans").insert({
        employee_id: data.employee_id,
        loan_type: data.loan_type,
        principal_amount: data.principal_amount,
        outstanding_amount: data.principal_amount,
        monthly_deduction: data.monthly_deduction,
        interest_rate: data.interest_rate || 0,
        start_date: data.start_date,
        expected_end_date: data.expected_end_date,
        status: "pending",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans", companyId] });
      toast.success("Loan application submitted for approval");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit loan application");
    },
  });

  const approveLoanMutation = useMutation({
    mutationFn: async (loanId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("loans")
        .update({
          status: "active",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", loanId)
        .eq("status", "pending");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans", companyId] });
      toast.success("Loan approved successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to approve loan");
    },
  });

  const rejectLoanMutation = useMutation({
    mutationFn: async ({ loanId, reason }: { loanId: string; reason: string }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("loans")
        .update({
          status: "rejected",
          rejection_reason: reason,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", loanId)
        .eq("status", "pending");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans", companyId] });
      toast.success("Loan rejected");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reject loan");
    },
  });

  const updateLoanMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Tables<"loans">> }) => {
      const { error } = await supabase.from("loans").update(updates).eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans", companyId] });
      toast.success("Loan updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update loan");
    },
  });

  return {
    loans,
    stats,
    isLoading,
    createLoan: createLoanMutation.mutate,
    approveLoan: approveLoanMutation.mutate,
    rejectLoan: rejectLoanMutation.mutate,
    updateLoan: updateLoanMutation.mutate,
    isCreating: createLoanMutation.isPending,
    isApproving: approveLoanMutation.isPending,
    isRejecting: rejectLoanMutation.isPending,
    isUpdating: updateLoanMutation.isPending,
  };
};

export const useLoanRecoverySchedule = (loanId: string | undefined) => {
  return useQuery({
    queryKey: ["loan-schedule", loanId],
    queryFn: async () => {
      if (!loanId) return [];

      const { data, error } = await supabase
        .from("loan_recovery_schedules")
        .select("*")
        .eq("loan_id", loanId)
        .order("installment_number");

      if (error) throw error;
      return data;
    },
    enabled: !!loanId,
  });
};
