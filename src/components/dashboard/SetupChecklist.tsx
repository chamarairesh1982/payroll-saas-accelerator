import { motion } from "framer-motion";
import { 
  Users, 
  Calendar, 
  Clock, 
  DollarSign, 
  Receipt, 
  PlayCircle,
  Check,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  completed: boolean;
}

interface SetupChecklistProps {
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

export function SetupChecklist({ setupProgress }: SetupChecklistProps) {
  const steps: SetupStep[] = [
    {
      id: "employees",
      title: "Add Employees",
      description: "Add your team members to the system",
      icon: Users,
      href: "/employees",
      completed: setupProgress.hasEmployees,
    },
    {
      id: "leave-types",
      title: "Configure Leave Types",
      description: "Set up annual, sick, and other leave policies",
      icon: Calendar,
      href: "/leave",
      completed: setupProgress.hasLeaveTypes,
    },
    {
      id: "overtime-rates",
      title: "Set Overtime Rates",
      description: "Define rates for weekday, weekend, and holidays",
      icon: Clock,
      href: "/overtime",
      completed: setupProgress.hasOvertimeRates,
    },
    {
      id: "salary-components",
      title: "Add Salary Components",
      description: "Configure allowances and deductions",
      icon: DollarSign,
      href: "/salary-components",
      completed: setupProgress.hasSalaryComponents,
    },
    {
      id: "tax-slabs",
      title: "Configure Tax Slabs",
      description: "Set up PAYE tax slabs for Sri Lanka",
      icon: Receipt,
      href: "/tax-config",
      completed: setupProgress.hasTaxSlabs,
    },
    {
      id: "payroll",
      title: "Run First Payroll",
      description: "Process your first payroll run",
      icon: PlayCircle,
      href: "/payroll",
      completed: setupProgress.hasPayrollRun,
    },
  ];

  const progressPercent = (setupProgress.completedSteps / setupProgress.totalSteps) * 100;
  const allComplete = setupProgress.completedSteps === setupProgress.totalSteps;

  if (allComplete) {
    return null; // Don't show checklist when setup is complete
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-lg"
    >
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-semibold">Complete Your Setup</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {setupProgress.completedSteps} of {setupProgress.totalSteps} steps completed
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-primary">{Math.round(progressPercent)}%</span>
        </div>
      </div>

      <Progress value={progressPercent} className="mb-6 h-2" />

      <div className="space-y-2">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isNextStep = !step.completed && steps.slice(0, index).every((s) => s.completed);
          
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={step.href}>
                <div
                  className={cn(
                    "group flex items-center justify-between rounded-lg border p-3 transition-all",
                    step.completed
                      ? "border-success/30 bg-success/5"
                      : isNextStep
                      ? "border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10"
                      : "border-border bg-card/50 hover:border-muted-foreground/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg",
                        step.completed
                          ? "bg-success text-success-foreground"
                          : isNextStep
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {step.completed ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <StepIcon className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p
                        className={cn(
                          "text-sm font-medium",
                          step.completed && "text-success"
                        )}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                  {!step.completed && (
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1",
                        isNextStep && "text-primary"
                      )}
                    />
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
