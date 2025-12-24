import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  DollarSign,
  Calendar,
  Users,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Download,
  MoreHorizontal,
  TrendingUp,
  Building,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatCard } from "@/components/dashboard/StatCard";
import { PayrollWizard } from "@/components/payroll/PayrollWizard";
import { PayrollDetailModal } from "@/components/payroll/PayrollDetailModal";
import { cn } from "@/lib/utils";
import { formatLKR } from "@/lib/payroll-calculations";
import { usePayrollRuns, PayrollRun } from "@/hooks/usePayroll";
import { format } from "date-fns";

const statusConfig = {
  draft: { label: "Draft", icon: FileText, className: "bg-muted text-muted-foreground" },
  processing: { label: "Processing", icon: Clock, className: "bg-primary/15 text-primary" },
  pending_approval: { label: "Pending Approval", icon: AlertCircle, className: "bg-warning/15 text-warning" },
  approved: { label: "Approved", icon: CheckCircle2, className: "bg-success/15 text-success" },
  paid: { label: "Paid", icon: CheckCircle2, className: "bg-success/15 text-success" },
};

const Payroll = () => {
  const [showWizard, setShowWizard] = useState(false);
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const { data: payrollRuns = [], isLoading } = usePayrollRuns();

  const stats = useMemo(() => {
    if (payrollRuns.length === 0) {
      return {
        currentMonthGross: 0,
        currentMonthNet: 0,
        employeeCount: 0,
        epfDue: 0,
        etfDue: 0,
        growth: 0,
      };
    }
    
    const currentRun = payrollRuns[0];
    const lastRun = payrollRuns[1];
    const growthPercent = lastRun && lastRun.total_gross_salary > 0
      ? ((currentRun.total_gross_salary - lastRun.total_gross_salary) / lastRun.total_gross_salary * 100).toFixed(1)
      : 0;
    
    return {
      currentMonthGross: currentRun.total_gross_salary,
      currentMonthNet: currentRun.total_net_salary,
      employeeCount: currentRun.employee_count,
      epfDue: currentRun.total_epf_employee + currentRun.total_epf_employer,
      etfDue: currentRun.total_etf,
      growth: Number(growthPercent),
    };
  }, [payrollRuns]);

  return (
    <MainLayout>
      <AnimatePresence>
        {showWizard && (
          <PayrollWizard onClose={() => setShowWizard(false)} />
        )}
        {selectedRun && (
          <PayrollDetailModal
            payrollRun={selectedRun}
            onClose={() => setSelectedRun(null)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Payroll</h1>
          <p className="page-description">
            Process and manage monthly payroll runs with EPF/ETF calculations.
          </p>
        </div>
        <Button size="lg" onClick={() => setShowWizard(true)}>
          <Plus className="h-5 w-5" />
          Run Payroll
        </Button>
      </div>

      {/* Stats */}
      <div className="card-grid mb-8">
        <StatCard
          title="This Month's Payroll"
          value={formatLKR(stats.currentMonthGross)}
          subtitle={payrollRuns.length > 0 ? format(new Date(payrollRuns[0].pay_period_start), "MMMM yyyy") : "No data"}
          icon={<DollarSign className="h-6 w-6" />}
          trend={{ value: stats.growth, isPositive: stats.growth > 0 }}
          variant="primary"
          delay={0.1}
        />
        <StatCard
          title="Net Disbursement"
          value={formatLKR(stats.currentMonthNet)}
          subtitle="After deductions"
          icon={<TrendingUp className="h-6 w-6" />}
          variant="success"
          delay={0.15}
        />
        <StatCard
          title="EPF Contribution"
          value={formatLKR(stats.epfDue)}
          subtitle="Employee + Employer"
          icon={<Building className="h-6 w-6" />}
          variant="accent"
          delay={0.2}
        />
        <StatCard
          title="ETF Contribution"
          value={formatLKR(stats.etfDue)}
          subtitle="Employer only (3%)"
          icon={<FileText className="h-6 w-6" />}
          variant="warning"
          delay={0.25}
        />
      </div>

      {/* Payroll Runs Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border border-border bg-card shadow-sm"
      >
        <div className="flex items-center justify-between border-b border-border p-6">
          <div>
            <h3 className="font-display text-lg font-semibold">Payroll History</h3>
            <p className="text-sm text-muted-foreground">Recent payroll runs and their status</p>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold">Pay Period</TableHead>
              <TableHead className="font-semibold">Employees</TableHead>
              <TableHead className="font-semibold">Gross Salary</TableHead>
              <TableHead className="font-semibold">Net Salary</TableHead>
              <TableHead className="font-semibold">EPF/ETF</TableHead>
              <TableHead className="font-semibold">Pay Date</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payrollRuns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {isLoading ? "Loading..." : "No payroll runs yet. Click 'Run Payroll' to get started."}
                </TableCell>
              </TableRow>
            ) : (
              payrollRuns.map((run, index) => {
                const StatusIcon = statusConfig[run.status].icon;
                const payPeriodMonth = format(new Date(run.pay_period_start), "MMMM");
                const payPeriodYear = format(new Date(run.pay_period_start), "yyyy");
                return (
                  <motion.tr
                    key={run.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="group hover:bg-muted/30"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{payPeriodMonth} {payPeriodYear}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(run.pay_period_start), "dd MMM")} - {format(new Date(run.pay_period_end), "dd MMM")}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{run.employee_count}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{formatLKR(run.total_gross_salary)}</TableCell>
                    <TableCell className="font-medium text-success">{formatLKR(run.total_net_salary)}</TableCell>
                    <TableCell className="text-sm">
                      <div>
                        <p>EPF: {formatLKR(run.total_epf_employee + run.total_epf_employer)}</p>
                        <p className="text-muted-foreground">ETF: {formatLKR(run.total_etf)}</p>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(run.pay_date).toLocaleDateString("en-LK")}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn("gap-1", statusConfig[run.status].className)}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig[run.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="opacity-0 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedRun(run)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSelectedRun(run)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download Payslips
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSelectedRun(run)}>
                            <FileText className="mr-2 h-4 w-4" />
                            Generate Reports
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                );
              })
            )}
          </TableBody>
        </Table>
      </motion.div>
    </MainLayout>
  );
};

export default Payroll;
