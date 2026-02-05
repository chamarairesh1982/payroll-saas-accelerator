import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface AccessibleCompany {
  company_id: string;
  is_subsidiary: boolean;
}

interface CompanyWithDetails {
  id: string;
  name: string;
  subscription_plan: string | null;
  parent_company_id: string | null;
  is_active: boolean;
  employee_count?: number;
}

interface MultiCompanyStats {
  total_companies: number;
  total_employees: number;
  total_payroll_processed: number;
  pending_leave_requests: number;
  pending_loan_approvals: number;
}

export function useMultiCompany() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  // Check if user has access to multiple companies
  const { data: accessibleCompanies = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ["accessible-companies", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase.rpc("get_accessible_companies", {
        p_user_id: user.id,
      });

      if (error) {
        console.error("Error fetching accessible companies:", error);
        return [];
      }

      return (data || []) as AccessibleCompany[];
    },
    enabled: !!user?.id,
  });

  // Fetch company details for accessible companies
  const { data: companies = [], isLoading: isLoadingDetails } = useQuery({
    queryKey: ["company-details", accessibleCompanies],
    queryFn: async () => {
      if (accessibleCompanies.length === 0) return [];

      const companyIds = accessibleCompanies.map((ac) => ac.company_id);

      const { data: companiesData, error: companiesError } = await supabase
        .from("companies")
        .select("id, name, subscription_plan, parent_company_id, is_active")
        .in("id", companyIds);

      if (companiesError) {
        console.error("Error fetching company details:", companiesError);
        return [];
      }

      // Get employee counts for each company
      const companiesWithCounts = await Promise.all(
        (companiesData || []).map(async (company) => {
          const { count } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("company_id", company.id)
            .eq("status", "active");

          return {
            ...company,
            employee_count: count || 0,
          } as CompanyWithDetails;
        })
      );

      return companiesWithCounts;
    },
    enabled: accessibleCompanies.length > 0,
  });

  // Fetch aggregated stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["multi-company-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase.rpc("get_multi_company_stats", {
        p_user_id: user.id,
      });

      if (error) {
        console.error("Error fetching multi-company stats:", error);
        return null;
      }

      const statsData = data?.[0] || {
        total_companies: 0,
        total_employees: 0,
        total_payroll_processed: 0,
        pending_leave_requests: 0,
        pending_loan_approvals: 0,
      };

      return {
        total_companies: Number(statsData.total_companies),
        total_employees: Number(statsData.total_employees),
        total_payroll_processed: Number(statsData.total_payroll_processed),
        pending_leave_requests: Number(statsData.pending_leave_requests),
        pending_loan_approvals: Number(statsData.pending_loan_approvals),
      } as MultiCompanyStats;
    },
    enabled: !!user?.id && accessibleCompanies.length > 1,
  });

  // Get subsidiary companies of current company
  const { data: subsidiaries = [] } = useQuery({
    queryKey: ["subsidiaries", profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];

      const { data, error } = await supabase
        .from("companies")
        .select("id, name, subscription_plan, is_active")
        .eq("parent_company_id", profile.company_id)
        .eq("is_active", true);

      if (error) {
        console.error("Error fetching subsidiaries:", error);
        return [];
      }

      return data || [];
    },
    enabled: !!profile?.company_id,
  });

  // Add subsidiary company
  const addSubsidiary = useMutation({
    mutationFn: async (companyData: { name: string }) => {
      if (!profile?.company_id) throw new Error("No parent company");

      const { data, error } = await supabase
        .from("companies")
        .insert({
          name: companyData.name,
          parent_company_id: profile.company_id,
          subscription_plan: "free",
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Subsidiary company created successfully");
      queryClient.invalidateQueries({ queryKey: ["subsidiaries"] });
      queryClient.invalidateQueries({ queryKey: ["accessible-companies"] });
      queryClient.invalidateQueries({ queryKey: ["multi-company-stats"] });
    },
    onError: (error) => {
      console.error("Error creating subsidiary:", error);
      toast.error("Failed to create subsidiary company");
    },
  });

  // Check if user can add subsidiaries (enterprise plan required)
  const canAddSubsidiary = 
    accessibleCompanies.some((ac) => {
      const company = companies.find((c) => c.id === ac.company_id && !ac.is_subsidiary);
      return company?.subscription_plan === "enterprise";
    });

  const hasMultipleCompanies = accessibleCompanies.length > 1;
  const isLoading = isLoadingCompanies || isLoadingDetails || isLoadingStats;

  return {
    accessibleCompanies,
    companies,
    subsidiaries,
    stats,
    hasMultipleCompanies,
    canAddSubsidiary,
    isLoading,
    addSubsidiary,
  };
}
