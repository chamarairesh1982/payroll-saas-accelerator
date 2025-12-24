import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { mockEmployees } from "@/data/mockEmployees";
import { mockOvertimeRates, calculateOvertimeAmount } from "@/data/mockOvertime";
import { format } from "date-fns";
import { toast } from "sonner";
import { CalendarIcon, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

const overtimeSchema = z.object({
  employeeId: z.string().min(1, "Please select an employee"),
  date: z.date({ required_error: "Please select a date" }),
  hours: z.number().min(0.5, "Minimum 0.5 hours").max(12, "Maximum 12 hours per day"),
  overtimeRateId: z.string().min(1, "Please select an overtime rate"),
});

type OvertimeFormData = z.infer<typeof overtimeSchema>;

interface OvertimeEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OvertimeEntryModal({ open, onOpenChange }: OvertimeEntryModalProps) {
  const [calculatedAmount, setCalculatedAmount] = useState<number | null>(null);

  const form = useForm<OvertimeFormData>({
    resolver: zodResolver(overtimeSchema),
    defaultValues: {
      employeeId: "",
      hours: 1,
      overtimeRateId: "",
    },
  });

  const watchedValues = form.watch();

  const calculateAmount = () => {
    const employee = mockEmployees.find(e => e.id === watchedValues.employeeId);
    const rate = mockOvertimeRates.find(r => r.id === watchedValues.overtimeRateId);
    
    if (employee && rate && watchedValues.hours > 0) {
      const amount = calculateOvertimeAmount(
        employee.basicSalary,
        watchedValues.hours,
        rate.multiplier
      );
      setCalculatedAmount(amount);
    }
  };

  const onSubmit = (data: OvertimeFormData) => {
    const employee = mockEmployees.find(e => e.id === data.employeeId);
    toast.success("Overtime Entry Submitted", {
      description: `${data.hours} hours of overtime for ${employee?.firstName} ${employee?.lastName} submitted for approval.`,
    });
    onOpenChange(false);
    form.reset();
    setCalculatedAmount(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Overtime Entry</DialogTitle>
          <DialogDescription>
            Log overtime hours for an employee
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee</FormLabel>
                  <Select onValueChange={(value) => { field.onChange(value); setCalculatedAmount(null); }} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {mockEmployees.filter(e => e.status === 'active').map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.firstName} {employee.lastName} ({employee.employeeNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date("2024-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hours</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="12"
                        {...field}
                        onChange={(e) => {
                          field.onChange(Number(e.target.value));
                          setCalculatedAmount(null);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="overtimeRateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate Type</FormLabel>
                    <Select onValueChange={(value) => { field.onChange(value); setCalculatedAmount(null); }} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select rate" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockOvertimeRates.filter(r => r.isActive).map((rate) => (
                          <SelectItem key={rate.id} value={rate.id}>
                            {rate.name} ({rate.multiplier}x)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-center">
              <Button type="button" variant="outline" onClick={calculateAmount}>
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Amount
              </Button>
            </div>

            {calculatedAmount !== null && (
              <Alert>
                <AlertDescription className="text-center">
                  <p className="text-sm text-muted-foreground">Estimated Overtime Amount</p>
                  <p className="text-2xl font-bold mt-1">LKR {calculatedAmount.toLocaleString()}</p>
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Submit Entry</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
