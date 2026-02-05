import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { EPF_EMPLOYEE_RATE, EPF_EMPLOYER_RATE, ETF_EMPLOYER_RATE } from "@/types/payroll";

export interface PayrollReportData {
  employeeNumber: string;
  name: string;
  department: string;
  basicSalary: number;
  grossSalary: number;
  netSalary: number;
  epfEmployee: number;
  epfEmployer: number;
  etfEmployer: number;
  payeTax: number;
}

export interface ContributionData {
  employeeNumber: string;
  name: string;
  nic: string;
  epfNumber: string;
  basicSalary: number;
  epfEmployee: number;
  epfEmployer: number;
  epfTotal: number;
  etfEmployer: number;
}

export interface LeaveBalanceData {
  employeeNumber: string;
  name: string;
  department: string;
  balances: {
    leaveTypeId: string;
    leaveTypeCode: string;
    leaveTypeName: string;
    entitlement: number;
    taken: number;
    available: number;
  }[];
}

// Hook to get payroll report data for a specific payroll run or month
export const usePayrollReportData = (payrollRunId?: string) => {
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  return useQuery({
    queryKey: ["payroll-report", companyId, payrollRunId],
    queryFn: async () => {
      if (!companyId) return { payslips: [], totals: null, departmentSummary: {} };

      let query = supabase
        .from("payslips")
        .select(`
          *,
          employee:profiles!payslips_employee_id_fkey(
            id, first_name, last_name, employee_number, department, designation, 
            basic_salary, bank_name, bank_account_number, epf_number, nic
          ),
          payroll_run:payroll_runs!payslips_payroll_run_id_fkey(
            id, pay_period_start, pay_period_end, pay_date, company_id
          )
        `);

      if (payrollRunId) {
        query = query.eq("payroll_run_id", payrollRunId);
      } else {
        // Get latest payroll run for the company
        const { data: latestRun } = await supabase
          .from("payroll_runs")
          .select("id")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (latestRun) {
          query = query.eq("payroll_run_id", latestRun.id);
        } else {
          return { payslips: [], totals: null, departmentSummary: {} };
        }
      }

      const { data: payslips, error } = await query;
      if (error) throw error;

      // Calculate totals
      const totals = {
        totalGrossSalary: payslips?.reduce((sum, p) => sum + Number(p.gross_salary), 0) || 0,
        totalNetSalary: payslips?.reduce((sum, p) => sum + Number(p.net_salary), 0) || 0,
        totalEpfEmployee: payslips?.reduce((sum, p) => sum + Number(p.epf_employee), 0) || 0,
        totalEpfEmployer: payslips?.reduce((sum, p) => sum + Number(p.epf_employer), 0) || 0,
        totalEtf: payslips?.reduce((sum, p) => sum + Number(p.etf_employer), 0) || 0,
        totalPaye: payslips?.reduce((sum, p) => sum + Number(p.paye_tax), 0) || 0,
        employeeCount: payslips?.length || 0,
      };

      // Group by department
      const departmentSummary: Record<string, { count: number; basicTotal: number; grossTotal: number; netTotal: number }> = {};
      payslips?.forEach((p: any) => {
        const dept = p.employee?.department || "Unassigned";
        if (!departmentSummary[dept]) {
          departmentSummary[dept] = { count: 0, basicTotal: 0, grossTotal: 0, netTotal: 0 };
        }
        departmentSummary[dept].count++;
        departmentSummary[dept].basicTotal += Number(p.basic_salary);
        departmentSummary[dept].grossTotal += Number(p.gross_salary);
        departmentSummary[dept].netTotal += Number(p.net_salary);
      });

      return { payslips: payslips || [], totals, departmentSummary };
    },
    enabled: !!companyId,
  });
};

