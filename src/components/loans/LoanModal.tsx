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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addMonths, format } from "date-fns";
import { Calculator, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEmployees } from "@/hooks/useEmployees";
import { useLoans, loanTypes } from "@/hooks/useLoans";

const loanSchema = z.object({
  employeeId: z.string().min(1, "Please select an employee"),
  loanType: z.enum(["salary_advance", "personal_loan", "emergency_loan"]),
  principalAmount: z
    .number()
    .min(1000, "Minimum loan amount is LKR 1,000")
    .max(1000000, "Maximum loan amount is LKR 1,000,000"),
  interestRate: z.number().min(0, "Interest rate cannot be negative").max(20, "Maximum interest rate is 20%"),
  tenure: z.number().min(1, "Minimum tenure is 1 month").max(24, "Maximum tenure is 24 months"),
  reason: z.string().trim().min(10, "Please provide a reason (min 10 characters)").max(500),
});

type LoanFormData = z.infer<typeof loanSchema>;

interface LoanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoanModal({ open, onOpenChange }: LoanModalProps) {
  const { employees } = useEmployees();
  const { createLoan, isCreating } = useLoans();

  const [calculatedValues, setCalculatedValues] = useState<{
    monthlyDeduction: number;
    totalInterest: number;
    totalRepayment: number;
    expectedEndDate: Date;
  } | null>(null);

  const form = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      employeeId: "",
      loanType: "salary_advance",
      principalAmount: 0,
      interestRate: 0,
      tenure: 1,
      reason: "",
    },
  });

  const watchedValues = form.watch();
  const selectedLoanType = loanTypes.find((lt) => lt.value === watchedValues.loanType);

  const activeEmployees = employees.filter((e) => e.status === "active");

  const calculateLoan = () => {
    const { principalAmount, interestRate, tenure } = watchedValues;

    if (principalAmount > 0 && tenure > 0) {
      const monthlyInterest = (principalAmount * (interestRate / 100)) / 12;
      const totalInterest = monthlyInterest * tenure;
      const totalRepayment = principalAmount + totalInterest;
      const monthlyDeduction = totalRepayment / tenure;
      const expectedEndDate = addMonths(new Date(), tenure);

      setCalculatedValues({
        monthlyDeduction,
        totalInterest,
        totalRepayment,
        expectedEndDate,
      });
    }
  };

  const onSubmit = (data: LoanFormData) => {
    if (!calculatedValues) return;

    createLoan(
      {
        employee_id: data.employeeId,
        loan_type: data.loanType,
        principal_amount: data.principalAmount,
        monthly_deduction: Math.round(calculatedValues.monthlyDeduction),
        interest_rate: data.interestRate,
        start_date: format(new Date(), "yyyy-MM-dd"),
        expected_end_date: format(calculatedValues.expectedEndDate, "yyyy-MM-dd"),
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
          setCalculatedValues(null);
        },
      }
    );
  };

  const handleLoanTypeChange = (value: string) => {
    form.setValue("loanType", value as LoanFormData["loanType"]);
    const loanType = loanTypes.find((lt) => lt.value === value);

    if (loanType) {
      if (value === "salary_advance") {
        form.setValue("interestRate", 0);
      }
      if (watchedValues.tenure > loanType.maxTenure) {
        form.setValue("tenure", loanType.maxTenure);
      }
    }
    setCalculatedValues(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Loan Application</DialogTitle>
          <DialogDescription>Create a new loan or salary advance for an employee</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeEmployees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.first_name} {employee.last_name} ({employee.employee_number || "N/A"})
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
                name="loanType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Type</FormLabel>
                    <Select onValueChange={handleLoanTypeChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loanTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Max tenure: {selectedLoanType?.maxTenure} months</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="principalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Amount (LKR)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="100000"
                        value={field.value}
                        onChange={(e) => {
                          field.onChange(Number(e.target.value));
                          setCalculatedValues(null);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="interestRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interest Rate (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="10"
                        disabled={watchedValues.loanType === "salary_advance"}
                        value={field.value}
                        onChange={(e) => {
                          field.onChange(Number(e.target.value));
                          setCalculatedValues(null);
                        }}
                      />
                    </FormControl>
                    {watchedValues.loanType === "salary_advance" && (
                      <FormDescription>No interest for advances</FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tenure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tenure (Months)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={selectedLoanType?.maxTenure || 24}
                        placeholder="12"
                        value={field.value}
                        onChange={(e) => {
                          field.onChange(Number(e.target.value));
                          setCalculatedValues(null);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-center">
              <Button type="button" variant="outline" onClick={calculateLoan}>
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Loan
              </Button>
            </div>

            {calculatedValues && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Deduction</p>
                      <p className="text-lg font-semibold">
                        LKR {calculatedValues.monthlyDeduction.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Interest</p>
                      <p className="text-lg font-semibold">
                        LKR {calculatedValues.totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Repayment</p>
                      <p className="text-lg font-semibold">
                        LKR {calculatedValues.totalRepayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Expected End Date</p>
                      <p className="text-lg font-semibold">{format(calculatedValues.expectedEndDate, "MMM yyyy")}</p>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason / Purpose</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the reason for this loan application..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || !calculatedValues}>
                {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit Application
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
