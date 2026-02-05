import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Mail,
  Building,
  Users,
  Loader2,
  Send,
  Upload,
  FileSpreadsheet,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEmployees, departments } from "@/hooks/useEmployees";
import { useAuth } from "@/contexts/AuthContext";
import { InviteEmployeeModal } from "@/components/employees/InviteEmployeeModal";
import { CSVImportModal } from "@/components/employees/CSVImportModal";
import { cn } from "@/lib/utils";
import { exportEmployeesCSV } from "@/lib/employee-csv-export";
import { toast } from "sonner";

const statusStyles: Record<string, string> = {
  active: "bg-success/15 text-success border-success/30",
  inactive: "bg-muted text-muted-foreground border-muted",
  terminated: "bg-destructive/15 text-destructive border-destructive/30",
};

const employmentTypeLabels: Record<string, string> = {
  permanent: "Permanent",
  contract: "Contract",
  probation: "Probation",
  intern: "Intern",
};

const Employees = () => {
  const { employees, isLoading, deleteEmployee, isDeleting } = useEmployees();
  const { isAdmin, isHR } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const canManage = isAdmin || isHR;

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const fullName = `${employee.first_name || ""} ${employee.last_name || ""}`.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        fullName.includes(searchQuery.toLowerCase()) ||
        (employee.employee_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (employee.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (employee.epf_number || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDepartment =
        departmentFilter === "all" || employee.department === departmentFilter;

      const matchesStatus =
        statusFilter === "all" || employee.status === statusFilter;

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [employees, searchQuery, departmentFilter, statusFilter]);

  const stats = useMemo(
    () => ({
      total: employees.length,
      active: employees.filter((e) => e.status === "active").length,
      departments: new Set(employees.map((e) => e.department).filter(Boolean)).size,
    }),
    [employees]
  );

  const handleDelete = () => {
    if (deleteId) {
      deleteEmployee(deleteId);
      setDeleteId(null);
    }
  };

  const handleExportCSV = useCallback(() => {
    if (filteredEmployees.length === 0) {
      toast.error("No employees to export");
      return;
    }
    exportEmployeesCSV(filteredEmployees);
    toast.success(`Exported ${filteredEmployees.length} employees to CSV`);
  }, [filteredEmployees]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-description">
            Manage your organization's workforce and employee records.
          </p>
        </div>
        <div className="flex gap-2">
          {canManage && (
            <>
              <Button variant="outline" onClick={() => setShowImportModal(true)}>
                <Upload className="h-4 w-4" />
                Import CSV
              </Button>
              <Button variant="outline" onClick={() => setShowInviteModal(true)}>
                <Send className="h-4 w-4" />
                Invite
              </Button>
            </>
          )}
          <Link to="/employees/new">
            <Button size="lg">
              <Plus className="h-5 w-5" />
              Add Employee
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Employees</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
            <Users className="h-6 w-6 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.active}</p>
            <p className="text-sm text-muted-foreground">Active Employees</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
            <Building className="h-6 w-6 text-accent" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.departments}</p>
            <p className="text-sm text-muted-foreground">Departments</p>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex flex-1 flex-col gap-4 sm:flex-row">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, EPF number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={handleExportCSV}>
          <FileSpreadsheet className="h-4 w-4" />
          Export CSV
        </Button>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold">Employee</TableHead>
              <TableHead className="font-semibold">EPF Number</TableHead>
              <TableHead className="font-semibold">Department</TableHead>
              <TableHead className="font-semibold">Designation</TableHead>
              <TableHead className="font-semibold">Type</TableHead>
              <TableHead className="font-semibold">Basic Salary</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map((employee, index) => (
              <motion.tr
                key={employee.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
                className="group hover:bg-muted/30"
              >
                <TableCell>
                  <Link
                    to={`/employees/${employee.id}`}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {(employee.first_name || "?")[0]}
                      {(employee.last_name || "?")[0]}
                    </div>
                    <div>
                      <p className="font-medium text-foreground transition-colors group-hover:text-primary">
                        {employee.first_name} {employee.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {employee.employee_number || "N/A"}
                      </p>
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {employee.epf_number || "N/A"}
                </TableCell>
                <TableCell>{employee.department || "N/A"}</TableCell>
                <TableCell className="text-sm">{employee.designation || "N/A"}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-normal">
                    {employmentTypeLabels[employee.employment_type || "permanent"] || employee.employment_type}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">
                  Rs. {(employee.basic_salary || 0).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn("capitalize", statusStyles[employee.status || "active"])}
                  >
                    {employee.status || "active"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/employees/${employee.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/employees/${employee.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Email
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteId(employee.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
        {filteredEmployees.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 font-medium text-muted-foreground">
              No employees found
            </p>
            <p className="text-sm text-muted-foreground">
              {employees.length === 0
                ? "Add your first employee to get started"
                : "Try adjusting your search or filter criteria"}
            </p>
          </div>
        )}
      </motion.div>

      {/* Pagination placeholder */}
      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Showing {filteredEmployees.length} of {employees.length} employees
        </p>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the employee from your company. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Removing..." : "Remove Employee"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Invite Employee Modal */}
      <InviteEmployeeModal
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
      />
      
      {/* CSV Import Modal */}
      <CSVImportModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
      />
    </MainLayout>
  );
};

export default Employees;
