import { motion } from "framer-motion";
import { Calendar, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addDays, endOfMonth } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface Payment {
  id: string;
  title: string;
  dueDate: string;
  amount: number;
  status: "upcoming" | "due" | "overdue";
}

interface UpcomingPaymentsProps {
  epfEtfDue?: number;
  monthlyPayroll?: number;
  isLoading?: boolean;
}

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

export function UpcomingPayments({ epfEtfDue = 0, monthlyPayroll = 0, isLoading }: UpcomingPaymentsProps) {
  const now = new Date();
  const endOfCurrentMonth = endOfMonth(now);
  const nextPayday = new Date(now.getFullYear(), now.getMonth(), 25);
  const epfDueDate = new Date(now.getFullYear(), now.getMonth() + 1, 15);

  // Determine if dates are soon or overdue
  const getDueStatus = (dueDate: Date): "upcoming" | "due" | "overdue" => {
    const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil < 0) return "overdue";
    if (daysUntil <= 7) return "due";
    return "upcoming";
  };

  // Generate dynamic payments based on real data
  const payments: Payment[] = [
    {
      id: "1",
      title: `${format(now, "MMMM")} Salary Payment`,
      dueDate: format(nextPayday, "dd MMM yyyy"),
      amount: monthlyPayroll * 0.84, // Approximate net salary
      status: getDueStatus(nextPayday),
    },
    {
      id: "2",
      title: `EPF/ETF Contribution - ${format(now, "MMM")}`,
      dueDate: format(epfDueDate, "dd MMM yyyy"),
      amount: epfEtfDue,
      status: getDueStatus(epfDueDate),
    },
    {
      id: "3",
      title: `PAYE Tax - Q${Math.ceil((now.getMonth() + 1) / 3)}`,
      dueDate: format(endOfCurrentMonth, "dd MMM yyyy"),
      amount: monthlyPayroll * 0.05, // Approximate PAYE
      status: getDueStatus(endOfCurrentMonth),
    },
  ].filter((p) => p.amount > 0);

  // Show placeholder if no real data
  const showPlaceholder = payments.length === 0;

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="rounded-xl bg-card p-6 shadow-md"
      >
        <div className="mb-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-2 h-4 w-32" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </motion.div>
    );
  }

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
        {showPlaceholder ? (
          <div className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-center">
            <Calendar className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              Run your first payroll to see upcoming payments
            </p>
          </div>
        ) : (
          payments.map((payment, index) => {
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
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      statusStyles[payment.status].bg
                    )}
                  >
                    <StatusIcon className={cn("h-5 w-5", statusStyles[payment.status].text)} />
                  </div>
                  <div>
                    <p className="font-medium">{payment.title}</p>
                    <p className="text-sm text-muted-foreground">{payment.dueDate}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display font-semibold">
                    Rs. {payment.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <span
                    className={cn(
                      "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                      statusStyles[payment.status].bg,
                      statusStyles[payment.status].text
                    )}
                  >
                    {statusStyles[payment.status].label}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
