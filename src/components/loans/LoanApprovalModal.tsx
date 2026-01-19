import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { formatLoanType, type Loan } from "@/hooks/useLoans";

interface LoanApprovalModalProps {
  loan: Loan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (loanId: string) => void;
  onReject: (loanId: string, reason: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
}

export function LoanApprovalModal({
  loan,
  open,
  onOpenChange,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: LoanApprovalModalProps) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!loan) return null;

  const handleApprove = () => {
    onApprove(loan.id);
    onOpenChange(false);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) return;
    onReject(loan.id, rejectionReason);
    setRejectionReason("");
    setShowRejectForm(false);
    onOpenChange(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setShowRejectForm(false);
      setRejectionReason("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle>Review Loan Application</DialogTitle>
            <Badge variant="outline">Pending</Badge>
          </div>
          <DialogDescription>
            Review and approve or reject this loan application
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Loan Summary */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Employee</p>
                <p className="font-medium">
                  {loan.employee?.first_name} {loan.employee?.last_name}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Employee ID</p>
                <p className="font-medium">{loan.employee?.employee_number || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Loan Type</p>
                <p className="font-medium">{formatLoanType(loan.loan_type)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Department</p>
                <p className="font-medium">{loan.employee?.department || "N/A"}</p>
              </div>
            </div>

            <div className="border-t pt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Principal Amount</p>
                <p className="text-lg font-semibold">
                  LKR {Number(loan.principal_amount).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Monthly Deduction</p>
                <p className="text-lg font-semibold">
                  LKR {Number(loan.monthly_deduction).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Interest Rate</p>
                <p className="font-medium">{Number(loan.interest_rate)}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Duration</p>
                <p className="font-medium">
                  {format(new Date(loan.start_date), "MMM yyyy")} -{" "}
                  {format(new Date(loan.expected_end_date), "MMM yyyy")}
                </p>
              </div>
            </div>
          </div>

          {/* Rejection Form */}
          {showRejectForm && (
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Please provide a reason for rejecting this loan application..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {showRejectForm ? (
            <>
              <Button
                variant="outline"
                onClick={() => setShowRejectForm(false)}
                disabled={isRejecting}
              >
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isRejecting || !rejectionReason.trim()}
              >
                {isRejecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Rejection
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isApproving || isRejecting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowRejectForm(true)}
                disabled={isApproving || isRejecting}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isApproving || isRejecting}
              >
                {isApproving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
