import { Loan, LoanRecoverySchedule } from "@/types/payroll";
import { mockEmployees } from "./mockEmployees";
import { addMonths, format } from "date-fns";

// Generate recovery schedule for a loan
export const generateRecoverySchedule = (
  loan: Loan,
  installments: number
): LoanRecoverySchedule[] => {
  const schedule: LoanRecoverySchedule[] = [];
  const monthlyPrincipal = loan.principalAmount / installments;
  const monthlyInterest = (loan.principalAmount * (loan.interestRate / 100)) / 12;
  
  for (let i = 0; i < installments; i++) {
    const dueDate = addMonths(loan.startDate, i + 1);
    const isPaid = dueDate < new Date();
    const isOverdue = !isPaid && dueDate < new Date();
    
    schedule.push({
      id: `${loan.id}-${i + 1}`,
      loanId: loan.id,
      installmentNumber: i + 1,
      dueDate,
      principalAmount: monthlyPrincipal,
      interestAmount: monthlyInterest,
      totalAmount: monthlyPrincipal + monthlyInterest,
      paidAmount: isPaid ? monthlyPrincipal + monthlyInterest : 0,
      paidDate: isPaid ? dueDate : undefined,
      status: isPaid ? 'paid' : isOverdue ? 'overdue' : 'pending',
    });
  }
  
  return schedule;
};

// Calculate outstanding amount based on payments
const calculateOutstanding = (principal: number, paidInstallments: number, totalInstallments: number): number => {
  const paidAmount = (principal / totalInstallments) * paidInstallments;
  return principal - paidAmount;
};

export const mockLoans: Loan[] = [
  {
    id: "loan-1",
    employeeId: "emp-1",
    employee: mockEmployees[0],
    loanType: "salary_advance",
    principalAmount: 50000,
    outstandingAmount: calculateOutstanding(50000, 2, 5),
    monthlyDeduction: 10000,
    interestRate: 0,
    startDate: new Date("2024-10-01"),
    expectedEndDate: new Date("2025-02-01"),
    status: "active",
    approvedBy: "HR Manager",
    approvedAt: new Date("2024-09-28"),
    createdAt: new Date("2024-09-25"),
  },
  {
    id: "loan-2",
    employeeId: "emp-2",
    employee: mockEmployees[1],
    loanType: "personal_loan",
    principalAmount: 200000,
    outstandingAmount: calculateOutstanding(200000, 6, 12),
    monthlyDeduction: 17500,
    interestRate: 10,
    startDate: new Date("2024-06-01"),
    expectedEndDate: new Date("2025-05-01"),
    status: "active",
    approvedBy: "Finance Manager",
    approvedAt: new Date("2024-05-28"),
    createdAt: new Date("2024-05-20"),
  },
  {
    id: "loan-3",
    employeeId: "emp-3",
    employee: mockEmployees[2],
    loanType: "emergency_loan",
    principalAmount: 100000,
    outstandingAmount: 0,
    monthlyDeduction: 25000,
    interestRate: 5,
    startDate: new Date("2024-03-01"),
    expectedEndDate: new Date("2024-06-01"),
    status: "completed",
    approvedBy: "HR Manager",
    approvedAt: new Date("2024-02-28"),
    createdAt: new Date("2024-02-25"),
  },
  {
    id: "loan-4",
    employeeId: "emp-4",
    employee: mockEmployees[3],
    loanType: "personal_loan",
    principalAmount: 300000,
    outstandingAmount: calculateOutstanding(300000, 3, 24),
    monthlyDeduction: 13750,
    interestRate: 12,
    startDate: new Date("2024-09-01"),
    expectedEndDate: new Date("2026-08-01"),
    status: "active",
    approvedBy: "Finance Director",
    approvedAt: new Date("2024-08-29"),
    createdAt: new Date("2024-08-25"),
  },
];

export const loanTypes = [
  { value: "salary_advance", label: "Salary Advance", maxInterest: 0, maxTenure: 3 },
  { value: "personal_loan", label: "Personal Loan", maxInterest: 15, maxTenure: 24 },
  { value: "emergency_loan", label: "Emergency Loan", maxInterest: 8, maxTenure: 6 },
];

export const getLoanStats = () => {
  const activeLoans = mockLoans.filter(l => l.status === 'active');
  const totalDisbursed = mockLoans.reduce((sum, l) => sum + l.principalAmount, 0);
  const totalOutstanding = activeLoans.reduce((sum, l) => sum + l.outstandingAmount, 0);
  const monthlyDeductions = activeLoans.reduce((sum, l) => sum + l.monthlyDeduction, 0);
  
  return {
    activeLoans: activeLoans.length,
    totalDisbursed,
    totalOutstanding,
    monthlyDeductions,
    completedLoans: mockLoans.filter(l => l.status === 'completed').length,
  };
};

export const formatLoanType = (type: Loan['loanType']): string => {
  const labels: Record<Loan['loanType'], string> = {
    salary_advance: 'Salary Advance',
    personal_loan: 'Personal Loan',
    emergency_loan: 'Emergency Loan',
  };
  return labels[type];
};
