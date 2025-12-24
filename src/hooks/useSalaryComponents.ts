import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type SalaryComponentRow = Tables<"salary_components">;
export type SalaryComponentInsert = TablesInsert<"salary_components">;
export type SalaryComponentUpdate = TablesUpdate<"salary_components">;

export type SalaryComponentCreateInput = {
  name: SalaryComponentInsert["name"];
  type: SalaryComponentInsert["type"];
  category: SalaryComponentInsert["category"];
  calculation_type: SalaryComponentInsert["calculation_type"];
  value: number;
  is_taxable: boolean;
  is_epf_applicable: boolean;
  is_active: boolean;
};

export const useSalaryComponents = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  const salaryComponentsQuery = useQuery({
    queryKey: ["salary-components", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("salary_components")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as SalaryComponentRow[];
    },
  });

  const createSalaryComponentMutation = useMutation({
    mutationFn: async (data: SalaryComponentCreateInput) => {
      if (!companyId) throw new Error("No company selected");

      const { error } = await supabase.from("salary_components").insert({
        ...data,
        company_id: companyId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-components", companyId] });
      toast.success("Salary component saved");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save salary component");
    },
  });

  const updateSalaryComponentMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<SalaryComponentUpdate>;
    }) => {
      const { error } = await supabase.from("salary_components").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-components", companyId] });
      toast.success("Salary component updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update salary component");
    },
  });

  const deleteSalaryComponentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("salary_components").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-components", companyId] });
      toast.success("Salary component deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete salary component");
    },
  });

  return {
    salaryComponents: salaryComponentsQuery.data ?? [],
    isLoading: salaryComponentsQuery.isLoading,
    createSalaryComponent: createSalaryComponentMutation.mutate,
    updateSalaryComponent: updateSalaryComponentMutation.mutate,
    deleteSalaryComponent: deleteSalaryComponentMutation.mutate,
    isCreating: createSalaryComponentMutation.isPending,
    isUpdating: updateSalaryComponentMutation.isPending,
    isDeleting: deleteSalaryComponentMutation.isPending,
  };
};
