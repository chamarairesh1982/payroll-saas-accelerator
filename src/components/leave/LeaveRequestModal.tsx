import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Calendar, Send, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useLeaveRequests, useLeaveTypes } from "@/hooks/useLeave";
import { useAuth } from "@/contexts/AuthContext";
import { differenceInBusinessDays, addDays } from "date-fns";

const leaveRequestSchema = z.object({
  leaveTypeId: z.string().min(1, "Please select leave type"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().min(10, "Please provide a reason (at least 10 characters)").max(500),
});

type LeaveRequestFormData = z.infer<typeof leaveRequestSchema>;

interface LeaveRequestModalProps {
  onClose: () => void;
}

const calculateBusinessDays = (start: Date, end: Date): number => {
  if (end < start) return 0;
  // differenceInBusinessDays doesn't include end date, so we add 1
  return differenceInBusinessDays(addDays(end, 1), start);
};

export function LeaveRequestModal({ onClose }: LeaveRequestModalProps) {
  const { profile } = useAuth();
  const { leaveTypes, isLoading: isLoadingTypes } = useLeaveTypes();
  const { createLeaveRequest, isCreating } = useLeaveRequests();

  const form = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
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

  const onSubmit = (data: LeaveRequestFormData) => {
    createLeaveRequest(
      {
        leave_type_id: data.leaveTypeId,
        start_date: data.startDate,
        end_date: data.endDate,
        days: calculatedDays,
        reason: data.reason,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 16 }}
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-card shadow-2xl max-h-[calc(100vh-2rem)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b px-6 py-5">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold">Request Leave</h2>
            <p className="text-sm text-muted-foreground">
              Requesting as: {profile?.first_name} {profile?.last_name}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {/* Leave Type */}
              <FormField
                control={form.control}
                name="leaveTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leave Type *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoadingTypes}
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
                  <span className="text-lg font-bold text-primary">
                    {calculatedDays} day{calculatedDays > 1 ? "s" : ""}
                  </span>
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
            </div>

            {/* Actions (always visible) */}
            <div className="shrink-0 border-t bg-card px-6 py-4">
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onClose} disabled={isCreating}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating || calculatedDays <= 0}>
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Submit Request
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </motion.div>
    </motion.div>
  );
}
