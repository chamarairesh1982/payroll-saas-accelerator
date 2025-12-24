// Sri Lanka Payroll System Types

export interface Company {
  id: string;
  name: string;
  registrationNumber: string;
  epfNumber: string;
  etfNumber: string;
  address: string;
  phone: string;
  email: string;
  bankName: string;
  bankBranch: string;
  bankAccountNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Employee {
  id: string;
  companyId: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nic: string; // National Identity Card
  dateOfBirth: Date;
  dateOfJoining: Date;
  dateOfLeaving?: Date;
  department: string;
  designation: string;
  employmentType: 'permanent' | 'contract' | 'probation' | 'intern';
  status: 'active' | 'inactive' | 'terminated';
  bankName: string;
  bankBranch: string;
  bankAccountNumber: string;
  epfNumber: string;
  basicSalary: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalaryComponent {
  id: string;
  companyId: string;
  name: string;
  type: 'allowance' | 'deduction';
  category: 'fixed' | 'percentage' | 'variable';
  calculationType: 'basic' | 'gross' | 'fixed';
  value: number;
  isTaxable: boolean;
  isEpfApplicable: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollRun {
  id: string;
  companyId: string;
  payPeriodStart: Date;
  payPeriodEnd: Date;
  payDate: Date;
  status: 'draft' | 'processing' | 'pending_approval' | 'approved' | 'paid';
  totalGrossSalary: number;
  totalNetSalary: number;
  totalEpfEmployee: number;
  totalEpfEmployer: number;
  totalEtf: number;
  totalPaye: number;
  employeeCount: number;
  approvedBy?: string;
  approvedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaySlip {
  id: string;
  payrollRunId: string;
  employeeId: string;
  employee: Employee;
  basicSalary: number;
  allowances: PaySlipItem[];
  deductions: PaySlipItem[];
  grossSalary: number;
  taxableIncome: number;
  epfEmployee: number; // 8% of gross
  epfEmployer: number; // 12% of gross
  etfEmployer: number; // 3% of gross
  payeTax: number;
  netSalary: number;
  workingDays: number;
  workedDays: number;
  otHours: number;
  otAmount: number;
  createdAt: Date;
}

export interface PaySlipItem {
  name: string;
  amount: number;
  type: 'allowance' | 'deduction';
}

// Sri Lanka PAYE Tax Slabs (as of 2024)
export interface TaxSlab {
  id: string;
  companyId: string;
  minIncome: number;
  maxIncome: number;
  rate: number; // percentage
  isActive: boolean;
  effectiveFrom: Date;
  effectiveTo?: Date;
}

export interface LeaveType {
  id: string;
  companyId: string;
  name: string;
  code: string;
  daysPerYear: number;
  isCarryForward: boolean;
  maxCarryForward: number;
  isPaid: boolean;
  isActive: boolean;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employee: Employee;
  leaveTypeId: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OvertimeRate {
  id: string;
  companyId: string;
  name: string;
  multiplier: number; // e.g., 1.5 for time-and-a-half
  dayType: 'weekday' | 'saturday' | 'sunday' | 'holiday';
  isActive: boolean;
}

export interface OvertimeEntry {
  id: string;
  employeeId: string;
  employee: Employee;
  date: Date;
  hours: number;
  overtimeRateId: string;
  overtimeRate: OvertimeRate;
  calculatedAmount: number;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
}

export interface Loan {
  id: string;
  employeeId: string;
  employee: Employee;
  loanType: 'salary_advance' | 'personal_loan' | 'emergency_loan';
  principalAmount: number;
  outstandingAmount: number;
  monthlyDeduction: number;
  interestRate: number;
  startDate: Date;
  expectedEndDate: Date;
  status: 'active' | 'completed' | 'defaulted';
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
}

export interface LoanRecoverySchedule {
  id: string;
  loanId: string;
  installmentNumber: number;
  dueDate: Date;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  paidAmount: number;
  paidDate?: Date;
  status: 'pending' | 'paid' | 'partial' | 'overdue';
}

// Dashboard Stats
export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalPayroll: number;
  pendingApprovals: number;
  pendingLeaves: number;
  upcomingPayDate: Date;
  epfContributions: number;
  etfContributions: number;
  monthlyTrend: MonthlyTrend[];
}

export interface MonthlyTrend {
  month: string;
  gross: number;
  net: number;
  epf: number;
  etf: number;
}

// User & Roles
export type UserRole = 'super_admin' | 'admin' | 'hr' | 'manager' | 'employee';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyId?: string;
  employeeId?: string;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

// Sri Lanka specific EPF/ETF rates
export const EPF_EMPLOYEE_RATE = 0.08; // 8%
export const EPF_EMPLOYER_RATE = 0.12; // 12%
export const ETF_EMPLOYER_RATE = 0.03; // 3%

// Default PAYE Tax Slabs (Sri Lanka 2024)
export const DEFAULT_PAYE_SLABS = [
  { minIncome: 0, maxIncome: 100000, rate: 0 },
  { minIncome: 100001, maxIncome: 141667, rate: 6 },
  { minIncome: 141668, maxIncome: 183333, rate: 12 },
  { minIncome: 183334, maxIncome: 225000, rate: 18 },
  { minIncome: 225001, maxIncome: 266667, rate: 24 },
  { minIncome: 266668, maxIncome: 308333, rate: 30 },
  { minIncome: 308334, maxIncome: Infinity, rate: 36 },
];
