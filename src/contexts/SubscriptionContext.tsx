import { createContext, useContext, ReactNode, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

type SubscriptionPlan = "free" | "pro" | "enterprise";
type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing";

interface SubscriptionLimits {
  maxEmployees: number;
  canUseLoans: boolean;
  canUseOvertimeManagement: boolean;
  canUseAdvancedReports: boolean;
  canUseCustomIntegrations: boolean;
  canUseApi: boolean;
}

interface SubscriptionContextType {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  limits: SubscriptionLimits;
  currentEmployeeCount: number;
  canAddEmployee: boolean;
  isLoading: boolean;
  isPaid: boolean;
  features: string[];
}

const defaultLimits: SubscriptionLimits = {
  maxEmployees: 5,
  canUseLoans: false,
  canUseOvertimeManagement: false,
  canUseAdvancedReports: false,
  canUseCustomIntegrations: false,
  canUseApi: false,
};

const planLimits: Record<SubscriptionPlan, SubscriptionLimits> = {
  free: {
    maxEmployees: 5,
    canUseLoans: false,
    canUseOvertimeManagement: false,
    canUseAdvancedReports: false,
    canUseCustomIntegrations: false,
    canUseApi: false,
  },
  pro: {
    maxEmployees: 50,
    canUseLoans: true,
    canUseOvertimeManagement: true,
    canUseAdvancedReports: true,
    canUseCustomIntegrations: false,
    canUseApi: false,
  },
  enterprise: {
    maxEmployees: -1, // unlimited
    canUseLoans: true,
    canUseOvertimeManagement: true,
    canUseAdvancedReports: true,
    canUseCustomIntegrations: true,
    canUseApi: true,
  },
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  const { data: companyData, isLoading: companyLoading } = useQuery({
    queryKey: ["company-subscription", companyId],
    queryFn: async () => {
      if (!companyId) return null;

      const { data, error } = await supabase
        .from("companies")
        .select("subscription_plan, subscription_status, max_employees")
        .eq("id", companyId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: employeeCount = 0 } = useQuery({
    queryKey: ["employee-count", companyId],
    queryFn: async () => {
      if (!companyId) return 0;

      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!companyId,
  });

  const { data: planFeatures = [] } = useQuery({
    queryKey: ["plan-features", companyData?.subscription_plan],
    queryFn: async () => {
      if (!companyData?.subscription_plan) return [];

      const { data, error } = await supabase
        .from("subscription_plans")
        .select("features")
        .eq("plan_type", companyData.subscription_plan)
        .single();

      if (error) return [];
      return Array.isArray(data?.features) ? data.features as string[] : [];
    },
    enabled: !!companyData?.subscription_plan,
  });

  const plan = (companyData?.subscription_plan as SubscriptionPlan) || "free";
  const status = (companyData?.subscription_status as SubscriptionStatus) || "active";
  const limits = planLimits[plan] || defaultLimits;
  
  const canAddEmployee = useMemo(() => {
    if (limits.maxEmployees === -1) return true;
    return employeeCount < limits.maxEmployees;
  }, [employeeCount, limits.maxEmployees]);

  const value: SubscriptionContextType = {
    plan,
    status,
    limits,
    currentEmployeeCount: employeeCount,
    canAddEmployee,
    isLoading: companyLoading,
    isPaid: plan !== "free",
    features: planFeatures,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}
