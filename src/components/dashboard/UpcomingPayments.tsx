import { motion } from "framer-motion";
import { Calendar, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Payment {
  id: string;
  title: string;
  dueDate: string;
  amount: number;
  status: "upcoming" | "due" | "overdue";
}

const payments: Payment[] = [
  {
    id: "1",
    title: "December Salary Payment",
    dueDate: "25 Dec 2024",
    amount: 4380000,
    status: "upcoming",
  },
  {
    id: "2",
    title: "EPF/ETF Contribution - Nov",
    dueDate: "15 Dec 2024",
    amount: 780000,
    status: "due",
  },
  {
    id: "3",
    title: "PAYE Tax - Q4",
    dueDate: "31 Dec 2024",
    amount: 245000,
    status: "upcoming",
  },
];

const statusStyles = {
  upcoming: {
    bg: "bg-primary/10",
    text: "text-primary",
    icon: Calendar,
    label: "Upcoming",
  },
  due: {
    bg: "bg-warning/10",
    text: "text-warning",
    icon: AlertTriangle,
    label: "Due Soon",
  },
  overdue: {
    bg: "bg-destructive/10",
    text: "text-destructive",
    icon: AlertTriangle,
    label: "Overdue",
  },
};

export function UpcomingPayments() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="rounded-xl bg-card p-6 shadow-md"
    >
      <div className="mb-6">
        <h3 className="font-display text-lg font-semibold">Upcoming Payments</h3>
        <p className="text-sm text-muted-foreground">Scheduled disbursements</p>
      </div>
      <div className="space-y-4">
        {payments.map((payment, index) => {
          const StatusIcon = statusStyles[payment.status].icon;
          
          return (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
              className="flex items-center justify-between rounded-lg border border-border p-4"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  statusStyles[payment.status].bg
                )}>
                  <StatusIcon className={cn("h-5 w-5", statusStyles[payment.status].text)} />
                </div>
                <div>
                  <p className="font-medium">{payment.title}</p>
                  <p className="text-sm text-muted-foreground">{payment.dueDate}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display font-semibold">
                  Rs. {payment.amount.toLocaleString()}
                </p>
                <span className={cn(
                  "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                  statusStyles[payment.status].bg,
                  statusStyles[payment.status].text
                )}>
                  {statusStyles[payment.status].label}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
