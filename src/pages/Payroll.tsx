import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
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
import { cn } from "@/lib/utils";
import { formatLKR } from "@/lib/payroll-calculations";

interface PayrollRunSummary {
  id: string;
  month: string;
  year: number;
  status: "draft" | "processing" | "pending_approval" | "approved" | "paid";
  employeeCount: number;
  totalGross: number;
  totalNet: number;
  totalEpf: number;
  totalEtf: number;
  payDate: string;
}

const mockPayrollRuns: PayrollRunSummary[] = [
  {
    id: "PR-2024-12",
    month: "December",
    year: 2024,
    status: "draft",
    employeeCount: 45,
    totalGross: 5200000,
    totalNet: 4380000,
    totalEpf: 624000,
    totalEtf: 156000,
    payDate: "2024-12-25",
  },
  {
    id: "PR-2024-11",
    month: "November",
    year: 2024,
    status: "paid",
    employeeCount: 44,
    totalGross: 4890000,
    totalNet: 4120000,
    totalEpf: 586800,
    totalEtf: 146700,
    payDate: "2024-11-25",
  },
  {
    id: "PR-2024-10",
    month: "October",
    year: 2024,
    status: "paid",
    employeeCount: 43,
    totalGross: 4720000,
    totalNet: 3980000,
    totalEpf: 566400,
    totalEtf: 141600,
    payDate: "2024-10-25",
  },
];

const statusConfig = {
  draft: { label: "Draft", icon: FileText, className: "bg-muted text-muted-foreground" },
  processing: { label: "Processing", icon: Clock, className: "bg-primary/15 text-primary" },
  pending_approval: { label: "Pending Approval", icon: AlertCircle, className: "bg-warning/15 text-warning" },
  approved: { label: "Approved", icon: CheckCircle2, className: "bg-success/15 text-success" },
  paid: { label: "Paid", icon: CheckCircle2, className: "bg-success/15 text-success" },
};

const Payroll = () => {
  const [showWizard, setShowWizard] = useState(false);

  const stats = useMemo(() => {
    const currentRun = mockPayrollRuns[0];
    const lastRun = mockPayrollRuns[1];
    const growthPercent = lastRun 
      ? ((currentRun.totalGross - lastRun.totalGross) / lastRun.totalGross * 100).toFixed(1)
      : 0;
    
    return {
      currentMonthGross: currentRun.totalGross,
      currentMonthNet: currentRun.totalNet,
      employeeCount: currentRun.employeeCount,
      epfDue: currentRun.totalEpf,
      etfDue: currentRun.totalEtf,
      growth: Number(growthPercent),
    };
  }, []);

  return (
    <MainLayout>
      <AnimatePresence>
        {showWizard && (
          <PayrollWizard onClose={() => setShowWizard(false)} />
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
          subtitle="December 2024"
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
            {mockPayrollRuns.map((run, index) => {
              const StatusIcon = statusConfig[run.status].icon;
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
                        <p className="font-medium">{run.month} {run.year}</p>
                        <p className="text-xs text-muted-foreground">{run.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{run.employeeCount}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{formatLKR(run.totalGross)}</TableCell>
                  <TableCell className="font-medium text-success">{formatLKR(run.totalNet)}</TableCell>
                  <TableCell className="text-sm">
                    <div>
                      <p>EPF: {formatLKR(run.totalEpf)}</p>
                      <p className="text-muted-foreground">ETF: {formatLKR(run.totalEtf)}</p>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(run.payDate).toLocaleDateString("en-LK")}</TableCell>
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
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Download Payslips
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileText className="mr-2 h-4 w-4" />
                          Generate Reports
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              );
            })}
          </TableBody>
        </Table>
      </motion.div>
    </MainLayout>
  );
};

export default Payroll;
