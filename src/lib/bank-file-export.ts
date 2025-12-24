import * as XLSX from "xlsx";
import { format } from "date-fns";

export type BankFileFormat = "csv" | "fixed_width" | "excel";

export interface BankFileColumn {
  id: string;
  label: string;
  field: string;
  width?: number; // For fixed-width format
  align?: "left" | "right";
  transform?: (value: any) => string;
}

export interface BankFileTemplate {
  id: string;
  name: string;
  description: string;
  format: BankFileFormat;
  delimiter?: string; // For CSV
  columns: BankFileColumn[];
  includeHeader: boolean;
  fileExtension: string;
}

export interface PayrollRecord {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  bankName: string;
  bankBranch: string;
  accountNumber: string;
  netSalary: number;
  epfNumber: string;
  nic: string;
}

// Predefined bank file templates
export const bankFileTemplates: BankFileTemplate[] = [
  {
    id: "standard_csv",
    name: "Standard CSV",
    description: "Generic CSV format with all fields",
    format: "csv",
    delimiter: ",",
    includeHeader: true,
    fileExtension: "csv",
    columns: [
      { id: "emp_no", label: "Employee No", field: "employeeNumber" },
      { id: "name", label: "Employee Name", field: "fullName" },
      { id: "bank", label: "Bank Name", field: "bankName" },
      { id: "branch", label: "Branch", field: "bankBranch" },
      { id: "account", label: "Account Number", field: "accountNumber" },
      { id: "amount", label: "Amount", field: "netSalary" },
    ],
  },
  {
    id: "bank_transfer_simple",
    name: "Bank Transfer (Simple)",
    description: "Minimal format for bank bulk transfers",
    format: "csv",
    delimiter: ",",
    includeHeader: false,
    fileExtension: "csv",
    columns: [
      { id: "account", label: "Account Number", field: "accountNumber" },
      { id: "amount", label: "Amount", field: "netSalary" },
      { id: "name", label: "Beneficiary Name", field: "fullName" },
    ],
  },
  {
    id: "fixed_width_slips",
    name: "Fixed Width (SLIPS Format)",
    description: "Fixed-width format for legacy bank systems",
    format: "fixed_width",
    includeHeader: false,
    fileExtension: "txt",
    columns: [
      { id: "account", label: "Account", field: "accountNumber", width: 20, align: "left" },
      { id: "amount", label: "Amount", field: "netSalary", width: 15, align: "right" },
      { id: "name", label: "Name", field: "fullName", width: 30, align: "left" },
      { id: "ref", label: "Reference", field: "employeeNumber", width: 10, align: "left" },
    ],
  },
  {
    id: "detailed_excel",
    name: "Detailed Excel",
    description: "Complete salary transfer with all details",
    format: "excel",
    includeHeader: true,
    fileExtension: "xlsx",
    columns: [
      { id: "emp_no", label: "Employee No", field: "employeeNumber" },
      { id: "epf", label: "EPF Number", field: "epfNumber" },
      { id: "nic", label: "NIC", field: "nic" },
      { id: "name", label: "Employee Name", field: "fullName" },
      { id: "bank", label: "Bank Name", field: "bankName" },
      { id: "branch", label: "Branch Code", field: "bankBranch" },
      { id: "account", label: "Account Number", field: "accountNumber" },
      { id: "amount", label: "Net Salary (LKR)", field: "netSalary" },
    ],
  },
  {
    id: "peoples_bank",
    name: "People's Bank Format",
    description: "Format compatible with People's Bank bulk transfers",
    format: "csv",
    delimiter: "|",
    includeHeader: false,
    fileExtension: "txt",
    columns: [
      { id: "account", label: "Account", field: "accountNumber" },
      { id: "amount", label: "Amount", field: "netSalaryFormatted" },
      { id: "name", label: "Name", field: "fullName" },
      { id: "nic", label: "NIC", field: "nic" },
    ],
  },
  {
    id: "commercial_bank",
    name: "Commercial Bank Format",
    description: "Format compatible with Commercial Bank bulk transfers",
    format: "csv",
    delimiter: ",",
    includeHeader: true,
    fileExtension: "csv",
    columns: [
      { id: "seq", label: "Sequence", field: "sequence" },
      { id: "account", label: "Account Number", field: "accountNumber" },
      { id: "name", label: "Beneficiary Name", field: "fullName" },
      { id: "amount", label: "Amount", field: "netSalary" },
      { id: "ref", label: "Reference", field: "paymentRef" },
    ],
  },
];

