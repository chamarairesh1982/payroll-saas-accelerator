import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, User, Lock, Bell, Save, Eye, EyeOff } from "lucide-react";

type NotificationPreferences = {
  email_leave_updates: boolean;
  email_payroll_updates: boolean;
  email_overtime_updates: boolean;
  email_loan_updates: boolean;
};

const defaultPreferences: NotificationPreferences = {
  email_leave_updates: true,
  email_payroll_updates: true,
  email_overtime_updates: true,
  email_loan_updates: true,
};

export default function Profile() {
  const { user, profile, refreshUserData } = useAuth();
  const queryClient = useQueryClient();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Fetch full profile data including phone
  const { data: fullProfile } = useQuery({
    queryKey: ["full-profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, phone, avatar_url")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Update form values when profile loads
  useEffect(() => {
    if (fullProfile) {
      setFirstName(fullProfile.first_name || "");
      setLastName(fullProfile.last_name || "");
      setPhone(fullProfile.phone || "");
    }
  }, [fullProfile]);

  // Fetch notification preferences
  const { data: preferences, isLoading: loadingPrefs } = useQuery({
    queryKey: ["notification-preferences", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("notification_preferences")
        .eq("id", user!.id)
        .single();
      
      if (error) throw error;
      return (data?.notification_preferences as NotificationPreferences) || defaultPreferences;
    },
  });

  const notificationPrefs = preferences || defaultPreferences;

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone,
        })
        .eq("id", user!.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated successfully");
      if (user?.id) refreshUserData(user.id);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update profile: ${error.message}`);
    },
  });

  // Update notification preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPrefs: NotificationPreferences) => {
      const { error } = await supabase
        .from("profiles")
        .update({ notification_preferences: newPrefs })
        .eq("id", user!.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences", user?.id] });
      toast.success("Notification preferences updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update preferences: ${error.message}`);
    },
  });

  const handleUpdateProfile = async () => {
    setIsUpdatingProfile(true);
    try {
      await updateProfileMutation.mutateAsync();
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) throw error;
      
      toast.success("Password changed successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(`Failed to change password: ${error.message}`);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    const newPrefs = { ...notificationPrefs, [key]: value };
    updatePreferencesMutation.mutate(newPrefs);
  };

  const getInitials = () => {
    const first = profile?.first_name?.[0] || "";
    const last = profile?.last_name?.[0] || "";
    return (first + last).toUpperCase() || user?.email?.[0]?.toUpperCase() || "U";
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and preferences</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Personal Information</CardTitle>
              </div>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{profile?.first_name} {profile?.last_name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <Button 
                onClick={handleUpdateProfile} 
                disabled={isUpdatingProfile}
                className="w-full"
              >
                {isUpdatingProfile ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                <CardTitle>Change Password</CardTitle>
              </div>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              <Button 
                onClick={handleChangePassword} 
                disabled={isChangingPassword || !newPassword || !confirmPassword}
                className="w-full"
              >
                {isChangingPassword ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Lock className="h-4 w-4 mr-2" />
                )}
                Change Password
              </Button>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>Notification Preferences</CardTitle>
              </div>
              <CardDescription>Choose what notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPrefs ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Leave Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications about leave request approvals and rejections
                      </p>
                    </div>
                    <Switch
                      checked={notificationPrefs.email_leave_updates}
                      onCheckedChange={(checked) => handlePreferenceChange("email_leave_updates", checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Payroll Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when payroll is processed and payslips are ready
                      </p>
                    </div>
                    <Switch
                      checked={notificationPrefs.email_payroll_updates}
                      onCheckedChange={(checked) => handlePreferenceChange("email_payroll_updates", checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Overtime Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications about overtime entry approvals
                      </p>
                    </div>
                    <Switch
                      checked={notificationPrefs.email_overtime_updates}
                      onCheckedChange={(checked) => handlePreferenceChange("email_overtime_updates", checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Loan Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about loan approvals and payment schedules
                      </p>
                    </div>
                    <Switch
                      checked={notificationPrefs.email_loan_updates}
                      onCheckedChange={(checked) => handlePreferenceChange("email_loan_updates", checked)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}