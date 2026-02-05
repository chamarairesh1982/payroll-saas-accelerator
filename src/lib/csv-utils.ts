// CSV Template columns for employee import
export const EMPLOYEE_CSV_COLUMNS = [
  { key: "first_name", label: "First Name", required: true },
  { key: "last_name", label: "Last Name", required: true },
  { key: "email", label: "Email", required: true },
  { key: "phone", label: "Phone", required: false },
  { key: "nic", label: "NIC", required: false },
  { key: "department", label: "Department", required: false },
  { key: "designation", label: "Designation", required: false },
  { key: "employment_type", label: "Employment Type", required: false },
  { key: "basic_salary", label: "Basic Salary", required: false },
  { key: "date_of_birth", label: "Date of Birth (YYYY-MM-DD)", required: false },
  { key: "date_of_joining", label: "Date of Joining (YYYY-MM-DD)", required: false },
  { key: "epf_number", label: "EPF Number", required: false },
  { key: "bank_name", label: "Bank Name", required: false },
  { key: "bank_branch", label: "Bank Branch", required: false },
  { key: "bank_account_number", label: "Bank Account Number", required: false },
];

export interface CSVEmployee {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  nic?: string;
  department?: string;
  designation?: string;
  employment_type?: string;
  basic_salary?: number;
  date_of_birth?: string;
  date_of_joining?: string;
  epf_number?: string;
  bank_name?: string;
  bank_branch?: string;
  bank_account_number?: string;
}

export interface ValidationError {
  row: number;
  column: string;
  message: string;
}

export interface ParseResult {
  data: CSVEmployee[];
  errors: ValidationError[];
  warnings: ValidationError[];
}

// Generate CSV template content
export const generateCSVTemplate = (): string => {
  const headers = EMPLOYEE_CSV_COLUMNS.map((col) => col.label).join(",");
  const exampleRow = [
    "John",
    "Doe",
    "john.doe@example.com",
    "+94771234567",
    "123456789V",
    "Engineering",
    "Software Engineer",
    "permanent",
    "75000",
    "1990-05-15",
    "2024-01-01",
    "EPF001",
    "BOC",
    "Colombo",
    "1234567890",
  ].join(",");

  return `${headers}\n${exampleRow}`;
};

// Download template as file
export const downloadCSVTemplate = () => {
  const content = generateCSVTemplate();
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "employee_import_template.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Parse CSV content
export const parseCSV = (content: string): string[][] => {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  return lines.map((line) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  });
};

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Validate and parse CSV file
export const validateAndParseCSV = (content: string): ParseResult => {
  const rows = parseCSV(content);
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const data: CSVEmployee[] = [];

  if (rows.length < 2) {
    errors.push({ row: 0, column: "", message: "CSV file must have a header row and at least one data row" });
    return { data, errors, warnings };
  }

  const headerRow = rows[0];
  const expectedHeaders = EMPLOYEE_CSV_COLUMNS.map((col) => col.label.toLowerCase());
  
  // Map headers to column indices
  const headerMap: Record<string, number> = {};
  headerRow.forEach((header, index) => {
    const normalizedHeader = header.toLowerCase().trim();
    const matchIndex = expectedHeaders.findIndex(
      (expected) => normalizedHeader === expected || normalizedHeader.includes(expected.split(" ")[0].toLowerCase())
    );
    if (matchIndex >= 0) {
      headerMap[EMPLOYEE_CSV_COLUMNS[matchIndex].key] = index;
    }
  });

  // Check for required columns
  const requiredColumns = EMPLOYEE_CSV_COLUMNS.filter((col) => col.required);
  for (const col of requiredColumns) {
    if (headerMap[col.key] === undefined) {
      errors.push({ row: 1, column: col.label, message: `Required column "${col.label}" not found in CSV` });
    }
  }

  if (errors.length > 0) {
    return { data, errors, warnings };
  }

  // Process data rows
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;

    // Skip empty rows
    if (row.every((cell) => !cell.trim())) {
      continue;
    }

    const getValue = (key: string): string => {
      const index = headerMap[key];
      return index !== undefined ? (row[index] || "").trim() : "";
    };

    // Validate required fields
    const firstName = getValue("first_name");
    const lastName = getValue("last_name");
    const email = getValue("email");

    if (!firstName) {
      errors.push({ row: rowNum, column: "First Name", message: "First name is required" });
    }
    if (!lastName) {
      errors.push({ row: rowNum, column: "Last Name", message: "Last name is required" });
    }
    if (!email) {
      errors.push({ row: rowNum, column: "Email", message: "Email is required" });
    } else if (!EMAIL_REGEX.test(email)) {
      errors.push({ row: rowNum, column: "Email", message: "Invalid email format" });
    }

    // Validate optional fields
    const dateOfBirth = getValue("date_of_birth");
    if (dateOfBirth && !DATE_REGEX.test(dateOfBirth)) {
      warnings.push({ row: rowNum, column: "Date of Birth", message: "Date should be in YYYY-MM-DD format" });
    }

    const dateOfJoining = getValue("date_of_joining");
    if (dateOfJoining && !DATE_REGEX.test(dateOfJoining)) {
      warnings.push({ row: rowNum, column: "Date of Joining", message: "Date should be in YYYY-MM-DD format" });
    }

    const basicSalary = getValue("basic_salary");
    let parsedSalary: number | undefined;
    if (basicSalary) {
      parsedSalary = parseFloat(basicSalary.replace(/,/g, ""));
      if (isNaN(parsedSalary) || parsedSalary < 0) {
        warnings.push({ row: rowNum, column: "Basic Salary", message: "Invalid salary value" });
        parsedSalary = undefined;
      }
    }

    const employmentType = getValue("employment_type").toLowerCase();
    const validTypes = ["permanent", "contract", "probation", "intern"];
    if (employmentType && !validTypes.includes(employmentType)) {
      warnings.push({ row: rowNum, column: "Employment Type", message: `Invalid type. Use: ${validTypes.join(", ")}` });
    }

    // Build employee object
    const employee: CSVEmployee = {
      first_name: firstName,
      last_name: lastName,
      email: email.toLowerCase(),
      phone: getValue("phone") || undefined,
      nic: getValue("nic") || undefined,
      department: getValue("department") || undefined,
      designation: getValue("designation") || undefined,
      employment_type: validTypes.includes(employmentType) ? employmentType : "permanent",
      basic_salary: parsedSalary,
      date_of_birth: dateOfBirth && DATE_REGEX.test(dateOfBirth) ? dateOfBirth : undefined,
      date_of_joining: dateOfJoining && DATE_REGEX.test(dateOfJoining) ? dateOfJoining : undefined,
      epf_number: getValue("epf_number") || undefined,
      bank_name: getValue("bank_name") || undefined,
      bank_branch: getValue("bank_branch") || undefined,
      bank_account_number: getValue("bank_account_number") || undefined,
    };

    data.push(employee);
  }

  return { data, errors, warnings };
};
