import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Building2, 
  Users, 
  CreditCard, 
  Activity,
  Crown,
  Settings,
  BarChart3
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlatformOverview } from "@/components/superadmin/PlatformOverview";
import { CompaniesManagement } from "@/components/superadmin/CompaniesManagement";
import { PlansManagement } from "@/components/superadmin/PlansManagement";
import { PlatformActivity } from "@/components/superadmin/PlatformActivity";
import { PlatformSettings } from "@/components/superadmin/PlatformSettings";
import { SuperAdminManagement } from "@/components/superadmin/SuperAdminManagement";

const SuperAdmin = () => {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const isSuperAdmin = role === "super_admin";

  // Fetch platform-wide statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      const [companiesRes, profilesRes, payrollRes, plansRes] = await Promise.all([
        supabase.from("companies").select("id, subscription_plan, subscription_status, created_at, is_active"),
        supabase.from("profiles").select("id, company_id, created_at"),
        supabase.from("payroll_runs").select("total_net_salary, created_at"),
        supabase.from("subscription_plans").select("*"),
      ]);

      const companies = companiesRes.data || [];
      const profiles = profilesRes.data || [];
      const payrollRuns = payrollRes.data || [];
      const plans = plansRes.data || [];

      // Calculate MRR based on subscription plans
      const mrr = companies.reduce((sum, company) => {
        const plan = plans.find(p => p.plan_type === company.subscription_plan);
        if (plan && company.subscription_status === 'active') {
          return sum + Number(plan.price_monthly);
        }
        return sum;
      }, 0);

      // Count by plan
      const planCounts = {
        free: companies.filter(c => c.subscription_plan === 'free').length,
        pro: companies.filter(c => c.subscription_plan === 'pro').length,
        enterprise: companies.filter(c => c.subscription_plan === 'enterprise').length,
      };

      // New signups this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const newCompanies = companies.filter(c => 
        new Date(c.created_at) >= thisMonth
      ).length;

      // Total payroll processed
      const totalPayroll = payrollRuns.reduce((sum, run) => 
        sum + Number(run.total_net_salary), 0
      );

      return {
        totalCompanies: companies.length,
        activeCompanies: companies.filter(c => c.is_active).length,
        totalUsers: profiles.length,
        mrr,
        planCounts,
        newCompanies,
        totalPayroll,
        companies,
        profiles,
        plans,
      };
    },
    enabled: isSuperAdmin,
  });

  if (!isSuperAdmin) {
    return (
      <MainLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center">
            <Crown className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">
              Only super admins can access the platform dashboard.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <div className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-amber-500" />
            <h1 className="page-title">Platform Admin</h1>
          </div>
          <p className="page-description">
            Manage all companies, subscriptions, and platform settings.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-3xl grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="companies" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Companies</span>
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Plans</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Activity</span>
          </TabsTrigger>
          <TabsTrigger value="admins" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Admins</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <PlatformOverview stats={stats} isLoading={statsLoading} />
        </TabsContent>

        <TabsContent value="companies">
          <CompaniesManagement />
        </TabsContent>

        <TabsContent value="plans">
          <PlansManagement plans={stats?.plans || []} />
        </TabsContent>

        <TabsContent value="activity">
          <PlatformActivity />
        </TabsContent>

        <TabsContent value="admins">
          <SuperAdminManagement />
        </TabsContent>

        <TabsContent value="settings">
          <PlatformSettings />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default SuperAdmin;