// Hook to get contribution report data from active employees
export const useContributionReportData = () => {
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  return useQuery({
    queryKey: ["contribution-report", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data: employees, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, employee_number, nic, epf_number, basic_salary, department")
        .eq("company_id", companyId)
        .eq("status", "active");

      if (error) throw error;

      return (employees || []).map((emp) => {
        const basicSalary = Number(emp.basic_salary) || 0;
        const epfEmployee = Math.round(basicSalary * EPF_EMPLOYEE_RATE);
        const epfEmployer = Math.round(basicSalary * EPF_EMPLOYER_RATE);
        const etfEmployer = Math.round(basicSalary * ETF_EMPLOYER_RATE);

        return {
          employeeNumber: emp.employee_number || "",
          name: `${emp.first_name || ""} ${emp.last_name || ""}`.trim(),
          nic: emp.nic || "",
          epfNumber: emp.epf_number || "",
          basicSalary,
          epfEmployee,
          epfEmployer,
          epfTotal: epfEmployee + epfEmployer,
          etfEmployer,
        };
      });
    },
    enabled: !!companyId,
  });
};

// Hook to get leave balance report data
export const useLeaveBalanceReportData = () => {
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  return useQuery({
    queryKey: ["leave-balance-report", companyId],
    queryFn: async () => {
      if (!companyId) return { employees: [], leaveTypes: [] };

      // Get leave types
      const { data: leaveTypes, error: ltError } = await supabase
        .from("leave_types")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true);

      if (ltError) throw ltError;

      // Get employees
      const { data: employees, error: empError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, employee_number, department")
        .eq("company_id", companyId)
        .eq("status", "active");

      if (empError) throw empError;

      // Get leave requests for current year
      const currentYear = new Date().getFullYear();
      const yearStart = `${currentYear}-01-01`;
      const yearEnd = `${currentYear}-12-31`;

      const { data: leaveRequests, error: lrError } = await supabase
        .from("leave_requests")
        .select("employee_id, leave_type_id, days, status")
        .in("employee_id", employees?.map((e) => e.id) || [])
        .gte("start_date", yearStart)
        .lte("end_date", yearEnd)
        .eq("status", "approved");

      if (lrError) throw lrError;

      // Calculate balances for each employee
      const employeeBalances = (employees || []).map((emp) => {
        const empLeaves = leaveRequests?.filter((lr) => lr.employee_id === emp.id) || [];
        
        const balances = (leaveTypes || []).map((lt) => {
          const taken = empLeaves
            .filter((lr) => lr.leave_type_id === lt.id)
            .reduce((sum, lr) => sum + Number(lr.days), 0);

          return {
            leaveTypeId: lt.id,
            leaveTypeCode: lt.code,
            leaveTypeName: lt.name,
            entitlement: lt.days_per_year,
            taken,
            available: Math.max(0, lt.days_per_year - taken),
          };
        });

        return {
          employeeNumber: emp.employee_number || "",
          name: `${emp.first_name || ""} ${emp.last_name || ""}`.trim(),
          department: emp.department || "",
          balances,
        };
      });

      return { employees: employeeBalances, leaveTypes: leaveTypes || [] };
    },
    enabled: !!companyId,
  });
};

// Bank file data from payroll run
export const useBankFileData = (payrollRunId?: string) => {
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  return useQuery({
    queryKey: ["bank-file-data", companyId, payrollRunId],
    queryFn: async () => {
      if (!companyId) return [];

      let targetRunId = payrollRunId;

      if (!targetRunId) {
        const { data: latestRun } = await supabase
          .from("payroll_runs")
          .select("id")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (!latestRun) return [];
        targetRunId = latestRun.id;
      }

      const { data: payslips, error } = await supabase
        .from("payslips")
        .select(`
          net_salary,
          employee:profiles!payslips_employee_id_fkey(
            first_name, last_name, employee_number, bank_name, bank_branch, 
            bank_account_number, epf_number, nic
          )
        `)
        .eq("payroll_run_id", targetRunId);

      if (error) throw error;

      return (payslips || []).map((p: any) => ({
        employeeNumber: p.employee?.employee_number || "",
        firstName: p.employee?.first_name || "",
        lastName: p.employee?.last_name || "",
        bankName: p.employee?.bank_name || "",
        bankBranch: p.employee?.bank_branch || "",
        accountNumber: p.employee?.bank_account_number || "",
        netSalary: Number(p.net_salary),
        epfNumber: p.employee?.epf_number || "",
        nic: p.employee?.nic || "",
      }));
    },
    enabled: !!companyId,
  });
};
