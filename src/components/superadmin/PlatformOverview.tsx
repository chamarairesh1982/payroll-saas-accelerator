import { motion } from "framer-motion";
import { 
  Building2, 
  Users, 
  CreditCard, 
  TrendingUp,
  DollarSign,
  UserPlus,
  Crown,
  CheckCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface PlatformStats {
  totalCompanies: number;
  activeCompanies: number;
  totalUsers: number;
  mrr: number;
  planCounts: {
    free: number;
    pro: number;
    enterprise: number;
  };
  newCompanies: number;
  totalPayroll: number;
}

interface PlatformOverviewProps {
  stats: PlatformStats | undefined;
  isLoading: boolean;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
};

export function PlatformOverview({ stats, isLoading }: PlatformOverviewProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const planData = [
    { name: "Free", count: stats?.planCounts.free || 0, color: "bg-slate-500" },
    { name: "Pro", count: stats?.planCounts.pro || 0, color: "bg-blue-500" },
    { name: "Enterprise", count: stats?.planCounts.enterprise || 0, color: "bg-amber-500" },
  ];

  const totalPlanCount = planData.reduce((sum, p) => sum + p.count, 0);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats?.totalCompanies || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Companies</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-green-500/10 p-3">
                  <Users className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-amber-500/10 p-3">
                  <DollarSign className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{formatCurrency(stats?.mrr || 0)}</p>
                  <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-blue-500/10 p-3">
                  <UserPlus className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats?.newCompanies || 0}</p>
                  <p className="text-sm text-muted-foreground">New This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Plan Distribution & Revenue */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription Distribution
              </CardTitle>
              <CardDescription>
                Breakdown of companies by subscription plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {planData.map((plan) => (
                <div key={plan.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${plan.color}`} />
                      <span className="font-medium">{plan.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{plan.count}</span>
                      <Badge variant="secondary">
                        {totalPlanCount > 0 ? Math.round((plan.count / totalPlanCount) * 100) : 0}%
                      </Badge>
                    </div>
                  </div>
                  <Progress 
                    value={totalPlanCount > 0 ? (plan.count / totalPlanCount) * 100 : 0} 
                    className="h-2"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Platform Health
              </CardTitle>
              <CardDescription>
                Key platform metrics and indicators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Active Companies</span>
                </div>
                <Badge variant="default" className="bg-green-500">
                  {stats?.activeCompanies || 0} / {stats?.totalCompanies || 0}
                </Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-amber-500" />
                  <span>Total Payroll Processed</span>
                </div>
                <Badge variant="secondary">
                  {formatCurrency(stats?.totalPayroll || 0)}
                </Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <Crown className="h-5 w-5 text-amber-500" />
                  <span>Paid Customers</span>
                </div>
                <Badge variant="secondary">
                  {(stats?.planCounts.pro || 0) + (stats?.planCounts.enterprise || 0)}
                </Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-500" />
                  <span>Avg Users per Company</span>
                </div>
                <Badge variant="secondary">
                  {stats?.totalCompanies ? Math.round((stats.totalUsers / stats.totalCompanies) * 10) / 10 : 0}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
