import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Employee = Tables<"profiles">;
export type EmployeeInsert = TablesInsert<"profiles">;
export type EmployeeUpdate = TablesUpdate<"profiles">;

export const departments = [
  "Engineering",
  "Human Resources",
  "Finance",
  "Marketing",
  "Operations",
  "Sales",
  "Administration",
];

export const designations = [
  "Software Developer",
  "Senior Software Developer",
  "Tech Lead",
  "Engineering Manager",
  "HR Executive",
  "HR Manager",
  "Accountant",
  "Senior Accountant",
  "Finance Manager",
  "Marketing Executive",
  "Marketing Manager",
  "Operations Coordinator",
  "Operations Manager",
  "Sales Executive",
  "Sales Manager",
  "Administrative Assistant",
];

export const banks = [
  "Bank of Ceylon (BOC)",
  "Commercial Bank",
  "Sampath Bank",
  "Hatton National Bank (HNB)",
  "National Development Bank (NDB)",
  "People's Bank",
  "Seylan Bank",
  "DFCC Bank",
  "Nations Trust Bank",
  "Pan Asia Bank",
];

export const useEmployees = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  const {
    data: employees = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["employees", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      first_name: string;
      last_name: string;
      phone?: string;
      nic?: string;
      date_of_birth?: string;
      date_of_joining?: string;
      department?: string;
      designation?: string;
      employment_type?: string;
      bank_name?: string;
      bank_branch?: string;
      bank_account_number?: string;
      epf_number?: string;
      basic_salary?: number;
    }) => {
      if (!companyId) throw new Error("No company selected");

      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: data.first_name,
            last_name: data.last_name,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");

      // Generate employee number
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId);

      const employeeNumber = `EMP${String((count || 0) + 1).padStart(3, "0")}`;

      // Update profile with employee details
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          company_id: companyId,
          employee_number: employeeNumber,
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
          status: "active",
        })
        .eq("id", authData.user.id);

      if (profileError) throw profileError;

      // Create user role as employee
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: authData.user.id,
        company_id: companyId,
        role: "employee",
      });

      if (roleError) throw roleError;

      return authData.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees", companyId] });
      toast.success("Employee created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create employee");
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<EmployeeUpdate>;
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees", companyId] });
      toast.success("Employee updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update employee");
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      // Remove from company (soft delete)
      const { error } = await supabase
        .from("profiles")
        .update({ company_id: null, status: "terminated" })
        .eq("id", id);

      if (error) throw error;

      // Remove role
      const { error: roleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", id)
        .eq("company_id", companyId);

      if (roleError) throw roleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees", companyId] });
      toast.success("Employee removed successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove employee");
    },
  });

  return {
    employees,
    isLoading,
    error,
    createEmployee: createEmployeeMutation.mutate,
    updateEmployee: updateEmployeeMutation.mutate,
    deleteEmployee: deleteEmployeeMutation.mutate,
    isCreating: createEmployeeMutation.isPending,
    isUpdating: updateEmployeeMutation.isPending,
    isDeleting: deleteEmployeeMutation.isPending,
  };
};

export const useEmployee = (id: string | undefined) => {
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  return useQuery({
    queryKey: ["employee", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id && !!companyId,
  });
};
