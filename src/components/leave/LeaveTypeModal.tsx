import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLeaveTypes } from "@/hooks/useLeave";

const leaveTypeSchema = z
  .object({
    name: z.string().trim().min(2, "Name is required").max(50),
    code: z
      .string()
      .trim()
      .min(2, "Code is required")
      .max(10)
      .regex(/^[A-Z0-9_-]+$/, "Use uppercase letters/numbers (e.g. ANNUAL, CASUAL)"),
    days_per_year: z.number().int().min(0).max(365),
    is_paid: z.boolean(),
    is_carry_forward: z.boolean(),
    max_carry_forward: z.number().int().min(0).max(365),
    is_active: z.boolean(),
  })
  .superRefine((val, ctx) => {
    if (!val.is_carry_forward && val.max_carry_forward > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Max carry forward must be 0 when carry forward is disabled",
        path: ["max_carry_forward"],
      });
    }
  });

type LeaveTypeForm = z.infer<typeof leaveTypeSchema>;

interface LeaveTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeaveTypeModal({ open, onOpenChange }: LeaveTypeModalProps) {
  const { createLeaveType, isCreating } = useLeaveTypes();

  const form = useForm<LeaveTypeForm>({
    resolver: zodResolver(leaveTypeSchema),
    defaultValues: {
      name: "",
      code: "",
      days_per_year: 14,
      is_paid: true,
      is_carry_forward: false,
      max_carry_forward: 0,
      is_active: true,
    },
  });

  const carry = form.watch("is_carry_forward");

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: "",
      code: "",
      days_per_year: 14,
      is_paid: true,
      is_carry_forward: false,
      max_carry_forward: 0,
      is_active: true,
    });
  }, [open, form]);

  const onSubmit = (data: LeaveTypeForm) => {
    createLeaveType(
      {
        name: data.name,
        code: data.code,
        days_per_year: data.days_per_year,
        is_paid: data.is_paid,
        is_carry_forward: data.is_carry_forward,
        max_carry_forward: data.is_carry_forward ? data.max_carry_forward : 0,
        is_active: data.is_active,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Leave Type</DialogTitle>
          <DialogDescription>Create a leave type employees can request.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Annual Leave" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input placeholder="ANNUAL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="days_per_year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Days per year</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={365}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="is_paid"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel className="text-sm">Paid</FormLabel>
                      <p className="text-xs text-muted-foreground">Counts as paid leave</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel className="text-sm">Active</FormLabel>
                      <p className="text-xs text-muted-foreground">Visible to employees</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="is_carry_forward"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel className="text-sm">Carry forward</FormLabel>
                      <p className="text-xs text-muted-foreground">Allow unused days to carry over</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_carry_forward"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max carry forward</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={365}
                        disabled={!carry}
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                Create Leave Type
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
