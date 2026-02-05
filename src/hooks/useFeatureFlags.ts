import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { toast } from "sonner";

export interface FeatureFlags {
  id: string;
  company_id: string;
  attendance_enabled: boolean;
  overtime_enabled: boolean;
  loans_enabled: boolean;
  advanced_reports_enabled: boolean;
  leave_management_enabled: boolean;
  api_access_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const useFeatureFlags = () => {
  const { profile } = useAuth();
  const { limits } = useSubscription();
  const companyId = profile?.company_id;
  const queryClient = useQueryClient();

  const { data: flags, isLoading } = useQuery({
    queryKey: ["feature-flags", companyId],
    queryFn: async () => {
      if (!companyId) return null;

      const { data, error } = await supabase
        .from("company_feature_flags")
        .select("*")
        .eq("company_id", companyId)
        .single();

      if (error) {
        // If no flags exist, return defaults
        if (error.code === "PGRST116") {
          return {
            attendance_enabled: false,
            overtime_enabled: false,
            loans_enabled: false,
            advanced_reports_enabled: false,
            leave_management_enabled: true,
            api_access_enabled: false,
          } as Partial<FeatureFlags>;
        }
        throw error;
      }
      return data as FeatureFlags;
    },
    enabled: !!companyId,
  });

  const updateFlagsMutation = useMutation({
    mutationFn: async (updates: Partial<FeatureFlags>) => {
      if (!companyId) throw new Error("No company ID");

      const { data, error } = await supabase
        .from("company_feature_flags")
        .update(updates)
        .eq("company_id", companyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-flags", companyId] });
      toast.success("Module settings saved");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save module settings");
    },
  });

  // Check if feature is enabled AND allowed by subscription plan
  const isFeatureEnabled = (feature: keyof Omit<FeatureFlags, 'id' | 'company_id' | 'created_at' | 'updated_at'>) => {
    if (!flags) return false;
    
    const flagEnabled = flags[feature] ?? false;
    
    // Check subscription limits
    switch (feature) {
      case 'loans_enabled':
        return flagEnabled && limits.canUseLoans;
      case 'overtime_enabled':
        return flagEnabled && limits.canUseOvertimeManagement;
      case 'advanced_reports_enabled':
        return flagEnabled && limits.canUseAdvancedReports;
      case 'api_access_enabled':
        return flagEnabled && limits.canUseApi;
      default:
        return flagEnabled;
    }
  };

  // Check if feature can be enabled (based on subscription)
  const canEnableFeature = (feature: keyof Omit<FeatureFlags, 'id' | 'company_id' | 'created_at' | 'updated_at'>) => {
    switch (feature) {
      case 'loans_enabled':
        return limits.canUseLoans;
      case 'overtime_enabled':
        return limits.canUseOvertimeManagement;
      case 'advanced_reports_enabled':
        return limits.canUseAdvancedReports;
      case 'api_access_enabled':
        return limits.canUseApi;
      default:
        return true;
    }
  };

  return {
    flags,
    isLoading,
    updateFlags: updateFlagsMutation.mutate,
    isUpdating: updateFlagsMutation.isPending,
    isFeatureEnabled,
    canEnableFeature,
  };
};
