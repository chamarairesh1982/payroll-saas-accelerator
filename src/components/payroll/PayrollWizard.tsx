import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  Calendar,
  Users,
  Calculator,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useEmployees, Employee } from "@/hooks/useEmployees";
import { useAttendanceSummary } from "@/hooks/useAttendance";
import { useCreatePayrollRun } from "@/hooks/usePayroll";
import { useActiveLoanDeductions, getTotalLoanDeductionsFromData, LoanDeduction, formatLoanTypeLabel } from "@/hooks/useActiveLoanDeductions";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useCompany } from "@/hooks/useCompany";
import { useCompanyProfileCompleteness } from "@/hooks/useCompanyProfileCompleteness";
import { PaySlip, PaySlipItem } from "@/types/payroll";
import {
  calculatePAYE,
  calculateEPFEmployee,
  calculateEPFEmployer,
  calculateETF,
  formatLKR,
  defaultAllowances,
} from "@/lib/payroll-calculations";
import { cn } from "@/lib/utils";
import { PayslipModal } from "./PayslipModal";
import { CompanyProfileWarning } from "./CompanyProfileWarning";

interface PayrollWizardProps {
  onClose: () => void;
}

const steps = [
  { id: 1, title: "Pay Period", icon: Calendar },
  { id: 2, title: "Select Employees", icon: Users },
  { id: 3, title: "Review Calculations", icon: Calculator },
  { id: 4, title: "Confirm & Process", icon: FileCheck },
];

// Generate payslip from employee with attendance data and loan deductions
function generatePayslipFromEmployee(
  employee: Employee,
  attendanceSummary: { workedDays: number; workedHours: number } | undefined,
  loanDeductions: LoanDeduction[],
  payPeriod: { start: Date; end: Date },
  workingDays: number = 22,
  loansEnabled: boolean = false
): PaySlip {
  const basicSalary = employee.basic_salary || 0;
  const workedDays = attendanceSummary?.workedDays ?? workingDays;
  
  // Calculate daily rate and adjust for worked days
  const dailyRate = basicSalary / workingDays;
  const adjustedBasic = Math.round(dailyRate * workedDays);
  
  // Combine allowances
  const allAllowances: PaySlipItem[] = [...defaultAllowances];
  
  // Calculate gross salary
  const totalAllowances = allAllowances.reduce((sum, a) => sum + a.amount, 0);
  const grossSalary = adjustedBasic + totalAllowances;
  
  // Calculate statutory deductions
  const epfEmployee = calculateEPFEmployee(adjustedBasic);
  const epfEmployer = calculateEPFEmployer(adjustedBasic);
  const etfEmployer = calculateETF(adjustedBasic);
  
  // Calculate taxable income
  const taxableIncome = grossSalary - epfEmployee;
  const payeTax = calculatePAYE(taxableIncome);
  
  // Combine all deductions (statutory + loans)
  const allDeductions: PaySlipItem[] = [
    { name: "EPF (Employee 8%)", amount: epfEmployee, type: "deduction" },
    { name: "PAYE Tax", amount: payeTax, type: "deduction" },
  ];

  // Add loan deductions if loans module is enabled
  if (loansEnabled && loanDeductions.length > 0) {
    loanDeductions.forEach(loan => {
      allDeductions.push({
        name: `${formatLoanTypeLabel(loan.loanType)} Deduction`,
        amount: loan.monthlyDeduction,
        type: "deduction",
      });
    });
  }
  
  const totalDeductions = allDeductions.reduce((sum, d) => sum + d.amount, 0);
  const netSalary = grossSalary - totalDeductions;
  
  return {
    id: `PS-${Date.now()}-${employee.id}`,
    payrollRunId: "",
    employeeId: employee.id,
    employee: {
      id: employee.id,
      epfNumber: employee.epf_number || "",
      firstName: employee.first_name || "",
      lastName: employee.last_name || "",
      email: employee.email || "",
      phone: employee.phone || "",
      nic: employee.nic || "",
      dateOfBirth: employee.date_of_birth ? new Date(employee.date_of_birth) : new Date(),
      dateOfJoining: employee.date_of_joining ? new Date(employee.date_of_joining) : new Date(),
      department: employee.department || "",
      designation: employee.designation || "",
      employmentType: (employee.employment_type || "permanent") as any,
      status: (employee.status || "active") as any,
      basicSalary: basicSalary,
      bankName: employee.bank_name || "",
      bankBranch: employee.bank_branch || "",
      bankAccountNumber: employee.bank_account_number || "",
      companyId: employee.company_id || "",
      employeeNumber: employee.employee_number || "",
      createdAt: new Date(employee.created_at),
      updatedAt: new Date(employee.updated_at),
    },
    basicSalary: adjustedBasic,
    allowances: allAllowances,
    deductions: allDeductions,
    grossSalary,
    taxableIncome,
    epfEmployee,
    epfEmployer,
    etfEmployer,
    payeTax,
    netSalary,
    workingDays,
    workedDays,
    otHours: 0,
    otAmount: 0,
    createdAt: new Date(),
  };
}

