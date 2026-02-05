import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

export type Company = Tables<"companies">;

export const useCompany = () => {
  const { profile } = useAuth();
  const companyId = profile?.company_id;
  const queryClient = useQueryClient();

  const { data: company, isLoading } = useQuery({
    queryKey: ["company", companyId],
    queryFn: async () => {
      if (!companyId) return null;

      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async (updates: TablesUpdate<"companies">) => {
      if (!companyId) throw new Error("No company ID");

      const { data, error } = await supabase
        .from("companies")
        .update(updates)
        .eq("id", companyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company", companyId] });
      toast.success("Company settings saved successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save company settings");
    },
  });

  return {
    company,
    isLoading,
    updateCompany: updateCompanyMutation.mutate,
    isUpdating: updateCompanyMutation.isPending,
  };
};
