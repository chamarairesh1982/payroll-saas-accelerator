import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { EPF_EMPLOYEE_RATE, EPF_EMPLOYER_RATE, ETF_EMPLOYER_RATE } from "@/types/payroll";
import { format } from "date-fns";

// Types for report data (passed in from hooks)
export interface PayrollReportPayslip {
  employee: {
    employee_number: string | null;
    first_name: string | null;
    last_name: string | null;
    department: string | null;
  } | null;
  basic_salary: number;
  gross_salary: number;
  net_salary: number;
  epf_employee: number;
  epf_employer: number;
  etf_employer: number;
  paye_tax: number;
}

export interface ContributionReportRow {
  employeeNumber: string;
  name: string;
  nic: string;
  epfNumber: string;
  basicSalary: number;
  epfEmployee: number;
  epfEmployer: number;
  epfTotal: number;
  etfEmployer: number;
}

export interface LeaveBalanceRow {
  employeeNumber: string;
  name: string;
  department: string;
  balances: {
    leaveTypeCode: string;
    available: number;
    taken: number;
  }[];
}

export interface LeaveType {
  code: string;
  name: string;
  days_per_year: number;
}

// Helper to get balance for a specific leave type code
export const getBalanceByCode = (balances: LeaveBalanceRow['balances'], code: string) => {
  return balances.find(b => b.leaveTypeCode === code);
};

// Export to PDF - Payroll Summary
export const exportPayrollSummaryPDF = (
  payslips: PayrollReportPayslip[],
  totals: {
    totalGrossSalary: number;
    totalNetSalary: number;
    totalEpfEmployee: number;
    totalEpfEmployer: number;
    totalEtf: number;
    totalPaye: number;
    employeeCount: number;
  },
  departmentSummary: Record<string, { count: number; basicTotal: number; grossTotal: number; netTotal: number }>,
  month: Date = new Date()
) => {
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
      ["Total Employees", totals.employeeCount.toString()],
      ["Total Gross Salary", totals.totalGrossSalary.toLocaleString()],
      ["Total Net Salary", totals.totalNetSalary.toLocaleString()],
      ["Total EPF (Employee)", totals.totalEpfEmployee.toLocaleString()],
      ["Total EPF (Employer)", totals.totalEpfEmployer.toLocaleString()],
      ["Total ETF", totals.totalEtf.toLocaleString()],
      ["Total PAYE Tax", totals.totalPaye.toLocaleString()],
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
    body: Object.entries(departmentSummary).map(([dept, summary]) => [
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
export const exportContributionsPDF = (
  data: ContributionReportRow[],
  month: Date = new Date()
) => {
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
export const exportLeaveBalancePDF = (
  data: LeaveBalanceRow[],
  leaveTypes: LeaveType[]
) => {
  const doc = new jsPDF({ orientation: "landscape" });
  
  // Header
  doc.setFontSize(20);
  doc.text("Leave Balance Report", 14, 22);
  doc.setFontSize(12);
  doc.text(`As of: ${format(new Date(), "dd MMM yyyy")}`, 14, 32);

  // Build headers dynamically based on leave types
  const headers = ["Emp #", "Name", "Department"];
  leaveTypes.slice(0, 4).forEach(lt => headers.push(lt.name));
  
  autoTable(doc, {
    startY: 45,
    head: [headers],
    body: data.map(row => {
      const rowData = [row.employeeNumber, row.name, row.department];
      leaveTypes.slice(0, 4).forEach(lt => {
        const balance = row.balances.find(b => b.leaveTypeCode === lt.code);
        rowData.push(`${balance?.available || 0} / ${lt.days_per_year}`);
      });
      return rowData;
    }),
    theme: "striped",
    headStyles: { fillColor: [139, 92, 246] },
  });
  
  doc.save(`leave-balance-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
};

// Export to Excel - Payroll Summary
export const exportPayrollSummaryExcel = (
  payslips: PayrollReportPayslip[],
  totals: {
    totalGrossSalary: number;
    totalNetSalary: number;
    totalEpfEmployee: number;
    totalEpfEmployer: number;
    totalEtf: number;
    totalPaye: number;
    employeeCount: number;
  },
  month: Date = new Date()
) => {
  // Summary sheet
  const summaryData = [
    ["Payroll Summary Report"],
    [`Period: ${format(month, "MMMM yyyy")}`],
    [""],
    ["Metric", "Amount (LKR)"],
    ["Total Employees", totals.employeeCount],
    ["Total Gross Salary", totals.totalGrossSalary],
    ["Total Net Salary", totals.totalNetSalary],
    ["Total EPF (Employee)", totals.totalEpfEmployee],
    ["Total EPF (Employer)", totals.totalEpfEmployer],
    ["Total ETF", totals.totalEtf],
    ["Total PAYE Tax", totals.totalPaye],
  ];
  
  // Employee details sheet
  const employeeData = [
    ["Emp #", "Name", "Department", "Basic", "Gross", "Net"],
    ...payslips.map(p => [
      p.employee?.employee_number || "",
      `${p.employee?.first_name || ""} ${p.employee?.last_name || ""}`.trim(),
      p.employee?.department || "",
      p.basic_salary,
      p.gross_salary,
      p.net_salary,
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
export const exportContributionsExcel = (
  data: ContributionReportRow[],
  month: Date = new Date()
) => {
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
export const exportLeaveBalanceExcel = (
  data: LeaveBalanceRow[],
  leaveTypes: LeaveType[]
) => {
  const headers = ["Emp #", "Name", "Department"];
  leaveTypes.forEach(lt => {
    headers.push(`${lt.name} Taken`);
    headers.push(`${lt.name} Available`);
  });

  const sheetData: any[][] = [
    ["Leave Balance Report"],
    [`As of: ${format(new Date(), "dd MMM yyyy")}`],
    [""],
    headers,
    ...data.map(row => {
      const rowData: any[] = [row.employeeNumber, row.name, row.department];
      leaveTypes.forEach(lt => {
        const balance = row.balances.find(b => b.leaveTypeCode === lt.code);
        rowData.push(balance?.taken || 0);
        rowData.push(balance?.available || 0);
      });
      return rowData;
    }),
  ];
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  XLSX.utils.book_append_sheet(wb, ws, "Leave Balances");
  
  XLSX.writeFile(wb, `leave-balance-report-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
};