// Transform payroll data for export
const transformData = (records: PayrollRecord[], template: BankFileTemplate, paymentRef: string): Record<string, any>[] => {
  return records.map((record, index) => {
    const fullName = `${record.firstName} ${record.lastName}`;
    const transformed: Record<string, any> = {
      ...record,
      fullName,
      netSalaryFormatted: record.netSalary.toFixed(2),
      sequence: (index + 1).toString().padStart(5, "0"),
      paymentRef: paymentRef,
    };
    return transformed;
  });
};

// Generate CSV content
const generateCSV = (data: Record<string, any>[], template: BankFileTemplate): string => {
  const delimiter = template.delimiter || ",";
  const lines: string[] = [];

  if (template.includeHeader) {
    lines.push(template.columns.map((col) => col.label).join(delimiter));
  }

  data.forEach((row) => {
    const values = template.columns.map((col) => {
      const value = row[col.field] ?? "";
      // Quote values containing delimiter or quotes
      const stringValue = String(value);
      if (stringValue.includes(delimiter) || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    lines.push(values.join(delimiter));
  });

  return lines.join("\n");
};

// Generate fixed-width content
const generateFixedWidth = (data: Record<string, any>[], template: BankFileTemplate): string => {
  const lines: string[] = [];

  data.forEach((row) => {
    let line = "";
    template.columns.forEach((col) => {
      const value = String(row[col.field] ?? "");
      const width = col.width || 20;
      if (col.align === "right") {
        line += value.padStart(width, " ");
      } else {
        line += value.padEnd(width, " ");
      }
    });
    lines.push(line);
  });

  return lines.join("\n");
};

// Generate Excel file
const generateExcel = (data: Record<string, any>[], template: BankFileTemplate): Blob => {
  const headers = template.columns.map((col) => col.label);
  const rows = data.map((row) => template.columns.map((col) => row[col.field] ?? ""));

  const sheetData = template.includeHeader ? [headers, ...rows] : rows;

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Set column widths
  ws["!cols"] = template.columns.map((col) => ({ wch: col.width || 15 }));

  XLSX.utils.book_append_sheet(wb, ws, "Bank Transfer");

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
};

// Main export function
export const exportBankFile = (
  records: PayrollRecord[],
  template: BankFileTemplate,
  month: Date,
  paymentRef?: string
): void => {
  const reference = paymentRef || `SAL-${format(month, "yyyyMM")}`;
  const transformedData = transformData(records, template, reference);
  const filename = `bank-transfer-${format(month, "yyyy-MM")}-${template.id}`;

  let content: string | Blob;
  let mimeType: string;

  switch (template.format) {
    case "csv":
      content = generateCSV(transformedData, template);
      mimeType = "text/csv";
      break;
    case "fixed_width":
      content = generateFixedWidth(transformedData, template);
      mimeType = "text/plain";
      break;
    case "excel":
      content = generateExcel(transformedData, template);
      mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      break;
    default:
      content = generateCSV(transformedData, template);
      mimeType = "text/csv";
  }

  // Create download link
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.${template.fileExtension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Preview first few rows
export const previewBankFile = (
  records: PayrollRecord[],
  template: BankFileTemplate,
  maxRows: number = 5
): string => {
  const previewRecords = records.slice(0, maxRows);
  const transformedData = transformData(previewRecords, template, "PREVIEW");

  switch (template.format) {
    case "csv":
      return generateCSV(transformedData, template);
    case "fixed_width":
      return generateFixedWidth(transformedData, template);
    case "excel":
      return generateCSV(transformedData, { ...template, format: "csv", delimiter: "\t" }); // Show as TSV for preview
    default:
      return generateCSV(transformedData, template);
  }
};
