import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface UserWithRole {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  department: string | null;
  designation: string | null;
  status: string | null;
  phone: string | null;
  avatar_url: string | null;
  company_id: string | null;
  role?: AppRole;
  role_id?: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: AppRole;
  department?: string;
  designation?: string;
  phone?: string;
}

export interface UpdateUserRoleData {
  user_id: string;
  role: AppRole;
  role_id?: string;
}

export const useUsers = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  // Fetch all users with their roles for the company
  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["users", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      // First get all profiles in the company
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .eq("company_id", companyId);

      if (profilesError) throw profilesError;

      // Then get all roles for the company
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*")
        .eq("company_id", companyId);

      if (rolesError) throw rolesError;

      // Combine profiles with their roles
      const usersWithRoles: UserWithRole[] = profiles.map((profile) => {
        const userRole = roles.find((r) => r.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role,
          role_id: userRole?.id,
        };
      });

      return usersWithRoles;
    },
    enabled: !!companyId,
  });

  // Create a new user with role
  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserData) => {
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

      // Update profile with additional details
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          company_id: companyId,
          department: data.department,
          designation: data.designation,
          phone: data.phone,
        })
        .eq("id", authData.user.id);

      if (profileError) throw profileError;

      // Create user role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: authData.user.id,
        company_id: companyId,
        role: data.role,
      });

      if (roleError) throw roleError;

      return authData.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", companyId] });
      toast.success("User created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create user");
    },
  });

  // Update user role
  const updateRoleMutation = useMutation({
    mutationFn: async (data: UpdateUserRoleData) => {
      if (!companyId) throw new Error("No company selected");

      if (data.role_id) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ role: data.role })
          .eq("id", data.role_id);

        if (error) throw error;
      } else {
        // Create new role
        const { error } = await supabase.from("user_roles").insert({
          user_id: data.user_id,
          company_id: companyId,
          role: data.role,
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", companyId] });
      toast.success("Role updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update role");
    },
  });

  // Update user profile
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<UserWithRole> }) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: data.updates.first_name,
          last_name: data.updates.last_name,
          department: data.updates.department,
          designation: data.updates.designation,
          phone: data.updates.phone,
          status: data.updates.status,
        })
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", companyId] });
      toast.success("User updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update user");
    },
  });

  // Remove user from company (update profile and delete role)
  const removeUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!companyId) throw new Error("No company selected");

      // Remove the role
      const { error: roleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("company_id", companyId);

      if (roleError) throw roleError;

      // Update profile to remove company association
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ company_id: null })
        .eq("id", userId);

      if (profileError) throw profileError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", companyId] });
      toast.success("User removed from company");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove user");
    },
  });

  return {
    users,
    isLoading,
    error,
    createUser: createUserMutation.mutate,
    updateRole: updateRoleMutation.mutate,
    updateProfile: updateProfileMutation.mutate,
    removeUser: removeUserMutation.mutate,
    isCreating: createUserMutation.isPending,
    isUpdating: updateRoleMutation.isPending || updateProfileMutation.isPending,
    isRemoving: removeUserMutation.isPending,
  };
};
