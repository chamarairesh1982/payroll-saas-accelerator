import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, User, Building, CreditCard, DollarSign, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useEmployees, useEmployee, banks } from "@/hooks/useEmployees";
import { useDepartments } from "@/hooks/useDepartments";
import { useDesignations } from "@/hooks/useDesignations";

const passwordSchema = z.preprocess(
  (val) => {
    if (typeof val === "string" && val.trim() === "") return undefined;
    return val;
  },
  z.string().min(8, "Password must be at least 8 characters").max(72).optional()
);

const employeeSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters").max(50),
  last_name: z.string().min(2, "Last name must be at least 2 characters").max(50),
  email: z.string().email("Invalid email address"),
  password: passwordSchema,
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  nic: z.string().min(10, "NIC must be at least 10 characters").max(12),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  date_of_joining: z.string().min(1, "Date of joining is required"),
  department: z.string().min(1, "Department is required"),
  designation: z.string().min(1, "Designation is required"),
  employment_type: z.enum(["permanent", "contract", "probation", "intern"]),
  bank_name: z.string().min(1, "Bank name is required"),
  bank_branch: z.string().min(1, "Bank branch is required"),
  bank_account_number: z.string().min(5, "Account number must be at least 5 characters"),
  epf_number: z.string().min(1, "EPF number is required"),
  basic_salary: z.coerce.number().min(1, "Basic salary must be greater than 0"),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

const EmployeeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const { createEmployee, updateEmployee, isCreating, isUpdating } = useEmployees();
  const { data: existingEmployee, isLoading } = useEmployee(id);
  const { departments, isLoading: isDepartmentsLoading } = useDepartments();
  const { designations, isLoading: isDesignationsLoading } = useDesignations();

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      phone: "",
      nic: "",
      date_of_birth: "",
      date_of_joining: "",
      department: "",
      designation: "",
      employment_type: "permanent",
      bank_name: "",
      bank_branch: "",
      bank_account_number: "",
      epf_number: "",
      basic_salary: 0,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (existingEmployee && isEditing) {
      form.reset({
        first_name: existingEmployee.first_name || "",
        last_name: existingEmployee.last_name || "",
        email: existingEmployee.email || "",
        phone: existingEmployee.phone || "",
        nic: existingEmployee.nic || "",
        date_of_birth: existingEmployee.date_of_birth || "",
        date_of_joining: existingEmployee.date_of_joining || "",
        department: existingEmployee.department || "",
        designation: existingEmployee.designation || "",
        employment_type: (existingEmployee.employment_type as "permanent" | "contract" | "probation" | "intern") || "permanent",
        bank_name: existingEmployee.bank_name || "",
        bank_branch: existingEmployee.bank_branch || "",
        bank_account_number: existingEmployee.bank_account_number || "",
        epf_number: existingEmployee.epf_number || "",
        basic_salary: existingEmployee.basic_salary || 0,
      });
    }
  }, [existingEmployee, isEditing, form]);

  const onSubmit = (data: EmployeeFormData) => {
    if (isEditing && id) {
      updateEmployee(
        {
          id,
          updates: {
            first_name: data.first_name,
            last_name: data.last_name,
            phone: data.phone,
            nic: data.nic,
            date_of_birth: data.date_of_birth,
            date_of_joining: data.date_of_joining,
            department: data.department,
            designation: data.designation,
            employment_type: data.employment_type,
            bank_name: data.bank_name,
            bank_branch: data.bank_branch,
            bank_account_number: data.bank_account_number,
            epf_number: data.epf_number,
            basic_salary: data.basic_salary,
          },
        },
        {
          onSuccess: () => navigate("/employees"),
        }
      );
    } else {
      createEmployee(
        {
          email: data.email,
          password: data.password || "TempPass123!",
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          nic: data.nic,
          date_of_birth: data.date_of_birth,
          date_of_joining: data.date_of_joining,
          department: data.department,
          designation: data.designation,
          employment_type: data.employment_type,
          bank_name: data.bank_name,
          bank_branch: data.bank_branch,
          bank_account_number: data.bank_account_number,
          epf_number: data.epf_number,
          basic_salary: data.basic_salary,
        },
        {
          onSuccess: () => navigate("/employees"),
        }
      );
    }
  };

  const SectionHeader = ({
    icon: Icon,
    title,
  }: {
    icon: React.ElementType;
    title: string;
  }) => (
    <div className="flex items-center gap-3 border-b pb-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
    </div>
  );

  if ((isLoading && isEditing) || isDepartmentsLoading || isDesignationsLoading) {
    return (
      <MainLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const isPending = isCreating || isUpdating;

  return (
    <MainLayout>
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/employees")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Employees
        </Button>
        <h1 className="page-title">
          {isEditing ? "Edit Employee" : "Add New Employee"}
        </h1>
        <p className="page-description">
          {isEditing
            ? `Update ${existingEmployee?.first_name}'s information`
            : "Fill in the details to register a new employee"}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Personal Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl bg-card p-6 shadow-sm"
          >
            <SectionHeader icon={User} title="Personal Information" />
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nimal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Perera" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="nimal@company.lk"
                        disabled={isEditing}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!isEditing && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password *</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Minimum 6 characters"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="+94 77 123 4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIC Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="199012345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date_of_birth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </motion.div>

          {/* Employment Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl bg-card p-6 shadow-sm"
          >
            <SectionHeader icon={Building} title="Employment Information" />
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.length === 0 ? (
                          <SelectItem value="__empty" disabled>No departments configured</SelectItem>
                        ) : (
                          departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.name}>
                              {dept.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="designation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Designation *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select designation" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {designations.length === 0 ? (
                          <SelectItem value="__empty" disabled>No designations configured</SelectItem>
                        ) : (
                          designations.map((des) => (
                            <SelectItem key={des.id} value={des.name}>
                              {des.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="employment_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employment Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="permanent">Permanent</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="probation">Probation</SelectItem>
                        <SelectItem value="intern">Intern</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date_of_joining"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Joining *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="epf_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>EPF Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="EPF/2024/001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </motion.div>

          {/* Bank Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl bg-card p-6 shadow-sm"
          >
            <SectionHeader icon={CreditCard} title="Bank Account Details" />
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <FormField
                control={form.control}
                name="bank_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bank" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {banks.map((bank) => (
                          <SelectItem key={bank} value={bank}>
                            {bank}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bank_branch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch *</FormLabel>
                    <FormControl>
                      <Input placeholder="Colombo Fort" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bank_account_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </motion.div>

          {/* Salary Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl bg-card p-6 shadow-sm"
          >
            <SectionHeader icon={DollarSign} title="Salary Information" />
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <FormField
                control={form.control}
                name="basic_salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Basic Salary (Rs.) *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="150000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="rounded-lg bg-muted/50 p-4 sm:col-span-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> EPF (8% employee + 12% employer) and ETF
                  (3% employer) will be calculated automatically based on the
                  basic salary as per Sri Lanka Labour Laws.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/employees")}
            >
              Cancel
            </Button>
            <Button type="submit" size="lg" disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isEditing ? "Update Employee" : "Add Employee"}
            </Button>
          </div>
        </form>
      </Form>
    </MainLayout>
  );
};

export default EmployeeForm;
