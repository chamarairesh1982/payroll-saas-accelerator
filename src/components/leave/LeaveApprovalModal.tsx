import { useState } from "react";
import { motion } from "framer-motion";
import { X, Check, XCircle, Calendar, User, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { LeaveRequest } from "@/types/payroll";
import { cn } from "@/lib/utils";

interface LeaveApprovalModalProps {
  request: LeaveRequest;
  onClose: () => void;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string, reason: string) => void;
}

const statusStyles = {
  pending: "bg-warning/15 text-warning",
  approved: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

export function LeaveApprovalModal({
  request,
  onClose,
  onApprove,
  onReject,
}: LeaveApprovalModalProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleReject = () => {
    if (rejectionReason.trim().length < 5) return;
    onReject(request.id, rejectionReason);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold">Leave Request</h2>
            <p className="text-sm text-muted-foreground">Review and take action</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Employee Info */}
        <div className="mb-6 flex items-center gap-4 rounded-lg bg-muted/50 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
            {request.employee.firstName[0]}
            {request.employee.lastName[0]}
          </div>
          <div>
            <p className="font-semibold">
              {request.employee.firstName} {request.employee.lastName}
            </p>
            <p className="text-sm text-muted-foreground">
              {request.employee.designation} • {request.employee.department}
            </p>
          </div>
        </div>

        {/* Request Details */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Leave Type</span>
            </div>
            <Badge variant="secondary">{request.leaveType.name}</Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Duration</span>
            </div>
            <div className="text-right">
              <p className="font-medium">
                {new Date(request.startDate).toLocaleDateString("en-LK", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {request.days > 1 && (
                  <>
                    {" - "}
                    {new Date(request.endDate).toLocaleDateString("en-LK", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </>
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {request.days} day{request.days > 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Status</span>
            </div>
            <Badge variant="outline" className={cn("capitalize", statusStyles[request.status])}>
              {request.status}
            </Badge>
          </div>

          <div className="rounded-lg border p-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Reason</p>
            <p className="text-sm">{request.reason}</p>
          </div>

          {request.status === "rejected" && request.rejectionReason && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <p className="mb-1 text-xs font-medium text-destructive">Rejection Reason</p>
              <p className="text-sm">{request.rejectionReason}</p>
            </div>
          )}

          {request.status === "approved" && request.approvedBy && (
            <div className="rounded-lg border border-success/30 bg-success/5 p-3">
              <p className="mb-1 text-xs font-medium text-success">Approved By</p>
              <p className="text-sm">
                {request.approvedBy} on{" "}
                {request.approvedAt?.toLocaleDateString("en-LK", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          )}
        </div>

        {/* Rejection Form */}
        {showRejectForm && request.status === "pending" && (
          <div className="mb-6 space-y-3">
            <Textarea
              placeholder="Please provide a reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowRejectForm(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleReject}
                disabled={rejectionReason.trim().length < 5}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        )}

        {/* Actions */}
        {request.status === "pending" && !showRejectForm && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={() => setShowRejectForm(true)}
            >
              <XCircle className="h-4 w-4" />
              Reject
            </Button>
            <Button
              className="flex-1 bg-success hover:bg-success/90"
              onClick={() => onApprove(request.id)}
            >
              <Check className="h-4 w-4" />
              Approve
            </Button>
          </div>
        )}

        {request.status !== "pending" && (
          <Button variant="outline" className="w-full" onClick={onClose}>
            Close
          </Button>
        )}
      </motion.div>
    </>
  );
}
