import { format } from "date-fns";

export interface EmployeeExportData {
  id: string;
  employee_number: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  nic: string | null;
  department: string | null;
  designation: string | null;
  employment_type: string | null;
  status: string | null;
  basic_salary: number | null;
  bank_name: string | null;
  bank_branch: string | null;
  bank_account_number: string | null;
  epf_number: string | null;
  date_of_birth: string | null;
  date_of_joining: string | null;
}

export function exportEmployeesCSV(employees: EmployeeExportData[], filename?: string): void {
  const headers = [
    "Employee No",
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "NIC",
    "Department",
    "Designation",
    "Employment Type",
    "Status",
    "Basic Salary",
    "Bank Name",
    "Bank Branch",
    "Account Number",
    "EPF Number",
    "Date of Birth",
    "Date of Joining",
  ];

  const rows = employees.map((emp) => [
    emp.employee_number || "",
    emp.first_name || "",
    emp.last_name || "",
    emp.email || "",
    emp.phone || "",
    emp.nic || "",
    emp.department || "",
    emp.designation || "",
    emp.employment_type || "",
    emp.status || "",
    emp.basic_salary?.toString() || "0",
    emp.bank_name || "",
    emp.bank_branch || "",
    emp.bank_account_number || "",
    emp.epf_number || "",
    emp.date_of_birth || "",
    emp.date_of_joining || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((cell) => {
          // Escape cells that contain commas, quotes, or newlines
          if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `employees-${format(new Date(), "yyyy-MM-dd")}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
