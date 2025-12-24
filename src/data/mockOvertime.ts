import { OvertimeRate, OvertimeEntry } from "@/types/payroll";
import { mockEmployees } from "./mockEmployees";
import { addDays, subDays, startOfMonth, format } from "date-fns";

export const mockOvertimeRates: OvertimeRate[] = [
  {
    id: "ot-rate-1",
    companyId: "company-1",
    name: "Weekday OT",
    multiplier: 1.5,
    dayType: "weekday",
    isActive: true,
  },
  {
    id: "ot-rate-2",
    companyId: "company-1",
    name: "Saturday OT",
    multiplier: 2.0,
    dayType: "saturday",
    isActive: true,
  },
  {
    id: "ot-rate-3",
    companyId: "company-1",
    name: "Sunday OT",
    multiplier: 2.5,
    dayType: "sunday",
    isActive: true,
  },
  {
    id: "ot-rate-4",
    companyId: "company-1",
    name: "Holiday OT",
    multiplier: 3.0,
    dayType: "holiday",
    isActive: true,
  },
];

const today = new Date();
const monthStart = startOfMonth(today);

export const mockOvertimeEntries: OvertimeEntry[] = [
  {
    id: "ot-1",
    employeeId: "emp-1",
    employee: mockEmployees[0],
    date: subDays(today, 2),
    hours: 3,
    overtimeRateId: "ot-rate-1",
    overtimeRate: mockOvertimeRates[0],
    calculatedAmount: 2813, // 3 hours * 1.5 * (75000 / 22 / 8)
    status: "approved",
    approvedBy: "HR Manager",
    approvedAt: subDays(today, 1),
    createdAt: subDays(today, 2),
  },
  {
    id: "ot-2",
    employeeId: "emp-2",
    employee: mockEmployees[1],
    date: subDays(today, 5),
    hours: 4,
    overtimeRateId: "ot-rate-2",
    overtimeRate: mockOvertimeRates[1],
    calculatedAmount: 5682, // 4 hours * 2.0 * (75000 / 22 / 8)
    status: "approved",
    approvedBy: "Department Head",
    approvedAt: subDays(today, 4),
    createdAt: subDays(today, 5),
  },
  {
    id: "ot-3",
    employeeId: "emp-3",
    employee: mockEmployees[2],
    date: subDays(today, 1),
    hours: 2,
    overtimeRateId: "ot-rate-1",
    overtimeRate: mockOvertimeRates[0],
    calculatedAmount: 1705, // 2 hours * 1.5 * (60000 / 22 / 8)
    status: "pending",
    createdAt: subDays(today, 1),
  },
  {
    id: "ot-4",
    employeeId: "emp-4",
    employee: mockEmployees[3],
    date: subDays(today, 3),
    hours: 5,
    overtimeRateId: "ot-rate-3",
    overtimeRate: mockOvertimeRates[2],
    calculatedAmount: 4261, // 5 hours * 2.5 * (60000 / 22 / 8)
    status: "pending",
    createdAt: subDays(today, 3),
  },
  {
    id: "ot-5",
    employeeId: "emp-1",
    employee: mockEmployees[0],
    date: subDays(today, 10),
    hours: 6,
    overtimeRateId: "ot-rate-4",
    overtimeRate: mockOvertimeRates[3],
    calculatedAmount: 7670, // 6 hours * 3.0 * (75000 / 22 / 8)
    status: "approved",
    approvedBy: "Finance Manager",
    approvedAt: subDays(today, 9),
    createdAt: subDays(today, 10),
  },
  {
    id: "ot-6",
    employeeId: "emp-2",
    employee: mockEmployees[1],
    date: subDays(today, 7),
    hours: 2,
    overtimeRateId: "ot-rate-1",
    overtimeRate: mockOvertimeRates[0],
    calculatedAmount: 1278, // 2 hours * 1.5 * (75000 / 22 / 8)
    status: "rejected",
    approvedBy: "HR Manager",
    approvedAt: subDays(today, 6),
    createdAt: subDays(today, 7),
  },
];

export const calculateOvertimeAmount = (
  basicSalary: number,
  hours: number,
  multiplier: number,
  workingDays: number = 22,
  hoursPerDay: number = 8
): number => {
  const hourlyRate = basicSalary / (workingDays * hoursPerDay);
  return Math.round(hours * hourlyRate * multiplier);
};

export const getOvertimeStats = () => {
  const currentMonth = mockOvertimeEntries.filter(
    (e) => e.date >= monthStart && e.status !== "rejected"
  );
  
  const pendingEntries = mockOvertimeEntries.filter(e => e.status === "pending");
  const approvedEntries = mockOvertimeEntries.filter(e => e.status === "approved");
  
  const totalHours = currentMonth.reduce((sum, e) => sum + e.hours, 0);
  const totalAmount = currentMonth.reduce((sum, e) => sum + e.calculatedAmount, 0);
  const pendingAmount = pendingEntries.reduce((sum, e) => sum + e.calculatedAmount, 0);
  
  return {
    totalHours,
    totalAmount,
    pendingCount: pendingEntries.length,
    pendingAmount,
    approvedCount: approvedEntries.length,
  };
};

export const formatDayType = (dayType: OvertimeRate['dayType']): string => {
  const labels: Record<OvertimeRate['dayType'], string> = {
    weekday: 'Weekday',
    saturday: 'Saturday',
    sunday: 'Sunday',
    holiday: 'Holiday',
  };
  return labels[dayType];
};
