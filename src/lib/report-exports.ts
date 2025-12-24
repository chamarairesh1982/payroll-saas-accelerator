import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { mockEmployees } from "@/data/mockEmployees";
import { getLeaveBalances, leaveTypes, LeaveBalance } from "@/data/mockLeave";
import { generatePayslip, calculatePayrollTotals } from "@/lib/payroll-calculations";
import { EPF_EMPLOYEE_RATE, EPF_EMPLOYER_RATE, ETF_EMPLOYER_RATE } from "@/types/payroll";
import { format, startOfMonth, endOfMonth } from "date-fns";

// Helper to get leave type by id
const getLeaveTypeById = (leaveTypeId: string) => {
  return leaveTypes.find(lt => lt.id === leaveTypeId);
};

// Helper to get balance for a specific leave type code
const getBalanceByCode = (balances: LeaveBalance[], code: string) => {
  const leaveType = leaveTypes.find(lt => lt.code === code);
  if (!leaveType) return null;
  return balances.find(b => b.leaveTypeId === leaveType.id);
};

// Get payroll data for a given month
export const getPayrollSummaryData = (month: Date = new Date()) => {
  const activeEmployees = mockEmployees.filter(e => e.status === 'active');
  const payslips = activeEmployees.map(emp => 
    generatePayslip(emp, { start: startOfMonth(month), end: endOfMonth(month) })
  );
  
  const totals = calculatePayrollTotals(payslips);
  
  const departmentSummary = activeEmployees.reduce((acc, emp) => {
    if (!acc[emp.department]) {
      acc[emp.department] = { count: 0, basicTotal: 0, grossTotal: 0, netTotal: 0 };
    }
    const payslip = payslips.find(p => p.employeeId === emp.id);
    if (payslip) {
      acc[emp.department].count++;
      acc[emp.department].basicTotal += payslip.basicSalary;
      acc[emp.department].grossTotal += payslip.grossSalary;
      acc[emp.department].netTotal += payslip.netSalary;
    }
    return acc;
  }, {} as Record<string, { count: number; basicTotal: number; grossTotal: number; netTotal: number }>);

  return {
    payslips,
    totals,
    departmentSummary,
    month,
  };
};

// Get EPF/ETF contribution data
export const getContributionData = (month: Date = new Date()) => {
  const activeEmployees = mockEmployees.filter(e => e.status === 'active');
  
  return activeEmployees.map(emp => {
    const epfEmployee = Math.round(emp.basicSalary * EPF_EMPLOYEE_RATE);
    const epfEmployer = Math.round(emp.basicSalary * EPF_EMPLOYER_RATE);
    const etfEmployer = Math.round(emp.basicSalary * ETF_EMPLOYER_RATE);
    
    return {
      employeeNumber: emp.employeeNumber,
      name: `${emp.firstName} ${emp.lastName}`,
      nic: emp.nic,
      epfNumber: emp.epfNumber,
      basicSalary: emp.basicSalary,
      epfEmployee,
      epfEmployer,
      epfTotal: epfEmployee + epfEmployer,
      etfEmployer,
    };
  });
};

// Get leave balance report data
export const getLeaveBalanceData = () => {
  const activeEmployees = mockEmployees.filter(e => e.status === 'active');
  
  return activeEmployees.map(emp => {
    const balances = getLeaveBalances(emp.id);
    return {
      employeeNumber: emp.employeeNumber,
      name: `${emp.firstName} ${emp.lastName}`,
      department: emp.department,
      balances,
    };
  });
};

// Export to PDF - Payroll Summary
export const exportPayrollSummaryPDF = (month: Date = new Date()) => {
  const data = getPayrollSummaryData(month);
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text("Payroll Summary Report", 14, 22);
  doc.setFontSize(12);
  doc.text(`Period: ${format(month, "MMMM yyyy")}`, 14, 32);
  doc.text(`Generated: ${format(new Date(), "dd MMM yyyy HH:mm")}`, 14, 40);
  
  // Summary Stats
  doc.setFontSize(14);
  doc.text("Summary", 14, 55);
  
  autoTable(doc, {
    startY: 60,
    head: [["Metric", "Amount (LKR)"]],
    body: [
      ["Total Employees", data.totals.employeeCount.toString()],
      ["Total Gross Salary", data.totals.totalGrossSalary.toLocaleString()],
      ["Total Net Salary", data.totals.totalNetSalary.toLocaleString()],
      ["Total EPF (Employee)", data.totals.totalEpfEmployee.toLocaleString()],
      ["Total EPF (Employer)", data.totals.totalEpfEmployer.toLocaleString()],
      ["Total ETF", data.totals.totalEtf.toLocaleString()],
      ["Total PAYE Tax", data.totals.totalPaye.toLocaleString()],
    ],
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] },
  });
  
  // Department Breakdown
  const deptY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.text("Department Breakdown", 14, deptY);
  
  autoTable(doc, {
    startY: deptY + 5,
    head: [["Department", "Employees", "Basic (LKR)", "Gross (LKR)", "Net (LKR)"]],
    body: Object.entries(data.departmentSummary).map(([dept, summary]) => [
      dept,
      summary.count.toString(),
      summary.basicTotal.toLocaleString(),
      summary.grossTotal.toLocaleString(),
      summary.netTotal.toLocaleString(),
    ]),
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] },
  });
  
  doc.save(`payroll-summary-${format(month, "yyyy-MM")}.pdf`);
};

