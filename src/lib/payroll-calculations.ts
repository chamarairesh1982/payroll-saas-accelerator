import { 
  PaySlip, 
  PaySlipItem,
  EPF_EMPLOYEE_RATE, 
  EPF_EMPLOYER_RATE, 
  ETF_EMPLOYER_RATE,
  DEFAULT_PAYE_SLABS 
} from "@/types/payroll";

// Calculate PAYE tax based on Sri Lanka tax slabs
export function calculatePAYE(monthlyTaxableIncome: number, customSlabs?: { minIncome: number; maxIncome: number; rate: number }[]): number {
  const slabs = customSlabs || DEFAULT_PAYE_SLABS;
  let tax = 0;
  let remainingIncome = monthlyTaxableIncome;

  for (const slab of slabs) {
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
export function calculateEPFEmployee(basicSalary: number): number {
  return Math.round(basicSalary * EPF_EMPLOYEE_RATE);
}

// Calculate EPF contribution (employer portion)
export function calculateEPFEmployer(basicSalary: number): number {
  return Math.round(basicSalary * EPF_EMPLOYER_RATE);
}

// Calculate ETF contribution (employer only)
export function calculateETF(basicSalary: number): number {
  return Math.round(basicSalary * ETF_EMPLOYER_RATE);
}

// Interface for loan deduction data from database
export interface LoanDeductionData {
  loanId: string;
  loanType: string;
  monthlyDeduction: number;
}

// Get loan deduction items for payslip from database data
export function getLoanDeductionItems(loans: LoanDeductionData[]): PaySlipItem[] {
  return loans.map(loan => ({
    name: `Loan Recovery - ${formatLoanTypeName(loan.loanType)}`,
    amount: loan.monthlyDeduction,
    type: 'deduction' as const,
  }));
}

// Format loan type name for display
function formatLoanTypeName(loanType: string): string {
  const labels: Record<string, string> = {
    salary_advance: 'Salary Advance',
    personal_loan: 'Personal Loan',
    emergency_loan: 'Emergency Loan',
  };
  return labels[loanType] || loanType;
}

// Get total loan deductions amount
export function getTotalLoanDeductions(loans: LoanDeductionData[]): number {
  return loans.reduce((sum, loan) => sum + loan.monthlyDeduction, 0);
}

// Standard allowances (can be configured per company via salary_components)
export const defaultAllowances: PaySlipItem[] = [
  { name: "Transport Allowance", amount: 5000, type: "allowance" },
  { name: "Medical Allowance", amount: 3000, type: "allowance" },
];

// Generate payslip for an employee (without mock data dependencies)
export interface GeneratePayslipParams {
  employeeId: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    nic: string;
    dateOfBirth: Date;
    dateOfJoining: Date;
    department: string;
    designation: string;
    employmentType: 'permanent' | 'contract' | 'probation' | 'intern';
    status: 'active' | 'inactive' | 'terminated';
    bankName: string;
    bankBranch: string;
    bankAccountNumber: string;
    epfNumber: string;
    basicSalary: number;
    companyId: string;
    employeeNumber: string;
    createdAt: Date;
    updatedAt: Date;
  };
  basicSalary: number;
  payPeriod: { start: Date; end: Date };
  allowances?: PaySlipItem[];
  loanDeductions?: LoanDeductionData[];
  additionalDeductions?: PaySlipItem[];
  workingDays?: number;
  workedDays?: number;
  otHours?: number;
  otRate?: number;
  customTaxSlabs?: { minIncome: number; maxIncome: number; rate: number }[];
}

export function generatePayslipWithData(params: GeneratePayslipParams): PaySlip {
  const {
    employeeId,
    employee,
    basicSalary,
    payPeriod,
    allowances = defaultAllowances,
    loanDeductions = [],
    additionalDeductions = [],
    workingDays = 22,
    workedDays = 22,
    otHours = 0,
    otRate = 1.5,
    customTaxSlabs,
  } = params;

  // Calculate OT amount (hourly rate = basic / (working days * 8 hours))
  const hourlyRate = basicSalary / (workingDays * 8);
  const otAmount = Math.round(otHours * hourlyRate * otRate);
  
  // Combine allowances
  const allAllowances: PaySlipItem[] = [
    ...allowances,
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
  const payeTax = calculatePAYE(taxableIncome, customTaxSlabs);
  
  // Get loan deduction items
  const loanDeductionItems = getLoanDeductionItems(loanDeductions);
  
  // Combine all deductions
  const allDeductions: PaySlipItem[] = [
    { name: "EPF (Employee 8%)", amount: epfEmployee, type: "deduction" },
    { name: "PAYE Tax", amount: payeTax, type: "deduction" },
    ...loanDeductionItems,
    ...additionalDeductions,
  ];
  
  const totalDeductions = allDeductions.reduce((sum, d) => sum + d.amount, 0);
  const netSalary = grossSalary - totalDeductions;
  
  return {
    id: `PS-${Date.now()}-${employeeId}`,
    payrollRunId: "",
    employeeId,
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
