import { LeaveType, LeaveRequest } from "@/types/payroll";
import { mockEmployees } from "./mockEmployees";

// Sri Lanka standard leave types
export const leaveTypes: LeaveType[] = [
  {
    id: "lt-1",
    companyId: "comp-1",
    name: "Annual Leave",
    code: "AL",
    daysPerYear: 14,
    isCarryForward: true,
    maxCarryForward: 7,
    isPaid: true,
    isActive: true,
  },
  {
    id: "lt-2",
    companyId: "comp-1",
    name: "Casual Leave",
    code: "CL",
    daysPerYear: 7,
    isCarryForward: false,
    maxCarryForward: 0,
    isPaid: true,
    isActive: true,
  },
  {
    id: "lt-3",
    companyId: "comp-1",
    name: "Sick Leave",
    code: "SL",
    daysPerYear: 7,
    isCarryForward: false,
    maxCarryForward: 0,
    isPaid: true,
    isActive: true,
  },
  {
    id: "lt-4",
    companyId: "comp-1",
    name: "Maternity Leave",
    code: "ML",
    daysPerYear: 84,
    isCarryForward: false,
    maxCarryForward: 0,
    isPaid: true,
    isActive: true,
  },
  {
    id: "lt-5",
    companyId: "comp-1",
    name: "Paternity Leave",
    code: "PL",
    daysPerYear: 3,
    isCarryForward: false,
    maxCarryForward: 0,
    isPaid: true,
    isActive: true,
  },
  {
    id: "lt-6",
    companyId: "comp-1",
    name: "No Pay Leave",
    code: "NP",
    daysPerYear: 30,
    isCarryForward: false,
    maxCarryForward: 0,
    isPaid: false,
    isActive: true,
  },
];

// Mock leave requests
export const mockLeaveRequests: LeaveRequest[] = [
  {
    id: "lr-1",
    employeeId: "1",
    employee: mockEmployees[0],
    leaveTypeId: "lt-1",
    leaveType: leaveTypes[0],
    startDate: new Date("2024-12-26"),
    endDate: new Date("2024-12-31"),
    days: 4,
    reason: "Year-end vacation with family",
    status: "pending",
    createdAt: new Date("2024-12-20"),
    updatedAt: new Date("2024-12-20"),
  },
  {
    id: "lr-2",
    employeeId: "3",
    employee: mockEmployees[2],
    leaveTypeId: "lt-2",
    leaveType: leaveTypes[1],
    startDate: new Date("2024-12-23"),
    endDate: new Date("2024-12-23"),
    days: 1,
    reason: "Personal matters",
    status: "approved",
    approvedBy: "HR Manager",
    approvedAt: new Date("2024-12-21"),
    createdAt: new Date("2024-12-19"),
    updatedAt: new Date("2024-12-21"),
  },
  {
    id: "lr-3",
    employeeId: "5",
    employee: mockEmployees[4],
    leaveTypeId: "lt-3",
    leaveType: leaveTypes[2],
    startDate: new Date("2024-12-18"),
    endDate: new Date("2024-12-19"),
    days: 2,
    reason: "Medical appointment and recovery",
    status: "approved",
    approvedBy: "HR Manager",
    approvedAt: new Date("2024-12-17"),
    createdAt: new Date("2024-12-16"),
    updatedAt: new Date("2024-12-17"),
  },
  {
    id: "lr-4",
    employeeId: "2",
    employee: mockEmployees[1],
    leaveTypeId: "lt-1",
    leaveType: leaveTypes[0],
    startDate: new Date("2025-01-02"),
    endDate: new Date("2025-01-10"),
    days: 7,
    reason: "Extended new year holiday",
    status: "pending",
    createdAt: new Date("2024-12-22"),
    updatedAt: new Date("2024-12-22"),
  },
  {
    id: "lr-5",
    employeeId: "7",
    employee: mockEmployees[6],
    leaveTypeId: "lt-2",
    leaveType: leaveTypes[1],
    startDate: new Date("2024-12-16"),
    endDate: new Date("2024-12-16"),
    days: 1,
    reason: "Family emergency",
    status: "rejected",
    rejectionReason: "Insufficient leave balance",
    createdAt: new Date("2024-12-15"),
    updatedAt: new Date("2024-12-15"),
  },
];

// Leave balance per employee per leave type
export interface LeaveBalance {
  employeeId: string;
  leaveTypeId: string;
  entitled: number;
  taken: number;
  pending: number;
  available: number;
  carriedForward: number;
}

// Generate mock leave balances for employees
export function getLeaveBalances(employeeId: string): LeaveBalance[] {
  return leaveTypes.map((lt) => {
    const taken = Math.floor(Math.random() * (lt.daysPerYear / 2));
    const pending = mockLeaveRequests
      .filter(
        (lr) =>
          lr.employeeId === employeeId &&
          lr.leaveTypeId === lt.id &&
          lr.status === "pending"
      )
      .reduce((sum, lr) => sum + lr.days, 0);
    const carriedForward = lt.isCarryForward ? Math.floor(Math.random() * lt.maxCarryForward) : 0;
    
    return {
      employeeId,
      leaveTypeId: lt.id,
      entitled: lt.daysPerYear + carriedForward,
      taken,
      pending,
      available: lt.daysPerYear + carriedForward - taken - pending,
      carriedForward,
    };
  });
}

// Calculate business days between two dates (excluding weekends)
export function calculateBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}
