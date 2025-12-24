import { motion } from "framer-motion";
import { Check, Clock, AlertCircle, XCircle, DollarSign, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type: "payroll" | "leave" | "employee" | "overtime";
  action: string;
  description: string;
  timestamp: string;
  status: "completed" | "pending" | "warning" | "error";
}

const activities: Activity[] = [
  {
    id: "1",
    type: "payroll",
    action: "Payroll Processed",
    description: "December 2024 payroll for 45 employees",
    timestamp: "2 hours ago",
    status: "completed",
  },
  {
    id: "2",
    type: "leave",
    action: "Leave Request",
    description: "John Silva requested 3 days annual leave",
    timestamp: "3 hours ago",
    status: "pending",
  },
  {
    id: "3",
    type: "employee",
    action: "New Employee",
    description: "Nimal Perera joined as Senior Developer",
    timestamp: "Yesterday",
    status: "completed",
  },
  {
    id: "4",
    type: "overtime",
    action: "Overtime Submitted",
    description: "5 overtime requests for approval",
    timestamp: "Yesterday",
    status: "warning",
  },
  {
    id: "5",
    type: "payroll",
    action: "EPF Submission",
    description: "November EPF/ETF submission due",
    timestamp: "2 days ago",
    status: "error",
  },
];

const typeIcons = {
  payroll: DollarSign,
  leave: Calendar,
  employee: User,
  overtime: Clock,
};

const statusStyles = {
  completed: {
    icon: Check,
    bg: "bg-success/10",
    text: "text-success",
  },
  pending: {
    icon: Clock,
    bg: "bg-warning/10",
    text: "text-warning",
  },
  warning: {
    icon: AlertCircle,
    bg: "bg-warning/10",
    text: "text-warning",
  },
  error: {
    icon: XCircle,
    bg: "bg-destructive/10",
    text: "text-destructive",
  },
};

export function RecentActivity() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="rounded-xl bg-card p-6 shadow-md"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">Latest payroll updates</p>
        </div>
        <button className="text-sm font-medium text-primary hover:underline">
          View all
        </button>
      </div>
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const TypeIcon = typeIcons[activity.type];
          const StatusIcon = statusStyles[activity.status].icon;
          
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50"
            >
              <div className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                statusStyles[activity.status].bg
              )}>
                <TypeIcon className={cn("h-5 w-5", statusStyles[activity.status].text)} />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{activity.action}</p>
                  <StatusIcon className={cn("h-4 w-4", statusStyles[activity.status].text)} />
                </div>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
