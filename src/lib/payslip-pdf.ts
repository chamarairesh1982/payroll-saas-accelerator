import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatLKR } from "./payroll-calculations";

interface PayslipData {
  employee: {
    first_name: string | null;
    last_name: string | null;
    employee_number: string | null;
    department: string | null;
    designation: string | null;
    epf_number: string | null;
    bank_name: string | null;
    bank_account_number: string | null;
  } | null;
  basic_salary: number;
  gross_salary: number;
  net_salary: number;
  epf_employee: number;
  epf_employer: number;
  etf_employer: number;
  paye_tax: number;
  ot_hours: number;
  ot_amount: number;
  worked_days: number;
  working_days: number;
  allowances: any[];
  deductions: any[];
}

interface PayrollRunData {
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
}

export function generatePayslipPDF(
  payslip: PayslipData,
  payrollRun: PayrollRunData,
  companyName: string = "PayrollPro Company"
): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  const employee = payslip.employee;
  const employeeName = employee
    ? `${employee.first_name || ""} ${employee.last_name || ""}`.trim()
    : "Unknown";

  // Header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 35, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(companyName, 14, 18);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("PAYSLIP", 14, 28);
  
  // Pay period
  const payPeriod = `${new Date(payrollRun.pay_period_start).toLocaleDateString("en-LK", {
    month: "long",
    year: "numeric",
  })}`;
  doc.text(payPeriod, pageWidth - 14, 18, { align: "right" });
  doc.text(`Pay Date: ${new Date(payrollRun.pay_date).toLocaleDateString("en-LK")}`, pageWidth - 14, 28, { align: "right" });

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Employee Details Section
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Employee Details", 14, 48);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  
  const employeeDetails = [
    ["Name:", employeeName],
    ["Employee No:", employee?.employee_number || "-"],
    ["Department:", employee?.department || "-"],
    ["Designation:", employee?.designation || "-"],
    ["EPF No:", employee?.epf_number || "-"],
    ["Bank:", employee?.bank_name || "-"],
    ["Account:", employee?.bank_account_number || "-"],
  ];

  let yPos = 55;
  employeeDetails.forEach(([label, value]) => {
    doc.setFont("helvetica", "normal");
    doc.text(label, 14, yPos);
    doc.setFont("helvetica", "bold");
    doc.text(value, 50, yPos);
    yPos += 6;
  });

  // Attendance Info
  doc.setFont("helvetica", "bold");
  doc.text("Attendance", pageWidth / 2 + 10, 55);
  doc.setFont("helvetica", "normal");
  doc.text(`Working Days: ${payslip.working_days}`, pageWidth / 2 + 10, 62);
  doc.text(`Worked Days: ${payslip.worked_days}`, pageWidth / 2 + 10, 68);
  doc.text(`OT Hours: ${payslip.ot_hours}`, pageWidth / 2 + 10, 74);

  // Earnings Table
  const earningsData: any[][] = [
    ["Basic Salary", formatLKR(payslip.basic_salary)],
  ];
  
  if (payslip.ot_amount > 0) {
    earningsData.push([`Overtime (${payslip.ot_hours} hrs)`, formatLKR(payslip.ot_amount)]);
  }
  
  if (Array.isArray(payslip.allowances)) {
    payslip.allowances.forEach((allowance: any) => {
      earningsData.push([allowance.name, formatLKR(allowance.amount)]);
    });
  }

  autoTable(doc, {
    startY: 100,
    head: [["Earnings", "Amount"]],
    body: earningsData,
    foot: [["Gross Salary", formatLKR(payslip.gross_salary)]],
    theme: "grid",
    headStyles: { fillColor: [34, 197, 94], textColor: 255 },
    footStyles: { fillColor: [240, 253, 244], textColor: [0, 0, 0], fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 60, halign: "right" },
    },
    margin: { left: 14 },
    tableWidth: (pageWidth - 28) / 2 - 5,
  });

  // Deductions Table
  const deductionsData: any[][] = [
    ["EPF (Employee 8%)", formatLKR(payslip.epf_employee)],
  ];
  
  if (payslip.paye_tax > 0) {
    deductionsData.push(["PAYE Tax", formatLKR(payslip.paye_tax)]);
  }
  
  if (Array.isArray(payslip.deductions)) {
    payslip.deductions.forEach((deduction: any) => {
      if (deduction.name !== "EPF (Employee 8%)" && deduction.name !== "PAYE Tax") {
        deductionsData.push([deduction.name, formatLKR(deduction.amount)]);
      }
    });
  }

  const totalDeductions = payslip.epf_employee + payslip.paye_tax + 
    (Array.isArray(payslip.deductions) 
      ? payslip.deductions
          .filter((d: any) => d.name !== "EPF (Employee 8%)" && d.name !== "PAYE Tax")
          .reduce((sum: number, d: any) => sum + d.amount, 0)
      : 0);

  autoTable(doc, {
    startY: 100,
    head: [["Deductions", "Amount"]],
    body: deductionsData,
    foot: [["Total Deductions", formatLKR(totalDeductions)]],
    theme: "grid",
    headStyles: { fillColor: [239, 68, 68], textColor: 255 },
    footStyles: { fillColor: [254, 242, 242], textColor: [0, 0, 0], fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 60, halign: "right" },
    },
    margin: { left: pageWidth / 2 + 5 },
    tableWidth: (pageWidth - 28) / 2 - 5,
  });

  // Net Salary Box
  const netSalaryY = 180;
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(14, netSalaryY, pageWidth - 28, 25, 3, 3, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("NET SALARY", 20, netSalaryY + 16);
  
  doc.setFontSize(16);
  doc.text(formatLKR(payslip.net_salary), pageWidth - 20, netSalaryY + 16, { align: "right" });

  // Employer Contributions
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Employer Contributions (Not deducted from salary)", 14, netSalaryY + 40);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`EPF Employer (12%): ${formatLKR(payslip.epf_employer)}`, 14, netSalaryY + 48);
  doc.text(`ETF (3%): ${formatLKR(payslip.etf_employer)}`, 14, netSalaryY + 55);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(
    "This is a computer-generated payslip and does not require a signature.",
    pageWidth / 2,
    280,
    { align: "center" }
  );
  doc.text(
    `Generated on ${new Date().toLocaleDateString("en-LK")} at ${new Date().toLocaleTimeString("en-LK")}`,
    pageWidth / 2,
    286,
    { align: "center" }
  );

  return doc;
}

export function downloadPayslipPDF(
  payslip: PayslipData,
  payrollRun: PayrollRunData,
  companyName?: string
): void {
  const doc = generatePayslipPDF(payslip, payrollRun, companyName);
  const employee = payslip.employee;
  const employeeName = employee
    ? `${employee.first_name || ""}_${employee.last_name || ""}`.trim().replace(/\s+/g, "_")
    : "employee";
  const month = new Date(payrollRun.pay_period_start).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  }).replace(" ", "_");
  
  doc.save(`Payslip_${employeeName}_${month}.pdf`);
}

export function downloadAllPayslipsPDF(
  payslips: PayslipData[],
  payrollRun: PayrollRunData,
  companyName?: string
): void {
  const doc = new jsPDF();
  
  payslips.forEach((payslip, index) => {
    if (index > 0) {
      doc.addPage();
    }
    
    const singleDoc = generatePayslipPDF(payslip, payrollRun, companyName);
    // Copy content from single doc to main doc
    // For simplicity, we'll generate separate files
  });

  // For bulk download, create individual files
  payslips.forEach((payslip) => {
    downloadPayslipPDF(payslip, payrollRun, companyName);
  });
}
