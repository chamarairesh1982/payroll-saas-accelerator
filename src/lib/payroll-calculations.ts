import { 
  Employee, 
  PaySlip, 
  PaySlipItem,
  EPF_EMPLOYEE_RATE, 
  EPF_EMPLOYER_RATE, 
  ETF_EMPLOYER_RATE,
  DEFAULT_PAYE_SLABS 
} from "@/types/payroll";

// Calculate PAYE tax based on Sri Lanka tax slabs
export function calculatePAYE(monthlyTaxableIncome: number): number {
  let tax = 0;
  let remainingIncome = monthlyTaxableIncome;

  for (const slab of DEFAULT_PAYE_SLABS) {
    if (remainingIncome <= 0) break;
    
    const slabRange = slab.maxIncome === Infinity 
      ? remainingIncome 
      : Math.min(slab.maxIncome - slab.minIncome + 1, remainingIncome);
    
    if (monthlyTaxableIncome > slab.minIncome) {
      const taxableInSlab = Math.min(
        slabRange,
        monthlyTaxableIncome - slab.minIncome
      );
      tax += taxableInSlab * (slab.rate / 100);
      remainingIncome -= taxableInSlab;
    }
  }

  return Math.round(tax);
}

// Calculate EPF contribution (employee portion)
export function calculateEPFEmployee(grossSalary: number): number {
  return Math.round(grossSalary * EPF_EMPLOYEE_RATE);
}

// Calculate EPF contribution (employer portion)
export function calculateEPFEmployer(grossSalary: number): number {
  return Math.round(grossSalary * EPF_EMPLOYER_RATE);
}

// Calculate ETF contribution (employer only)
export function calculateETF(grossSalary: number): number {
  return Math.round(grossSalary * ETF_EMPLOYER_RATE);
}

// Standard allowances (can be configured per company)
export const defaultAllowances: PaySlipItem[] = [
  { name: "Transport Allowance", amount: 5000, type: "allowance" },
  { name: "Medical Allowance", amount: 3000, type: "allowance" },
];

// Generate payslip for an employee
export function generatePayslip(
  employee: Employee,
  payPeriod: { start: Date; end: Date },
  additionalAllowances: PaySlipItem[] = [],
  additionalDeductions: PaySlipItem[] = [],
  workingDays: number = 22,
  workedDays: number = 22,
  otHours: number = 0,
  otRate: number = 1.5
): PaySlip {
  const basicSalary = employee.basicSalary;
  
  // Calculate OT amount (hourly rate = basic / (working days * 8 hours))
  const hourlyRate = basicSalary / (workingDays * 8);
  const otAmount = Math.round(otHours * hourlyRate * otRate);
  
  // Combine allowances
  const allAllowances: PaySlipItem[] = [
    ...defaultAllowances,
    ...additionalAllowances,
    ...(otAmount > 0 ? [{ name: "Overtime", amount: otAmount, type: "allowance" as const }] : []),
  ];
  
  // Calculate gross salary
  const totalAllowances = allAllowances.reduce((sum, a) => sum + a.amount, 0);
  const grossSalary = basicSalary + totalAllowances;
  
  // Calculate statutory deductions
  const epfEmployee = calculateEPFEmployee(basicSalary); // EPF is on basic only
  const epfEmployer = calculateEPFEmployer(basicSalary);
  const etfEmployer = calculateETF(basicSalary);
  
  // Calculate taxable income (gross - EPF employee contribution)
  const taxableIncome = grossSalary - epfEmployee;
  const payeTax = calculatePAYE(taxableIncome);
  
  // Combine all deductions
  const allDeductions: PaySlipItem[] = [
    { name: "EPF (Employee 8%)", amount: epfEmployee, type: "deduction" },
    { name: "PAYE Tax", amount: payeTax, type: "deduction" },
    ...additionalDeductions,
  ];
  
  const totalDeductions = allDeductions.reduce((sum, d) => sum + d.amount, 0);
  const netSalary = grossSalary - totalDeductions;
  
  return {
    id: `PS-${Date.now()}`,
    payrollRunId: "",
    employeeId: employee.id,
    employee,
    basicSalary,
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
    otHours,
    otAmount,
    createdAt: new Date(),
  };
}

// Format currency for Sri Lanka
export function formatLKR(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-LK")}`;
}

// Calculate payroll totals
export function calculatePayrollTotals(payslips: PaySlip[]) {
  return {
    totalGrossSalary: payslips.reduce((sum, p) => sum + p.grossSalary, 0),
    totalNetSalary: payslips.reduce((sum, p) => sum + p.netSalary, 0),
    totalEpfEmployee: payslips.reduce((sum, p) => sum + p.epfEmployee, 0),
    totalEpfEmployer: payslips.reduce((sum, p) => sum + p.epfEmployer, 0),
    totalEtf: payslips.reduce((sum, p) => sum + p.etfEmployer, 0),
    totalPaye: payslips.reduce((sum, p) => sum + p.payeTax, 0),
    employeeCount: payslips.length,
  };
}
