import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Calculator, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useOvertimeRates, useOvertimeEntries } from "@/hooks/useOvertime";
import { useEmployees } from "@/hooks/useEmployees";

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
  const { employees, isLoading: isLoadingEmployees } = useEmployees();
  const { overtimeRates, isLoading: isLoadingRates } = useOvertimeRates();
  const { createOvertimeEntry, isCreating } = useOvertimeEntries();

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
    const employee = employees.find(e => e.id === watchedValues.employeeId);
    const rate = overtimeRates.find(r => r.id === watchedValues.overtimeRateId);
    
    if (employee && rate && watchedValues.hours > 0) {
      const basicSalary = employee.basic_salary || 0;
      // Calculate hourly rate: basic salary / (22 working days * 8 hours)
      const hourlyRate = basicSalary / (22 * 8);
      const amount = hourlyRate * watchedValues.hours * Number(rate.multiplier);
      setCalculatedAmount(Math.round(amount * 100) / 100);
    }
  };

  const onSubmit = (data: OvertimeFormData) => {
    const employee = employees.find(e => e.id === data.employeeId);
    const rate = overtimeRates.find(r => r.id === data.overtimeRateId);
    
    if (!employee || !rate) return;
    
    const basicSalary = employee.basic_salary || 0;
    const hourlyRate = basicSalary / (22 * 8);
    const amount = hourlyRate * data.hours * Number(rate.multiplier);

    createOvertimeEntry(
      {
        employee_id: data.employeeId,
        date: format(data.date, "yyyy-MM-dd"),
        hours: data.hours,
        overtime_rate_id: data.overtimeRateId,
        calculated_amount: Math.round(amount * 100) / 100,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
          setCalculatedAmount(null);
        },
      }
    );
  };

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      form.reset();
      setCalculatedAmount(null);
    }
  }, [open, form]);

  const activeEmployees = employees.filter(e => e.status === 'active');
  const activeRates = overtimeRates.filter(r => r.is_active);

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
                  <Select 
                    onValueChange={(value) => { field.onChange(value); setCalculatedAmount(null); }} 
                    value={field.value}
                    disabled={isLoadingEmployees}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeEmployees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.first_name} {employee.last_name} ({employee.employee_number || 'N/A'})
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
                    <Select 
                      onValueChange={(value) => { field.onChange(value); setCalculatedAmount(null); }} 
                      value={field.value}
                      disabled={isLoadingRates}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select rate" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeRates.map((rate) => (
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
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit Entry
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
