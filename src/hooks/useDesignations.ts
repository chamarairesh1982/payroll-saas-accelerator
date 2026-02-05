import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Designation {
  id: string;
  company_id: string;
  name: string;
  department_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useDesignations = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  const { data: designations = [], isLoading, error } = useQuery({
    queryKey: ["designations", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("designations")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Designation[];
    },
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: async ({ name, department_id }: { name: string; department_id?: string }) => {
      if (!companyId) throw new Error("No company selected");
      const { data, error } = await supabase
        .from("designations")
        .insert({ company_id: companyId, name, department_id: department_id || null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designations", companyId] });
      toast.success("Designation created");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create designation");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, department_id, is_active }: { id: string; name?: string; department_id?: string | null; is_active?: boolean }) => {
      const updates: Partial<Designation> = {};
      if (name !== undefined) updates.name = name;
      if (department_id !== undefined) updates.department_id = department_id;
      if (is_active !== undefined) updates.is_active = is_active;
      const { error } = await supabase.from("designations").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designations", companyId] });
      toast.success("Designation updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update designation");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("designations").update({ is_active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designations", companyId] });
      toast.success("Designation removed");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove designation");
    },
  });

  return {
    designations,
    isLoading,
    error,
    createDesignation: createMutation.mutate,
    updateDesignation: updateMutation.mutate,
    deleteDesignation: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
