import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SuperAdminUser {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile?: {
    email: string | null;
    first_name: string | null;
    last_name: string | null;
  };
}

export const useSuperAdminUsers = () => {
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const isSuperAdmin = role === "super_admin";

  const { data: superAdmins = [], isLoading } = useQuery({
    queryKey: ["super-admin-users"],
    queryFn: async () => {
      // Get all super admin roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("id, user_id, role, created_at")
        .eq("role", "super_admin");

      if (rolesError) throw rolesError;

      // Get profiles for these users
      const userIds = roles.map((r) => r.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Combine data
      return roles.map((role) => ({
        ...role,
        profile: profiles.find((p) => p.id === role.user_id),
      })) as SuperAdminUser[];
    },
    enabled: isSuperAdmin,
  });

  const createSuperAdminMutation = useMutation({
    mutationFn: async ({
      email,
      password,
      firstName,
      lastName,
    }: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    }) => {
      // Create the user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");

      // Create super_admin role (no company_id needed for super admins)
      // We use a placeholder company_id since the column is required
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: authData.user.id,
        company_id: "00000000-0000-0000-0000-000000000000", // Placeholder for super admins
        role: "super_admin",
      });

      if (roleError) throw roleError;

      return authData.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin-users"] });
      toast.success("Super admin created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create super admin");
    },
  });

  const removeSuperAdminMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin-users"] });
      toast.success("Super admin role removed");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove super admin");
    },
  });

  return {
    superAdmins,
    isLoading,
    createSuperAdmin: createSuperAdminMutation.mutate,
    removeSuperAdmin: removeSuperAdminMutation.mutate,
    isCreating: createSuperAdminMutation.isPending,
    isRemoving: removeSuperAdminMutation.isPending,
    isSuperAdmin,
  };
};
