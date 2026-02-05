import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type PayrollRun = Tables<"payroll_runs">;
export type Payslip = Tables<"payslips">;

export const usePayrollRuns = () => {
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  return useQuery({
    queryKey: ["payroll-runs", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("payroll_runs")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });
};

export const usePayslips = (payrollRunId?: string) => {
  return useQuery({
    queryKey: ["payslips", payrollRunId],
    queryFn: async () => {
      if (!payrollRunId) return [];

      const { data, error } = await supabase
        .from("payslips")
        .select(`
          *,
          employee:profiles!payslips_employee_id_fkey(
            id, first_name, last_name, employee_number, department, designation, 
            basic_salary, bank_name, bank_account_number, epf_number
          )
        `)
        .eq("payroll_run_id", payrollRunId);

      if (error) throw error;
      return data;
    },
    enabled: !!payrollRunId,
  });
};

export const useCreatePayrollRun = () => {
  const { profile, user } = useAuth();
  const companyId = profile?.company_id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      payPeriodStart: string;
      payPeriodEnd: string;
      payDate: string;
      payslips: {
        employeeId: string;
        basicSalary: number;
        grossSalary: number;
        netSalary: number;
        epfEmployee: number;
        epfEmployer: number;
        etfEmployer: number;
        payeTax: number;
        taxableIncome: number;
        allowances: any[];
        deductions: any[];
        workedDays: number;
        workingDays: number;
        otHours: number;
        otAmount: number;
      }[];
    }) => {
      if (!companyId || !user) throw new Error("Not authenticated");

      // Calculate totals
      const totals = data.payslips.reduce(
        (acc, p) => ({
          totalGross: acc.totalGross + p.grossSalary,
          totalNet: acc.totalNet + p.netSalary,
          totalEpfEmployee: acc.totalEpfEmployee + p.epfEmployee,
          totalEpfEmployer: acc.totalEpfEmployer + p.epfEmployer,
          totalEtf: acc.totalEtf + p.etfEmployer,
          totalPaye: acc.totalPaye + p.payeTax,
        }),
        {
          totalGross: 0,
          totalNet: 0,
          totalEpfEmployee: 0,
          totalEpfEmployer: 0,
          totalEtf: 0,
          totalPaye: 0,
        }
      );

      // Create payroll run
      const { data: payrollRun, error: runError } = await supabase
        .from("payroll_runs")
        .insert({
          company_id: companyId,
          created_by: user.id,
          pay_period_start: data.payPeriodStart,
          pay_period_end: data.payPeriodEnd,
          pay_date: data.payDate,
          status: "approved",
          employee_count: data.payslips.length,
          total_gross_salary: totals.totalGross,
          total_net_salary: totals.totalNet,
          total_epf_employee: totals.totalEpfEmployee,
          total_epf_employer: totals.totalEpfEmployer,
          total_etf: totals.totalEtf,
          total_paye: totals.totalPaye,
        })
        .select()
        .single();

      if (runError) throw runError;

      // Create payslips
      const payslipInserts: TablesInsert<"payslips">[] = data.payslips.map((p) => ({
        payroll_run_id: payrollRun.id,
        employee_id: p.employeeId,
        basic_salary: p.basicSalary,
        gross_salary: p.grossSalary,
        net_salary: p.netSalary,
        epf_employee: p.epfEmployee,
        epf_employer: p.epfEmployer,
        etf_employer: p.etfEmployer,
        paye_tax: p.payeTax,
        taxable_income: p.taxableIncome,
        allowances: p.allowances,
        deductions: p.deductions,
        working_days: p.workingDays,
        worked_days: p.workedDays,
        ot_hours: p.otHours,
        ot_amount: p.otAmount,
      }));

      const { error: payslipsError } = await supabase
        .from("payslips")
        .insert(payslipInserts);

      if (payslipsError) throw payslipsError;

      return payrollRun;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-runs", companyId] });
      toast.success("Payroll processed successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to process payroll");
    },
  });
};

// Hook to get employee's own payslips with full employee data
export const useMyPayslips = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-payslips", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get full profile for payslip generation
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, employee_number, department, designation, epf_number, bank_name, bank_account_number")
        .eq("id", user.id)
        .single();

      const { data, error } = await supabase
        .from("payslips")
        .select(`
          *,
          payroll_run:payroll_runs!payslips_payroll_run_id_fkey(
            pay_period_start, pay_period_end, pay_date, status,
            company:companies!payroll_runs_company_id_fkey(name)
          )
        `)
        .eq("employee_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Attach employee profile to each payslip for PDF generation
      return (data || []).map(p => ({ ...p, my_profile: myProfile }));
    },
    enabled: !!user?.id,
  });
};

// Hook to send payslip emails
export const useSendPayslipEmails = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { payrollRunId: string; employeeIds?: string[] }) => {
      const { data: result, error } = await supabase.functions.invoke("send-payslip-email", {
        body: {
          payroll_run_id: data.payrollRunId,
          employee_ids: data.employeeIds,
        },
      });

      if (error) throw error;
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["notification-logs"] });
      if (result.sent > 0) {
        toast.success(`Payslips sent to ${result.sent} employee${result.sent > 1 ? "s" : ""}`);
      }
      if (result.failed > 0) {
        toast.error(`Failed to send ${result.failed} payslip${result.failed > 1 ? "s" : ""}`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send payslip emails");
    },
  });
};
