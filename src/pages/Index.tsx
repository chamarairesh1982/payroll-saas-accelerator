import { Users, DollarSign, Calendar, Clock, TrendingUp, Building2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { PayrollChart } from "@/components/dashboard/PayrollChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { UpcomingPayments } from "@/components/dashboard/UpcomingPayments";

const Dashboard = () => {
  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">Welcome back! Here's your payroll overview.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="card-grid mb-8">
        <StatCard
          title="Total Employees"
          value="45"
          subtitle="3 new this month"
          icon={<Users className="h-6 w-6" />}
          trend={{ value: 7.2, isPositive: true }}
          variant="primary"
          delay={0.1}
        />
        <StatCard
          title="Monthly Payroll"
          value="Rs. 5.2M"
          subtitle="December 2024"
          icon={<DollarSign className="h-6 w-6" />}
          trend={{ value: 6.3, isPositive: true }}
          variant="success"
          delay={0.15}
        />
        <StatCard
          title="EPF/ETF Due"
          value="Rs. 780K"
          subtitle="Due 15 Dec"
          icon={<Building2 className="h-6 w-6" />}
          variant="warning"
          delay={0.2}
        />
        <StatCard
          title="Pending Approvals"
          value="8"
          subtitle="Leave & overtime"
          icon={<Clock className="h-6 w-6" />}
          variant="accent"
          delay={0.25}
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        <div className="lg:col-span-2">
          <PayrollChart />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>

      {/* Quick Actions and Payments */}
      <div className="grid gap-6 lg:grid-cols-2">
        <QuickActions />
        <UpcomingPayments />
      </div>
    </MainLayout>
  );
};

export default Dashboard;
