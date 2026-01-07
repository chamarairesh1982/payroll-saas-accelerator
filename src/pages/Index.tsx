import { Users, DollarSign, Building2, Clock, TrendingUp, TrendingDown } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { PayrollChart } from "@/components/dashboard/PayrollChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { UpcomingPayments } from "@/components/dashboard/UpcomingPayments";
import { SetupChecklist } from "@/components/dashboard/SetupChecklist";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `Rs. ${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `Rs. ${(value / 1000).toFixed(0)}K`;
  }
  return `Rs. ${value.toLocaleString()}`;
};

const Dashboard = () => {
  const { profile } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();

  // Calculate growth percentage
  const payrollGrowth =
    stats?.previousMonthPayroll && stats.previousMonthPayroll > 0
      ? ((stats.monthlyPayroll - stats.previousMonthPayroll) / stats.previousMonthPayroll) * 100
      : 0;

  const showSetupChecklist = stats && stats.setupProgress.completedSteps < stats.setupProgress.totalSteps;

  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">
            {profile?.first_name
              ? `Welcome back, ${profile.first_name}! Here's your payroll overview.`
              : "Welcome back! Here's your payroll overview."}
          </p>
        </div>
      </div>

      {/* Setup Checklist - Show when setup is incomplete */}
      {showSetupChecklist && stats && (
        <div className="mb-8">
          <SetupChecklist setupProgress={stats.setupProgress} />
        </div>
      )}

      {/* Stats Grid */}
      <div className="card-grid mb-8">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="stat-card">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="mt-2 h-8 w-32" />
                <Skeleton className="mt-2 h-4 w-20" />
              </div>
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Total Employees"
              value={stats?.employeeCount.toString() ?? "0"}
              subtitle={
                stats?.newEmployeesThisMonth
                  ? `${stats.newEmployeesThisMonth} new this month`
                  : "Active employees"
              }
              icon={<Users className="h-6 w-6" />}
              trend={
                stats?.newEmployeesThisMonth
                  ? { value: stats.newEmployeesThisMonth, isPositive: true }
                  : undefined
              }
              variant="primary"
              delay={0.1}
            />
            <StatCard
              title="Monthly Payroll"
              value={formatCurrency(stats?.monthlyPayroll ?? 0)}
              subtitle={
                stats?.monthlyPayroll
                  ? new Date().toLocaleString("default", { month: "long", year: "numeric" })
                  : "No payroll run yet"
              }
              icon={<DollarSign className="h-6 w-6" />}
              trend={
                payrollGrowth !== 0
                  ? { value: Math.abs(payrollGrowth), isPositive: payrollGrowth > 0 }
                  : undefined
              }
              variant="success"
              delay={0.15}
            />
            <StatCard
              title="EPF/ETF Due"
              value={formatCurrency(stats?.epfEtfDue ?? 0)}
              subtitle={stats?.epfEtfDue ? "Due 15th next month" : "No dues pending"}
              icon={<Building2 className="h-6 w-6" />}
              variant="warning"
              delay={0.2}
            />
            <StatCard
              title="Pending Approvals"
              value={stats?.pendingApprovals.toString() ?? "0"}
              subtitle={
                stats?.pendingApprovals
                  ? `${stats.pendingLeave} leave, ${stats.pendingOvertime} overtime`
                  : "All caught up!"
              }
              icon={<Clock className="h-6 w-6" />}
              variant="accent"
              delay={0.25}
            />
          </>
        )}
      </div>

      {/* Charts and Activity */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        <div className="lg:col-span-2">
          <PayrollChart data={stats?.payrollTrend} isLoading={isLoading} />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>

      {/* Quick Actions and Payments */}
      <div className="grid gap-6 lg:grid-cols-2">
        <QuickActions />
        <UpcomingPayments
          epfEtfDue={stats?.epfEtfDue}
          monthlyPayroll={stats?.monthlyPayroll}
          isLoading={isLoading}
        />
      </div>
    </MainLayout>
  );
};

export default Dashboard;
