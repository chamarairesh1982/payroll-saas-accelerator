import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Play, 
  UserPlus, 
  FileText, 
  Calculator, 
  Calendar,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuickAction {
  label: string;
  description: string;
  icon: React.ElementType;
  href: string;
  variant: "primary" | "success" | "accent" | "warning";
}

const actions: QuickAction[] = [
  {
    label: "Run Payroll",
    description: "Process this month's payroll",
    icon: Play,
    href: "/payroll/new",
    variant: "primary",
  },
  {
    label: "Add Employee",
    description: "Register new employee",
    icon: UserPlus,
    href: "/employees/new",
    variant: "success",
  },
  {
    label: "Generate Reports",
    description: "EPF/ETF & PAYE reports",
    icon: FileText,
    href: "/reports",
    variant: "accent",
  },
  {
    label: "Tax Calculator",
    description: "Calculate PAYE tax",
    icon: Calculator,
    href: "/tax-config",
    variant: "warning",
  },
];

const variantStyles = {
  primary: "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground",
  success: "bg-success/10 text-success hover:bg-success hover:text-success-foreground",
  accent: "bg-accent/10 text-accent hover:bg-accent hover:text-accent-foreground",
  warning: "bg-warning/10 text-warning hover:bg-warning hover:text-warning-foreground",
};

export function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="rounded-xl bg-card p-6 shadow-md"
    >
      <div className="mb-6">
        <h3 className="font-display text-lg font-semibold">Quick Actions</h3>
        <p className="text-sm text-muted-foreground">Common payroll tasks</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {actions.map((action, index) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
          >
            <Link
              to={action.href}
              className={cn(
                "flex items-center gap-4 rounded-lg p-4 transition-all duration-200",
                variantStyles[action.variant]
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-background/80">
                <action.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium">{action.label}</p>
                <p className="text-sm opacity-80">{action.description}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