// Export to PDF - EPF/ETF Report
export const exportContributionsPDF = (month: Date = new Date()) => {
  const data = getContributionData(month);
  const doc = new jsPDF({ orientation: "landscape" });
  
  // Header
  doc.setFontSize(20);
  doc.text("EPF / ETF Contribution Report", 14, 22);
  doc.setFontSize(12);
  doc.text(`Period: ${format(month, "MMMM yyyy")}`, 14, 32);
  doc.text(`Generated: ${format(new Date(), "dd MMM yyyy HH:mm")}`, 14, 40);
  
  // Totals
  const totals = data.reduce(
    (acc, row) => ({
      basicSalary: acc.basicSalary + row.basicSalary,
      epfEmployee: acc.epfEmployee + row.epfEmployee,
      epfEmployer: acc.epfEmployer + row.epfEmployer,
      epfTotal: acc.epfTotal + row.epfTotal,
      etfEmployer: acc.etfEmployer + row.etfEmployer,
    }),
    { basicSalary: 0, epfEmployee: 0, epfEmployer: 0, epfTotal: 0, etfEmployer: 0 }
  );
  
  autoTable(doc, {
    startY: 50,
    head: [["Emp #", "Name", "NIC", "EPF #", "Basic (LKR)", "EPF Emp 8%", "EPF Empr 12%", "EPF Total", "ETF 3%"]],
    body: [
      ...data.map(row => [
        row.employeeNumber,
        row.name,
        row.nic,
        row.epfNumber,
        row.basicSalary.toLocaleString(),
        row.epfEmployee.toLocaleString(),
        row.epfEmployer.toLocaleString(),
        row.epfTotal.toLocaleString(),
        row.etfEmployer.toLocaleString(),
      ]),
      ["", "", "", "TOTAL", 
        totals.basicSalary.toLocaleString(),
        totals.epfEmployee.toLocaleString(),
        totals.epfEmployer.toLocaleString(),
        totals.epfTotal.toLocaleString(),
        totals.etfEmployer.toLocaleString(),
      ],
    ],
    theme: "striped",
    headStyles: { fillColor: [34, 197, 94] },
    footStyles: { fontStyle: "bold" },
  });
  
  doc.save(`epf-etf-report-${format(month, "yyyy-MM")}.pdf`);
};

