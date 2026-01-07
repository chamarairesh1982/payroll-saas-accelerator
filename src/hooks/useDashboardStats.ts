import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export interface DashboardStats {
  employeeCount: number;
  newEmployeesThisMonth: number;
  monthlyPayroll: number;
  previousMonthPayroll: number;
  epfEtfDue: number;
  pendingApprovals: number;
  pendingLeave: number;
  pendingOvertime: number;
  payrollTrend: {
    month: string;
    gross: number;
    net: number;
    epf: number;
    etf: number;
  }[];
  setupProgress: {
    hasEmployees: boolean;
    hasLeaveTypes: boolean;
    hasOvertimeRates: boolean;
    hasSalaryComponents: boolean;
    hasTaxSlabs: boolean;
    hasPayrollRun: boolean;
    completedSteps: number;
    totalSteps: number;
  };
}

export const useDashboardStats = () => {
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  return useQuery({
    queryKey: ["dashboard-stats", companyId],
    queryFn: async (): Promise<DashboardStats> => {
      if (!companyId) {
        return getEmptyStats();
      }

      const now = new Date();
      const thisMonthStart = startOfMonth(now);
      const thisMonthEnd = endOfMonth(now);

      // Fetch all data in parallel
      const [
        employeesResult,
        newEmployeesResult,
        latestPayrollResult,
        previousPayrollResult,
        pendingLeaveResult,
        pendingOvertimeResult,
        payrollTrendResult,
        leaveTypesResult,
        overtimeRatesResult,
        salaryComponentsResult,
        taxSlabsResult,
      ] = await Promise.all([
        // Total active employees
        supabase
          .from("profiles")
          .select("id", { count: "exact" })
          .eq("company_id", companyId)
          .or("status.eq.active,status.is.null"),

        // New employees this month
        supabase
          .from("profiles")
          .select("id", { count: "exact" })
          .eq("company_id", companyId)
          .gte("date_of_joining", thisMonthStart.toISOString())
          .lte("date_of_joining", thisMonthEnd.toISOString()),

        // Latest payroll run
        supabase
          .from("payroll_runs")
          .select("*")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),

        // Previous month payroll
        supabase
          .from("payroll_runs")
          .select("total_gross_salary")
          .eq("company_id", companyId)
          .gte("pay_period_start", startOfMonth(subMonths(now, 1)).toISOString())
          .lte("pay_period_end", endOfMonth(subMonths(now, 1)).toISOString())
          .limit(1)
          .maybeSingle(),

        // Pending leave requests
        supabase
          .from("leave_requests")
          .select("id", { count: "exact" })
          .eq("status", "pending"),

        // Pending overtime entries
        supabase
          .from("overtime_entries")
          .select("id", { count: "exact" })
          .eq("status", "pending"),

        // Payroll trend (last 6 months)
        supabase
          .from("payroll_runs")
          .select("pay_period_start, total_gross_salary, total_net_salary, total_epf_employer, total_etf")
          .eq("company_id", companyId)
          .gte("pay_period_start", startOfMonth(subMonths(now, 5)).toISOString())
          .order("pay_period_start", { ascending: true }),

        // Setup check: Leave types
        supabase
          .from("leave_types")
          .select("id", { count: "exact" })
          .eq("company_id", companyId)
          .eq("is_active", true),

        // Setup check: Overtime rates
        supabase
          .from("overtime_rates")
          .select("id", { count: "exact" })
          .eq("company_id", companyId)
          .eq("is_active", true),

        // Setup check: Salary components
        supabase
          .from("salary_components")
          .select("id", { count: "exact" })
          .eq("company_id", companyId)
          .eq("is_active", true),

        // Setup check: Tax slabs
        supabase
          .from("tax_slabs")
          .select("id", { count: "exact" })
          .eq("company_id", companyId)
          .eq("is_active", true),
      ]);

      const employeeCount = employeesResult.count ?? 0;
      const newEmployeesThisMonth = newEmployeesResult.count ?? 0;
      const latestPayroll = latestPayrollResult.data;
      const previousPayroll = previousPayrollResult.data;
      const pendingLeave = pendingLeaveResult.count ?? 0;
      const pendingOvertime = pendingOvertimeResult.count ?? 0;

      // Calculate EPF/ETF due from latest payroll
      const epfEtfDue = latestPayroll
        ? (latestPayroll.total_epf_employee ?? 0) +
          (latestPayroll.total_epf_employer ?? 0) +
          (latestPayroll.total_etf ?? 0)
        : 0;

      // Format payroll trend
      const payrollTrend = (payrollTrendResult.data ?? []).map((run) => ({
        month: format(new Date(run.pay_period_start), "MMM"),
        gross: run.total_gross_salary ?? 0,
        net: run.total_net_salary ?? 0,
        epf: run.total_epf_employer ?? 0,
        etf: run.total_etf ?? 0,
      }));

      // Setup progress
      const hasEmployees = employeeCount > 0;
      const hasLeaveTypes = (leaveTypesResult.count ?? 0) > 0;
      const hasOvertimeRates = (overtimeRatesResult.count ?? 0) > 0;
      const hasSalaryComponents = (salaryComponentsResult.count ?? 0) > 0;
      const hasTaxSlabs = (taxSlabsResult.count ?? 0) > 0;
      const hasPayrollRun = !!latestPayroll;

      const completedSteps = [
        hasEmployees,
        hasLeaveTypes,
        hasOvertimeRates,
        hasSalaryComponents,
        hasTaxSlabs,
        hasPayrollRun,
      ].filter(Boolean).length;

      return {
        employeeCount,
        newEmployeesThisMonth,
        monthlyPayroll: latestPayroll?.total_gross_salary ?? 0,
        previousMonthPayroll: previousPayroll?.total_gross_salary ?? 0,
        epfEtfDue,
        pendingApprovals: pendingLeave + pendingOvertime,
        pendingLeave,
        pendingOvertime,
        payrollTrend,
        setupProgress: {
          hasEmployees,
          hasLeaveTypes,
          hasOvertimeRates,
          hasSalaryComponents,
          hasTaxSlabs,
          hasPayrollRun,
          completedSteps,
          totalSteps: 6,
        },
      };
    },
    enabled: !!companyId,
    staleTime: 30000, // Cache for 30 seconds
  });
};

function getEmptyStats(): DashboardStats {
  return {
    employeeCount: 0,
    newEmployeesThisMonth: 0,
    monthlyPayroll: 0,
    previousMonthPayroll: 0,
    epfEtfDue: 0,
    pendingApprovals: 0,
    pendingLeave: 0,
    pendingOvertime: 0,
    payrollTrend: [],
    setupProgress: {
      hasEmployees: false,
      hasLeaveTypes: false,
      hasOvertimeRates: false,
      hasSalaryComponents: false,
      hasTaxSlabs: false,
      hasPayrollRun: false,
      completedSteps: 0,
      totalSteps: 6,
    },
  };
}
