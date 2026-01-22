import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Building2, 
  UserPlus, 
  CreditCard, 
  Activity,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivityItem {
  id: string;
  type: "company_created" | "user_joined" | "subscription_changed" | "payroll_run";
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export function PlatformActivity() {
  const { data: activity = [], isLoading } = useQuery({
    queryKey: ["platform-activity"],
    queryFn: async () => {
      // Fetch recent companies
      const { data: companies } = await supabase
        .from("companies")
        .select("id, name, created_at, subscription_plan")
        .order("created_at", { ascending: false })
        .limit(10);

      // Fetch recent users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      // Fetch recent payroll runs
      const { data: payrollRuns } = await supabase
        .from("payroll_runs")
        .select("id, created_at, employee_count, total_net_salary")
        .order("created_at", { ascending: false })
        .limit(10);

      // Combine and sort activities
      const activities: ActivityItem[] = [];

      companies?.forEach((company) => {
        activities.push({
          id: `company-${company.id}`,
          type: "company_created",
          description: `New company "${company.name}" registered`,
          timestamp: new Date(company.created_at),
          metadata: { plan: company.subscription_plan },
        });
      });

      profiles?.forEach((profile) => {
        activities.push({
          id: `user-${profile.id}`,
          type: "user_joined",
          description: `${profile.first_name || ""} ${profile.last_name || ""} joined the platform`,
          timestamp: new Date(profile.created_at),
          metadata: { email: profile.email },
        });
      });

      payrollRuns?.forEach((run) => {
        activities.push({
          id: `payroll-${run.id}`,
          type: "payroll_run",
          description: `Payroll processed for ${run.employee_count} employees`,
          timestamp: new Date(run.created_at),
          metadata: { amount: run.total_net_salary },
        });
      });

      // Sort by timestamp descending
      return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 20);
    },
  });

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "company_created":
        return <Building2 className="h-4 w-4" />;
      case "user_joined":
        return <UserPlus className="h-4 w-4" />;
      case "subscription_changed":
        return <CreditCard className="h-4 w-4" />;
      case "payroll_run":
        return <Activity className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: ActivityItem["type"]) => {
    switch (type) {
      case "company_created":
        return "bg-blue-500/10 text-blue-500";
      case "user_joined":
        return "bg-green-500/10 text-green-500";
      case "subscription_changed":
        return "bg-amber-500/10 text-amber-500";
      case "payroll_run":
        return "bg-purple-500/10 text-purple-500";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Platform Activity
        </CardTitle>
        <CardDescription>
          Recent activity across all companies
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            No recent activity
          </div>
        ) : (
          <div className="space-y-4">
            {activity.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-4 rounded-lg border p-4"
              >
                <div className={`rounded-lg p-2 ${getActivityColor(item.type)}`}>
                  {getActivityIcon(item.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-medium">{item.description}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDistanceToNow(item.timestamp, { addSuffix: true })}</span>
                    {item.metadata?.plan && (
                      <Badge variant="secondary" className="ml-2">
                        {item.metadata.plan}
                      </Badge>
                    )}
                    {item.metadata?.amount && (
                      <Badge variant="secondary" className="ml-2">
                        ${Number(item.metadata.amount).toLocaleString()}
                      </Badge>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
