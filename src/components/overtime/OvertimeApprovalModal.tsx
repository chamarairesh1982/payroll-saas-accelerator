import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { OvertimeEntry } from "@/types/payroll";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { Check, X, Clock, User, Calendar, DollarSign } from "lucide-react";

interface OvertimeApprovalModalProps {
  entry: OvertimeEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove?: (entryId: string) => void;
  onReject?: (entryId: string, reason: string) => void;
}

export function OvertimeApprovalModal({ entry, open, onOpenChange, onApprove, onReject }: OvertimeApprovalModalProps) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!entry) return null;

  const handleApprove = () => {
    onApprove?.(entry.id);
    toast.success("Overtime Approved", {
      description: `${entry.hours} hours of overtime for ${entry.employee.firstName} ${entry.employee.lastName} has been approved.`,
    });
    onOpenChange(false);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    onReject?.(entry.id, rejectionReason);
    toast.success("Overtime Rejected", {
      description: `Overtime entry for ${entry.employee.firstName} ${entry.employee.lastName} has been rejected.`,
    });
    onOpenChange(false);
    setRejectionReason("");
    setShowRejectForm(false);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { onOpenChange(open); setShowRejectForm(false); setRejectionReason(""); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Review Overtime Entry</DialogTitle>
          <DialogDescription>
            Approve or reject this overtime request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Employee Info */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{entry.employee.firstName} {entry.employee.lastName}</p>
              <p className="text-sm text-muted-foreground">{entry.employee.department} · {entry.employee.designation}</p>
            </div>
          </div>

          {/* Entry Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-medium">{format(entry.date, "dd MMM yyyy")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Hours</p>
                <p className="font-medium">{entry.hours} hours</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Rate Type</p>
              <Badge variant="outline" className="mt-1">
                {entry.overtimeRate.name} ({entry.overtimeRate.multiplier}x)
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="font-medium text-primary">LKR {entry.calculatedAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {showRejectForm && (
            <div className="space-y-2">
              <Label>Rejection Reason</Label>
              <Textarea
                placeholder="Provide a reason for rejecting this overtime entry..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          {showRejectForm ? (
            <>
              <Button variant="outline" onClick={() => setShowRejectForm(false)}>
                Back
              </Button>
              <Button variant="destructive" onClick={handleReject}>
                Confirm Rejection
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setShowRejectForm(true)}>
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button onClick={handleApprove}>
                <Check className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
