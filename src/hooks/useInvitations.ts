import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Invitation {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_id: string;
  department: string | null;
  designation: string | null;
  basic_salary: number | null;
  employment_type: string | null;
  status: string;
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export function useInvitations() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const invitationsQuery = useQuery({
    queryKey: ["invitations", profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];

      const { data, error } = await supabase
        .from("employee_invitations")
        .select("*")
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Invitation[];
    },
    enabled: !!profile?.company_id,
  });

  const sendInvitation = useMutation({
    mutationFn: async (data: {
      email: string;
      firstName: string;
      lastName: string;
      companyName: string;
      department?: string;
      designation?: string;
      basicSalary?: number;
      employmentType?: string;
    }) => {
      if (!profile?.company_id) throw new Error("No company selected");

      const { data: result, error } = await supabase.functions.invoke(
        "send-employee-invitation",
        {
          body: {
            ...data,
            companyId: profile.company_id,
          },
        }
      );

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      toast.success("Invitation sent successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to send invitation: " + error.message);
    },
  });

  const cancelInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from("employee_invitations")
        .update({ status: "cancelled" })
        .eq("id", invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      toast.success("Invitation cancelled");
    },
    onError: (error: Error) => {
      toast.error("Failed to cancel invitation: " + error.message);
    },
  });

  const resendInvitation = useMutation({
    mutationFn: async (invitation: Invitation) => {
      // Get company name
      const { data: company } = await supabase
        .from("companies")
        .select("name")
        .eq("id", invitation.company_id)
        .single();

      if (!company) throw new Error("Company not found");

      // Cancel old invitation
      await supabase
        .from("employee_invitations")
        .update({ status: "cancelled" })
        .eq("id", invitation.id);

      // Send new invitation
      const { data: result, error } = await supabase.functions.invoke(
        "send-employee-invitation",
        {
          body: {
            email: invitation.email,
            firstName: invitation.first_name,
            lastName: invitation.last_name,
            companyId: invitation.company_id,
            companyName: company.name,
            department: invitation.department,
            designation: invitation.designation,
            basicSalary: invitation.basic_salary,
            employmentType: invitation.employment_type,
          },
        }
      );

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      toast.success("Invitation resent successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to resend invitation: " + error.message);
    },
  });

  return {
    invitations: invitationsQuery.data || [],
    isLoading: invitationsQuery.isLoading,
    sendInvitation,
    cancelInvitation,
    resendInvitation,
    isSending: sendInvitation.isPending,
    isCancelling: cancelInvitation.isPending,
    isResending: resendInvitation.isPending,
  };
}
