import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loan, LoanRecoverySchedule } from "@/types/payroll";
import { generateRecoverySchedule, formatLoanType } from "@/data/mockLoans";
import { format } from "date-fns";
import { useMemo } from "react";
import { CheckCircle2, Clock, AlertTriangle, CircleDot } from "lucide-react";

interface LoanDetailsModalProps {
  loan: Loan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig: Record<LoanRecoverySchedule['status'], { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  paid: { label: "Paid", variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
  pending: { label: "Pending", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
  partial: { label: "Partial", variant: "outline", icon: <CircleDot className="h-3 w-3" /> },
  overdue: { label: "Overdue", variant: "destructive", icon: <AlertTriangle className="h-3 w-3" /> },
};

const loanStatusConfig: Record<Loan['status'], { label: string; variant: "default" | "secondary" | "destructive" }> = {
  active: { label: "Active", variant: "default" },
  completed: { label: "Completed", variant: "secondary" },
  defaulted: { label: "Defaulted", variant: "destructive" },
};

export function LoanDetailsModal({ loan, open, onOpenChange }: LoanDetailsModalProps) {
  const schedule = useMemo(() => {
    if (!loan) return [];
    const tenure = Math.ceil(loan.principalAmount / loan.monthlyDeduction);
    return generateRecoverySchedule(loan, tenure);
  }, [loan]);

  const paidInstallments = schedule.filter(s => s.status === 'paid').length;
  const progressPercent = (paidInstallments / schedule.length) * 100;

  if (!loan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle>Loan Details</DialogTitle>
            <Badge variant={loanStatusConfig[loan.status].variant}>
              {loanStatusConfig[loan.status].label}
            </Badge>
          </div>
          <DialogDescription>
            {formatLoanType(loan.loanType)} for {loan.employee.firstName} {loan.employee.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Loan Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Principal Amount</p>
              <p className="text-xl font-semibold">LKR {loan.principalAmount.toLocaleString()}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Outstanding</p>
              <p className="text-xl font-semibold text-destructive">LKR {loan.outstandingAmount.toLocaleString()}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Monthly Deduction</p>
              <p className="text-xl font-semibold">LKR {loan.monthlyDeduction.toLocaleString()}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Interest Rate</p>
              <p className="text-xl font-semibold">{loan.interestRate}%</p>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Repayment Progress</span>
              <span className="font-medium">{paidInstallments} of {schedule.length} installments</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Loan Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Employee</p>
              <p className="font-medium">{loan.employee.firstName} {loan.employee.lastName} ({loan.employee.employeeNumber})</p>
            </div>
            <div>
              <p className="text-muted-foreground">Department</p>
              <p className="font-medium">{loan.employee.department}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Start Date</p>
              <p className="font-medium">{format(loan.startDate, "dd MMM yyyy")}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Expected End Date</p>
              <p className="font-medium">{format(loan.expectedEndDate, "dd MMM yyyy")}</p>
            </div>
            {loan.approvedBy && (
              <>
                <div>
                  <p className="text-muted-foreground">Approved By</p>
                  <p className="font-medium">{loan.approvedBy}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Approved Date</p>
                  <p className="font-medium">{loan.approvedAt ? format(loan.approvedAt, "dd MMM yyyy") : "-"}</p>
                </div>
              </>
            )}
          </div>

          {/* Recovery Schedule */}
          <div className="space-y-3">
            <h4 className="font-semibold">Recovery Schedule</h4>
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
                      <TableCell className="font-medium">{installment.installmentNumber}</TableCell>
                      <TableCell>{format(installment.dueDate, "dd MMM yyyy")}</TableCell>
                      <TableCell className="text-right">
                        LKR {installment.principalAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className="text-right">
                        LKR {installment.interestAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        LKR {installment.totalAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className="text-right">
                        {installment.paidAmount > 0 
                          ? `LKR ${installment.paidAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}` 
                          : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={statusConfig[installment.status].variant} className="gap-1">
                          {statusConfig[installment.status].icon}
                          {statusConfig[installment.status].label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
