import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  CreditCard,
  FileText,
  DollarSign,
  TrendingUp,
  Clock,
  Download,
  Briefcase,
  User,
  Hash,
  Loader2,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEmployee } from "@/hooks/useEmployees";
import { cn } from "@/lib/utils";
import { EPF_EMPLOYEE_RATE, EPF_EMPLOYER_RATE, ETF_EMPLOYER_RATE } from "@/types/payroll";
import { format } from "date-fns";

const statusStyles: Record<string, string> = {
  active: "bg-success/15 text-success border-success/30",
  inactive: "bg-muted text-muted-foreground border-muted",
  terminated: "bg-destructive/15 text-destructive border-destructive/30",
};

const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: employee, isLoading } = useEmployee(id);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!employee) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <User className="h-16 w-16 text-muted-foreground/50" />
          <h2 className="mt-4 text-xl font-semibold">Employee Not Found</h2>
          <p className="text-muted-foreground">
            The employee you're looking for doesn't exist.
          </p>
          <Button className="mt-4" onClick={() => navigate("/employees")}>
            Back to Employees
          </Button>
        </div>
      </MainLayout>
    );
  }

  const basicSalary = employee.basic_salary || 0;
  const epfEmployee = basicSalary * EPF_EMPLOYEE_RATE;
  const epfEmployer = basicSalary * EPF_EMPLOYER_RATE;
  const etfEmployer = basicSalary * ETF_EMPLOYER_RATE;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    try {
      return format(new Date(dateStr), "MMMM d, yyyy");
    } catch {
      return "N/A";
    }
  };

  const InfoItem = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: React.ElementType;
    label: string;
    value: string;
  }) => (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/employees")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Employees
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-6 rounded-xl bg-card p-6 shadow-md sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-2xl font-bold text-primary-foreground shadow-lg">
              {(employee.first_name || "?")[0]}
              {(employee.last_name || "?")[0]}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">
                  {employee.first_name} {employee.last_name}
                </h1>
                <Badge
                  variant="outline"
                  className={cn("capitalize", statusStyles[employee.status || "active"])}
                >
                  {employee.status || "active"}
                </Badge>
              </div>
              <p className="text-muted-foreground">{employee.designation || "N/A"}</p>
              <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  {employee.employee_number || "N/A"}
                </span>
                <span className="flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  {employee.department || "N/A"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Mail className="h-4 w-4" />
              Send Email
            </Button>
            <Link to={`/employees/${employee.id}/edit`}>
              <Button>
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="salary">Salary & Benefits</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Personal Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl bg-card p-6 shadow-sm lg:col-span-2"
            >
              <h3 className="mb-4 font-display text-lg font-semibold">
                Personal Information
              </h3>
              <div className="grid gap-6 sm:grid-cols-2">
                <InfoItem icon={Mail} label="Email Address" value={employee.email || "N/A"} />
                <InfoItem icon={Phone} label="Phone Number" value={employee.phone || "N/A"} />
                <InfoItem icon={User} label="NIC Number" value={employee.nic || "N/A"} />
                <InfoItem
                  icon={Calendar}
                  label="Date of Birth"
                  value={formatDate(employee.date_of_birth)}
                />
              </div>
            </motion.div>

            {/* Employment Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-xl bg-card p-6 shadow-sm"
            >
              <h3 className="mb-4 font-display text-lg font-semibold">
                Employment Details
              </h3>
              <div className="space-y-4">
                <InfoItem
                  icon={Briefcase}
                  label="Employment Type"
                  value={
                    employee.employment_type
                      ? employee.employment_type.charAt(0).toUpperCase() +
                        employee.employment_type.slice(1)
                      : "N/A"
                  }
                />
                <InfoItem
                  icon={Calendar}
                  label="Date of Joining"
                  value={formatDate(employee.date_of_joining)}
                />
                <InfoItem icon={Hash} label="EPF Number" value={employee.epf_number || "N/A"} />
              </div>
            </motion.div>
          </div>

          {/* Bank Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl bg-card p-6 shadow-sm"
          >
            <h3 className="mb-4 font-display text-lg font-semibold">
              Bank Account Details
            </h3>
            <div className="grid gap-6 sm:grid-cols-3">
              <InfoItem icon={Building} label="Bank Name" value={employee.bank_name || "N/A"} />
              <InfoItem icon={MapPin} label="Branch" value={employee.bank_branch || "N/A"} />
              <InfoItem
                icon={CreditCard}
                label="Account Number"
                value={employee.bank_account_number || "N/A"}
              />
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="salary" className="space-y-6">
          {/* Salary Summary */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="stat-card"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Basic Salary</p>
                  <p className="text-2xl font-bold">
                    Rs. {basicSalary.toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="stat-card before:!bg-gradient-to-r before:!from-accent before:!to-success"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    EPF (Employee 8%)
                  </p>
                  <p className="text-2xl font-bold">
                    Rs. {epfEmployee.toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="stat-card before:!bg-gradient-to-r before:!from-success before:!to-accent"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                  <Building className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    EPF (Employer 12%)
                  </p>
                  <p className="text-2xl font-bold">
                    Rs. {epfEmployer.toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="stat-card before:!bg-gradient-to-r before:!from-warning before:!to-warning/70"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                  <FileText className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ETF (3%)</p>
                  <p className="text-2xl font-bold">
                    Rs. {etfEmployer.toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Salary Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl bg-card p-6 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">
                Salary Breakdown (December 2024)
              </h3>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
                Download Payslip
              </Button>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Earnings */}
              <div>
                <h4 className="mb-3 font-medium text-success">Earnings</h4>
                <div className="space-y-3">
                  <div className="flex justify-between rounded-lg bg-muted/50 p-3">
                    <span>Basic Salary</span>
                    <span className="font-medium">
                      Rs. {basicSalary.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-muted/50 p-3">
                    <span>Transport Allowance</span>
                    <span className="font-medium">Rs. 5,000</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-muted/50 p-3">
                    <span>Medical Allowance</span>
                    <span className="font-medium">Rs. 3,000</span>
                  </div>
                  <div className="flex justify-between border-t pt-3 font-semibold">
                    <span>Total Earnings</span>
                    <span className="text-success">
                      Rs. {(basicSalary + 8000).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h4 className="mb-3 font-medium text-destructive">Deductions</h4>
                <div className="space-y-3">
                  <div className="flex justify-between rounded-lg bg-muted/50 p-3">
                    <span>EPF (Employee - 8%)</span>
                    <span className="font-medium">
                      Rs. {epfEmployee.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-muted/50 p-3">
                    <span>PAYE Tax</span>
                    <span className="font-medium">Rs. 2,500</span>
                  </div>
                  <div className="flex justify-between border-t pt-3 font-semibold">
                    <span>Total Deductions</span>
                    <span className="text-destructive">
                      Rs. {(epfEmployee + 2500).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Salary */}
            <div className="mt-6 flex items-center justify-between rounded-xl bg-primary/5 p-4">
              <span className="text-lg font-semibold">Net Salary</span>
              <span className="text-2xl font-bold text-primary">
                Rs.{" "}
                {(basicSalary + 8000 - epfEmployee - 2500).toLocaleString()}
              </span>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="documents">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-xl bg-card py-20 shadow-sm"
          >
            <FileText className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No Documents</h3>
            <p className="text-muted-foreground">
              Employee documents will appear here once uploaded.
            </p>
            <Button className="mt-4">Upload Document</Button>
          </motion.div>
        </TabsContent>

        <TabsContent value="history">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-xl bg-card py-20 shadow-sm"
          >
            <Clock className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">Employment History</h3>
            <p className="text-muted-foreground">
              Salary changes, promotions, and other history will appear here.
            </p>
          </motion.div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default EmployeeProfile;
