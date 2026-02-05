import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface LoanDeduction {
  employeeId: string;
  loanId: string;
  loanType: string;
  monthlyDeduction: number;
  outstandingAmount: number;
}

// Hook to get active loan deductions for payroll calculation
export const useActiveLoanDeductions = (employeeIds: string[]) => {
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  return useQuery({
    queryKey: ["active-loan-deductions", companyId, employeeIds],
    queryFn: async () => {
      if (!companyId || employeeIds.length === 0) return {};

      const { data, error } = await supabase
        .from("loans")
        .select("id, employee_id, loan_type, monthly_deduction, outstanding_amount")
        .in("employee_id", employeeIds)
        .eq("status", "active")
        .gt("outstanding_amount", 0);

      if (error) throw error;

      // Group by employee ID
      const deductionsByEmployee: Record<string, LoanDeduction[]> = {};
      
      data?.forEach((loan) => {
        if (!deductionsByEmployee[loan.employee_id]) {
          deductionsByEmployee[loan.employee_id] = [];
        }
        deductionsByEmployee[loan.employee_id].push({
          employeeId: loan.employee_id,
          loanId: loan.id,
          loanType: loan.loan_type,
          monthlyDeduction: Number(loan.monthly_deduction),
          outstandingAmount: Number(loan.outstanding_amount),
        });
      });

      return deductionsByEmployee;
    },
    enabled: !!companyId && employeeIds.length > 0,
  });
};

// Get total loan deductions for an employee
export const getTotalLoanDeductionsFromData = (
  deductions: Record<string, LoanDeduction[]>,
  employeeId: string
): number => {
  const employeeLoans = deductions[employeeId] || [];
  return employeeLoans.reduce((sum, loan) => sum + loan.monthlyDeduction, 0);
};

// Format loan type for display
export const formatLoanTypeLabel = (loanType: string): string => {
  const labels: Record<string, string> = {
    salary_advance: "Salary Advance",
    personal_loan: "Personal Loan",
    emergency_loan: "Emergency Loan",
  };
  return labels[loanType] || loanType;
};