export function PayrollWizard({ onClose }: PayrollWizardProps) {
  const { toast } = useToast();
  const { employees, isLoading: employeesLoading } = useEmployees();
  const createPayrollRun = useCreatePayrollRun();
  const { isFeatureEnabled } = useFeatureFlags();
  const { company } = useCompany();
  const profileCompleteness = useCompanyProfileCompleteness(company);
  
  const loansEnabled = isFeatureEnabled('loans_enabled');
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<PaySlip | null>(null);

  // Step 1: Pay Period
  const [payPeriod, setPayPeriod] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    payDate: new Date(new Date().getFullYear(), new Date().getMonth(), 25)
      .toISOString()
      .split("T")[0],
  });

  // Get active employees
  const activeEmployees = useMemo(() => 
    employees.filter((e) => e.status === "active"),
    [employees]
  );

  // Step 2: Employee Selection
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  // Initialize selected employees when data loads
  useMemo(() => {
    if (activeEmployees.length > 0 && selectedEmployees.length === 0) {
      setSelectedEmployees(activeEmployees.map((e) => e.id));
    }
  }, [activeEmployees]);

  // Fetch attendance summary for selected employees
  const { data: attendanceSummary = {} } = useAttendanceSummary(
    selectedEmployees,
    payPeriod.month,
    payPeriod.year
  );

  // Fetch loan deductions for selected employees
  const { data: loanDeductions = {} } = useActiveLoanDeductions(selectedEmployees);

  // Step 3: Generated Payslips
  const payslips = useMemo(() => {
    const selected = activeEmployees.filter((e) => selectedEmployees.includes(e.id));
    return selected.map((employee) =>
      generatePayslipFromEmployee(
        employee,
        attendanceSummary[employee.id],
        loanDeductions[employee.id] || [],
        {
          start: new Date(payPeriod.year, payPeriod.month - 1, 1),
          end: new Date(payPeriod.year, payPeriod.month, 0),
        },
        22,
        loansEnabled
      )
    );
  }, [selectedEmployees, payPeriod, activeEmployees, attendanceSummary, loanDeductions, loansEnabled]);

  const totals = useMemo(() => ({
    totalGrossSalary: payslips.reduce((sum, p) => sum + p.grossSalary, 0),
    totalNetSalary: payslips.reduce((sum, p) => sum + p.netSalary, 0),
    totalEpfEmployee: payslips.reduce((sum, p) => sum + p.epfEmployee, 0),
    totalEpfEmployer: payslips.reduce((sum, p) => sum + p.epfEmployer, 0),
    totalEtf: payslips.reduce((sum, p) => sum + p.etfEmployer, 0),
    totalPaye: payslips.reduce((sum, p) => sum + p.payeTax, 0),
    employeeCount: payslips.length,
  }), [payslips]);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleProcess = async () => {
    const payPeriodStart = new Date(payPeriod.year, payPeriod.month - 1, 1).toISOString().split("T")[0];
    const payPeriodEnd = new Date(payPeriod.year, payPeriod.month, 0).toISOString().split("T")[0];
    
    createPayrollRun.mutate({
      payPeriodStart,
      payPeriodEnd,
      payDate: payPeriod.payDate,
      payslips: payslips.map((p) => ({
        employeeId: p.employeeId,
        basicSalary: p.basicSalary,
        grossSalary: p.grossSalary,
        netSalary: p.netSalary,
        epfEmployee: p.epfEmployee,
        epfEmployer: p.epfEmployer,
        etfEmployer: p.etfEmployer,
        payeTax: p.payeTax,
        taxableIncome: p.taxableIncome,
        allowances: p.allowances,
        deductions: p.deductions,
        workedDays: p.workedDays,
        workingDays: p.workingDays,
        otHours: p.otHours,
        otAmount: p.otAmount,
      })),
    }, {
      onSuccess: () => {
        setIsComplete(true);
        toast({
          title: "Payroll Processed Successfully",
          description: `${payslips.length} payslips generated for ${months[payPeriod.month - 1]} ${payPeriod.year}.`,
        });
      },
    });
  };

  const toggleEmployee = (id: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(id)
        ? prev.filter((e) => e !== id)
        : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedEmployees(activeEmployees.map((e) => e.id));
  };

  const deselectAll = () => {
    setSelectedEmployees([]);
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
        className="fixed inset-4 z-50 mx-auto max-w-5xl overflow-hidden rounded-2xl bg-card shadow-2xl lg:inset-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
          <div>
            <h2 className="font-display text-xl font-bold">Run Payroll</h2>
            <p className="text-sm text-muted-foreground">
              {months[payPeriod.month - 1]} {payPeriod.year}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Steps */}
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                      currentStep > step.id
                        ? "bg-success text-success-foreground"
                        : currentStep === step.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "hidden font-medium sm:inline",
                      currentStep >= step.id
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "mx-4 h-0.5 w-12 lg:w-24",
                      currentStep > step.id ? "bg-success" : "bg-border"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-200px)] overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Pay Period */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold">Select Pay Period</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose the month and year for this payroll run.
                  </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Month</Label>
                    <select
                      value={payPeriod.month}
                      onChange={(e) =>
                        setPayPeriod({ ...payPeriod, month: Number(e.target.value) })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      {months.map((month, index) => (
                        <option key={month} value={index + 1}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <select
                      value={payPeriod.year}
                      onChange={(e) =>
                        setPayPeriod({ ...payPeriod, year: Number(e.target.value) })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value={2024}>2024</option>
                      <option value={2025}>2025</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Pay Date</Label>
                    <Input
                      type="date"
                      value={payPeriod.payDate}
                      onChange={(e) =>
                        setPayPeriod({ ...payPeriod, payDate: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-primary/5 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Pay Period Summary</p>
                      <p className="text-sm text-muted-foreground">
                        Payroll will be calculated for{" "}
                        <strong>
                          {months[payPeriod.month - 1]} 1-
                          {new Date(payPeriod.year, payPeriod.month, 0).getDate()},{" "}
                          {payPeriod.year}
                        </strong>
                        . Salaries will be paid on{" "}
                        <strong>
                          {new Date(payPeriod.payDate).toLocaleDateString("en-LK", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </strong>
                        .
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Select Employees */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Select Employees</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose which employees to include in this payroll run.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAll}>
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={deselectAll}>
                      Deselect All
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Basic Salary</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeEmployees.map((employee) => (
                        <TableRow
                          key={employee.id}
                          className={cn(
                            "cursor-pointer",
                            selectedEmployees.includes(employee.id) && "bg-primary/5"
                          )}
                          onClick={() => toggleEmployee(employee.id)}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedEmployees.includes(employee.id)}
                              onCheckedChange={() => toggleEmployee(employee.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                {employee.first_name?.[0]}
                                {employee.last_name?.[0]}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {employee.first_name} {employee.last_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {employee.epf_number}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{employee.department}</TableCell>
                          <TableCell>{formatLKR(employee.basic_salary || 0)}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                employee.status === "active"
                                  ? "bg-success/15 text-success"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {employee.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                  <span className="text-sm text-muted-foreground">
                    Selected employees
                  </span>
                  <span className="font-semibold">
                    {selectedEmployees.length} of {activeEmployees.length}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Step 3: Review Calculations */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold">Review Calculations</h3>
                  <p className="text-sm text-muted-foreground">
                    Verify EPF, ETF, and PAYE tax calculations for each employee.
                  </p>
                </div>

                {/* Totals Summary */}
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="rounded-lg bg-primary/5 p-4">
                    <p className="text-sm text-muted-foreground">Total Gross</p>
                    <p className="text-xl font-bold">{formatLKR(totals.totalGrossSalary)}</p>
                  </div>
                  <div className="rounded-lg bg-success/5 p-4">
                    <p className="text-sm text-muted-foreground">Total Net</p>
                    <p className="text-xl font-bold text-success">
                      {formatLKR(totals.totalNetSalary)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-accent/5 p-4">
                    <p className="text-sm text-muted-foreground">Total EPF</p>
                    <p className="text-xl font-bold">
                      {formatLKR(totals.totalEpfEmployee + totals.totalEpfEmployer)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Emp: {formatLKR(totals.totalEpfEmployee)} | Empr: {formatLKR(totals.totalEpfEmployer)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-warning/5 p-4">
                    <p className="text-sm text-muted-foreground">Total ETF</p>
                    <p className="text-xl font-bold">{formatLKR(totals.totalEtf)}</p>
                  </div>
                </div>

                {/* Payslips Table */}
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Employee</TableHead>
                        <TableHead className="text-right">Basic</TableHead>
                        <TableHead className="text-right">Gross</TableHead>
                        <TableHead className="text-right">EPF (8%)</TableHead>
                        <TableHead className="text-right">PAYE</TableHead>
                        <TableHead className="text-right">Net Salary</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payslips.map((payslip) => (
                        <TableRow key={payslip.employeeId}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {payslip.employee.firstName} {payslip.employee.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {payslip.employee.department}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatLKR(payslip.basicSalary)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatLKR(payslip.grossSalary)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatLKR(payslip.epfEmployee)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatLKR(payslip.payeTax)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-success">
                            {formatLKR(payslip.netSalary)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setSelectedPayslip(payslip)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </motion.div>
            )}

            {/* Step 4: Confirm & Process */}
            {currentStep === 4 && !isComplete && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold">Confirm & Process</h3>
                  <p className="text-sm text-muted-foreground">
                    Review the summary and confirm to process payroll.
                  </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Summary Card */}
                  <div className="rounded-xl border p-6">
                    <h4 className="mb-4 font-semibold">Payroll Summary</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pay Period</span>
                        <span className="font-medium">
                          {months[payPeriod.month - 1]} {payPeriod.year}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pay Date</span>
                        <span className="font-medium">
                          {new Date(payPeriod.payDate).toLocaleDateString("en-LK")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Employees</span>
                        <span className="font-medium">{payslips.length}</span>
                      </div>
                      <hr className="my-3" />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Gross Salary</span>
                        <span className="font-medium">{formatLKR(totals.totalGrossSalary)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Deductions</span>
                        <span className="font-medium text-destructive">
                          -{formatLKR(totals.totalGrossSalary - totals.totalNetSalary)}
                        </span>
                      </div>
                      <hr className="my-3" />
                      <div className="flex justify-between text-lg">
                        <span className="font-semibold">Net Disbursement</span>
                        <span className="font-bold text-success">
                          {formatLKR(totals.totalNetSalary)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Statutory Contributions */}
                  <div className="rounded-xl border p-6">
                    <h4 className="mb-4 font-semibold">Statutory Contributions</h4>
                    <div className="space-y-4">
                      <div className="rounded-lg bg-muted/50 p-4">
                        <div className="flex items-center justify-between">
                          <span>EPF (Employee 8%)</span>
                          <span className="font-semibold">{formatLKR(totals.totalEpfEmployee)}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span>EPF (Employer 12%)</span>
                          <span className="font-semibold">{formatLKR(totals.totalEpfEmployer)}</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex items-center justify-between font-semibold">
                          <span>Total EPF</span>
                          <span>{formatLKR(totals.totalEpfEmployee + totals.totalEpfEmployer)}</span>
                        </div>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-4">
                        <div className="flex items-center justify-between font-semibold">
                          <span>ETF (Employer 3%)</span>
                          <span>{formatLKR(totals.totalEtf)}</span>
                        </div>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-4">
                        <div className="flex items-center justify-between font-semibold">
                          <span>Total PAYE Tax</span>
                          <span>{formatLKR(totals.totalPaye)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 text-warning" />
                    <div>
                      <p className="font-medium">Important</p>
                      <p className="text-sm text-muted-foreground">
                        Once processed, this payroll run will generate payslips for all
                        selected employees. EPF/ETF contributions will be calculated and
                        recorded. Make sure all details are correct before proceeding.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Company Profile Warning */}
                {!profileCompleteness.isPayrollReady && (
                  <CompanyProfileWarning completeness={profileCompleteness} />
                )}
              </motion.div>
            )}

            {/* Completion */}
            {isComplete && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
                  <CheckCircle2 className="h-10 w-10 text-success" />
                </div>
                <h3 className="mb-2 text-2xl font-bold">Payroll Processed!</h3>
                <p className="mb-6 text-muted-foreground">
                  {payslips.length} payslips have been generated for{" "}
                  {months[payPeriod.month - 1]} {payPeriod.year}.
                </p>
                <div className="flex gap-4">
                  <Button variant="outline">
                    <Download className="h-4 w-4" />
                    Download Payslips
                  </Button>
                  <Button variant="outline">
                    <FileCheck className="h-4 w-4" />
                    Generate EPF Report
                  </Button>
                  <Button onClick={onClose}>Done</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {!isComplete && (
          <div className="flex items-center justify-between border-t border-border bg-muted/30 px-6 py-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            {currentStep < 4 ? (
              <Button
                onClick={handleNext}
                disabled={currentStep === 2 && selectedEmployees.length === 0}
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleProcess} disabled={createPayrollRun.isPending}>
                {createPayrollRun.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Process Payroll
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </motion.div>

      {/* Payslip Modal */}
      {selectedPayslip && (
        <PayslipModal
          payslip={selectedPayslip}
          month={months[payPeriod.month - 1]}
          year={payPeriod.year}
          onClose={() => setSelectedPayslip(null)}
        />
      )}
    </>
  );
}