// Export to PDF - Leave Balance Report
export const exportLeaveBalancePDF = () => {
  const data = getLeaveBalanceData();
  const doc = new jsPDF({ orientation: "landscape" });
  
  // Header
  doc.setFontSize(20);
  doc.text("Leave Balance Report", 14, 22);
  doc.setFontSize(12);
  doc.text(`As of: ${format(new Date(), "dd MMM yyyy")}`, 14, 32);
  
  autoTable(doc, {
    startY: 45,
    head: [["Emp #", "Name", "Department", "Annual", "Casual", "Sick", "Maternity"]],
    body: data.map(row => {
      const annual = getBalanceByCode(row.balances, 'AL');
      const casual = getBalanceByCode(row.balances, 'CL');
      const sick = getBalanceByCode(row.balances, 'SL');
      const maternity = getBalanceByCode(row.balances, 'ML');
      const annualType = leaveTypes.find(lt => lt.code === 'AL');
      const casualType = leaveTypes.find(lt => lt.code === 'CL');
      const sickType = leaveTypes.find(lt => lt.code === 'SL');
      const maternityType = leaveTypes.find(lt => lt.code === 'ML');
      
      return [
        row.employeeNumber,
        row.name,
        row.department,
        `${annual?.available || 0} / ${annualType?.daysPerYear || 14}`,
        `${casual?.available || 0} / ${casualType?.daysPerYear || 7}`,
        `${sick?.available || 0} / ${sickType?.daysPerYear || 7}`,
        `${maternity?.available || 0} / ${maternityType?.daysPerYear || 84}`,
      ];
    }),
    theme: "striped",
    headStyles: { fillColor: [139, 92, 246] },
  });
  
  doc.save(`leave-balance-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
};

// Export to Excel - Payroll Summary
export const exportPayrollSummaryExcel = (month: Date = new Date()) => {
  const data = getPayrollSummaryData(month);
  
  // Summary sheet
  const summaryData = [
    ["Payroll Summary Report"],
    [`Period: ${format(month, "MMMM yyyy")}`],
    [""],
    ["Metric", "Amount (LKR)"],
    ["Total Employees", data.totals.employeeCount],
    ["Total Gross Salary", data.totals.totalGrossSalary],
    ["Total Net Salary", data.totals.totalNetSalary],
    ["Total EPF (Employee)", data.totals.totalEpfEmployee],
    ["Total EPF (Employer)", data.totals.totalEpfEmployer],
    ["Total ETF", data.totals.totalEtf],
    ["Total PAYE Tax", data.totals.totalPaye],
  ];
  
  // Employee details sheet
  const employeeData = [
    ["Emp #", "Name", "Department", "Basic", "Gross", "Deductions", "Net"],
    ...data.payslips.map(p => [
      p.employee.employeeNumber,
      `${p.employee.firstName} ${p.employee.lastName}`,
      p.employee.department,
      p.basicSalary,
      p.grossSalary,
      p.deductions.reduce((sum, d) => sum + d.amount, 0),
      p.netSalary,
    ]),
  ];
  
  const wb = XLSX.utils.book_new();
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  const wsEmployees = XLSX.utils.aoa_to_sheet(employeeData);
  
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
  XLSX.utils.book_append_sheet(wb, wsEmployees, "Employee Details");
  
  XLSX.writeFile(wb, `payroll-summary-${format(month, "yyyy-MM")}.xlsx`);
};

// Export to Excel - EPF/ETF Report
export const exportContributionsExcel = (month: Date = new Date()) => {
  const data = getContributionData(month);
  
  const sheetData = [
    ["EPF / ETF Contribution Report"],
    [`Period: ${format(month, "MMMM yyyy")}`],
    [""],
    ["Emp #", "Name", "NIC", "EPF #", "Basic (LKR)", "EPF Emp 8%", "EPF Empr 12%", "EPF Total", "ETF 3%"],
    ...data.map(row => [
      row.employeeNumber,
      row.name,
      row.nic,
      row.epfNumber,
      row.basicSalary,
      row.epfEmployee,
      row.epfEmployer,
      row.epfTotal,
      row.etfEmployer,
    ]),
  ];
  
  // Add totals row
  const totals = data.reduce(
    (acc, row) => ({
      basicSalary: acc.basicSalary + row.basicSalary,
      epfEmployee: acc.epfEmployee + row.epfEmployee,
      epfEmployer: acc.epfEmployer + row.epfEmployer,
      epfTotal: acc.epfTotal + row.epfTotal,
      etfEmployer: acc.etfEmployer + row.etfEmployer,
    }),
    { basicSalary: 0, epfEmployee: 0, epfEmployer: 0, epfTotal: 0, etfEmployer: 0 }
  );
  sheetData.push(["", "", "", "TOTAL", totals.basicSalary, totals.epfEmployee, totals.epfEmployer, totals.epfTotal, totals.etfEmployer]);
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  XLSX.utils.book_append_sheet(wb, ws, "EPF-ETF");
  
  XLSX.writeFile(wb, `epf-etf-report-${format(month, "yyyy-MM")}.xlsx`);
};

// Export to Excel - Leave Balance Report
export const exportLeaveBalanceExcel = () => {
  const data = getLeaveBalanceData();
  
  const sheetData = [
    ["Leave Balance Report"],
    [`As of: ${format(new Date(), "dd MMM yyyy")}`],
    [""],
    ["Emp #", "Name", "Department", "Annual Taken", "Annual Available", "Casual Taken", "Casual Available", "Sick Taken", "Sick Available"],
    ...data.map(row => {
      const annual = getBalanceByCode(row.balances, 'AL');
      const casual = getBalanceByCode(row.balances, 'CL');
      const sick = getBalanceByCode(row.balances, 'SL');
      return [
        row.employeeNumber,
        row.name,
        row.department,
        annual?.taken || 0,
        annual?.available || 0,
        casual?.taken || 0,
        casual?.available || 0,
        sick?.taken || 0,
        sick?.available || 0,
      ];
    }),
  ];
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  XLSX.utils.book_append_sheet(wb, ws, "Leave Balances");
  
  XLSX.writeFile(wb, `leave-balance-report-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
};

// Export helper functions for use in Reports page
export { getBalanceByCode, leaveTypes };
