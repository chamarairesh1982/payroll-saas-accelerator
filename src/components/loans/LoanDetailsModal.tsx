import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { useMemo } from "react";
import { CheckCircle2, Clock, AlertTriangle, CircleDot, Loader2 } from "lucide-react";
import { formatLoanType, useLoanRecoverySchedule, type Loan } from "@/hooks/useLoans";

interface LoanDetailsModalProps {
  loan: Loan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig: Record<
  "paid" | "pending" | "partial" | "overdue",
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
> = {
  paid: { label: "Paid", variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
  pending: { label: "Pending", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
  partial: { label: "Partial", variant: "outline", icon: <CircleDot className="h-3 w-3" /> },
  overdue: { label: "Overdue", variant: "destructive", icon: <AlertTriangle className="h-3 w-3" /> },
};

const loanStatusConfig: Record<
  "pending" | "active" | "completed" | "rejected" | "defaulted",
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "Pending Approval", variant: "outline" },
  active: { label: "Active", variant: "default" },
  completed: { label: "Completed", variant: "secondary" },
  rejected: { label: "Rejected", variant: "destructive" },
  defaulted: { label: "Defaulted", variant: "destructive" },
};

export function LoanDetailsModal({ loan, open, onOpenChange }: LoanDetailsModalProps) {
  const { data: schedule = [], isLoading } = useLoanRecoverySchedule(loan?.id);

  const scheduleStats = useMemo(() => {
    const paidInstallments = schedule.filter((s) => s.status === "paid").length;
    const progressPercent = schedule.length > 0 ? (paidInstallments / schedule.length) * 100 : 0;
    return { paidInstallments, progressPercent };
  }, [schedule]);

  if (!loan) return null;

  const principal = Number(loan.principal_amount);
  const outstanding = Number(loan.outstanding_amount);
  const fallbackProgress = principal > 0 ? ((principal - outstanding) / principal) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle>Loan Details</DialogTitle>
            <Badge variant={loanStatusConfig[loan.status as keyof typeof loanStatusConfig]?.variant || "secondary"}>
              {loanStatusConfig[loan.status as keyof typeof loanStatusConfig]?.label || loan.status}
            </Badge>
          </div>
          <DialogDescription>
            {formatLoanType(loan.loan_type)} for {loan.employee?.first_name} {loan.employee?.last_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Loan Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Principal Amount</p>
              <p className="text-xl font-semibold">LKR {principal.toLocaleString()}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Outstanding</p>
              <p className="text-xl font-semibold text-destructive">LKR {outstanding.toLocaleString()}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Monthly Deduction</p>
              <p className="text-xl font-semibold">LKR {Number(loan.monthly_deduction).toLocaleString()}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Interest Rate</p>
              <p className="text-xl font-semibold">{Number(loan.interest_rate)}%</p>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Repayment Progress</span>
              {schedule.length > 0 ? (
                <span className="font-medium">
                  {scheduleStats.paidInstallments} of {schedule.length} installments
                </span>
              ) : (
                <span className="font-medium">{fallbackProgress.toFixed(0)}%</span>
              )}
            </div>
            <Progress value={schedule.length > 0 ? scheduleStats.progressPercent : fallbackProgress} className="h-2" />
          </div>

          {/* Loan Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Employee</p>
              <p className="font-medium">
                {loan.employee?.first_name} {loan.employee?.last_name} ({loan.employee?.employee_number || "N/A"})
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Department</p>
              <p className="font-medium">{loan.employee?.department || "N/A"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Start Date</p>
              <p className="font-medium">{format(new Date(loan.start_date), "dd MMM yyyy")}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Expected End Date</p>
              <p className="font-medium">{format(new Date(loan.expected_end_date), "dd MMM yyyy")}</p>
            </div>
          </div>

          {/* Recovery Schedule */}
          <div className="space-y-3">
            <h4 className="font-semibold">Recovery Schedule</h4>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : schedule.length === 0 ? (
              <div className="rounded-lg border bg-card p-6 text-center">
                <p className="font-medium">No schedule generated yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  The loan is saved, but no recovery schedule rows exist in the database.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Principal</TableHead>
                      <TableHead className="text-right">Interest</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedule.map((installment) => (
                      <TableRow key={installment.id}>
                        <TableCell className="font-medium">{installment.installment_number}</TableCell>
                        <TableCell>{format(new Date(installment.due_date), "dd MMM yyyy")}</TableCell>
                        <TableCell className="text-right">
                          LKR {Number(installment.principal_amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell className="text-right">
                          LKR {Number(installment.interest_amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          LKR {Number(installment.total_amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell className="text-right">
                          {Number(installment.paid_amount) > 0
                            ? `LKR ${Number(installment.paid_amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                            : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={statusConfig[installment.status]?.variant || "secondary"}
                            className="gap-1"
                          >
                            {statusConfig[installment.status]?.icon}
                            {statusConfig[installment.status]?.label || installment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
