import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Calendar, Send, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { mockEmployees } from "@/data/mockEmployees";
import { leaveTypes, getLeaveBalances, calculateBusinessDays } from "@/data/mockLeave";

const leaveRequestSchema = z.object({
  employeeId: z.string().min(1, "Please select an employee"),
  leaveTypeId: z.string().min(1, "Please select leave type"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().min(10, "Please provide a reason (at least 10 characters)").max(500),
});

type LeaveRequestFormData = z.infer<typeof leaveRequestSchema>;

interface LeaveRequestModalProps {
  onClose: () => void;
}

export function LeaveRequestModal({ onClose }: LeaveRequestModalProps) {
  const { toast } = useToast();
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>("");

  const form = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      employeeId: "",
      leaveTypeId: "",
      startDate: "",
      endDate: "",
      reason: "",
    },
  });

  const watchStartDate = form.watch("startDate");
  const watchEndDate = form.watch("endDate");

  const calculatedDays =
    watchStartDate && watchEndDate
      ? calculateBusinessDays(new Date(watchStartDate), new Date(watchEndDate))
      : 0;

  const leaveBalance = selectedEmployee && selectedLeaveType
    ? getLeaveBalances(selectedEmployee).find((b) => b.leaveTypeId === selectedLeaveType)
    : null;

  const onSubmit = (data: LeaveRequestFormData) => {
    console.log("Leave request:", data);
    toast({
      title: "Leave Request Submitted",
      description: `Your request for ${calculatedDays} day(s) has been submitted for approval.`,
    });
    onClose();
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
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold">Request Leave</h2>
            <p className="text-sm text-muted-foreground">Submit a new leave request</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Employee Selection */}
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedEmployee(value);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {mockEmployees
                        .filter((e) => e.status === "active")
                        .map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.firstName} {employee.lastName} - {employee.department}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Leave Type */}
            <FormField
              control={form.control}
              name="leaveTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leave Type *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedLeaveType(value);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {leaveTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name} ({type.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Leave Balance Info */}
            {leaveBalance && (
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Available Balance</span>
                  <span className={`font-semibold ${leaveBalance.available <= 0 ? "text-destructive" : "text-success"}`}>
                    {leaveBalance.available} days
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Entitled: {leaveBalance.entitled}</span>
                  <span>Taken: {leaveBalance.taken}</span>
                  <span>Pending: {leaveBalance.pending}</span>
                </div>
              </div>
            )}

            {/* Date Range */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Days Calculation */}
            {calculatedDays > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-primary/5 p-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm">Business Days</span>
                </div>
                <span className="text-lg font-bold text-primary">{calculatedDays} day{calculatedDays > 1 ? "s" : ""}</span>
              </div>
            )}

            {/* Warning if exceeds balance */}
            {leaveBalance && calculatedDays > leaveBalance.available && (
              <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 text-warning" />
                <div className="text-sm">
                  <p className="font-medium text-warning">Insufficient Balance</p>
                  <p className="text-muted-foreground">
                    You're requesting {calculatedDays} days but only have {leaveBalance.available} days available.
                  </p>
                </div>
              </div>
            )}

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide a reason for your leave request..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                <Send className="h-4 w-4" />
                Submit Request
              </Button>
            </div>
          </form>
        </Form>
      </motion.div>
    </>
  );
}
