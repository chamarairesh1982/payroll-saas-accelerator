import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Settings as SettingsIcon, Save, Loader2, Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFeatureFlags, FeatureFlags } from "@/hooks/useFeatureFlags";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { UpgradePlanCard } from "@/components/subscription/UpgradePlanCard";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ModuleConfig {
  key: keyof Omit<FeatureFlags, 'id' | 'company_id' | 'created_at' | 'updated_at'>;
  label: string;
  description: string;
  requiresPlan?: 'pro' | 'enterprise';
}

const modules: ModuleConfig[] = [
  {
    key: "attendance_enabled",
    label: "Time & Attendance",
    description: "Track employee check-ins, working hours, and calculate attendance-based salary deductions.",
  },
  {
    key: "leave_management_enabled",
    label: "Leave Management",
    description: "Manage leave types, balances, requests, and approvals for all employees.",
  },
  {
    key: "overtime_enabled",
    label: "Overtime Management",
    description: "Configure overtime rates, track OT entries, and include overtime in payroll calculations.",
    requiresPlan: "pro",
  },
  {
    key: "loans_enabled",
    label: "Loans & Advances",
    description: "Manage salary advances and loans with automatic payroll deductions.",
    requiresPlan: "pro",
  },
  {
    key: "advanced_reports_enabled",
    label: "Advanced Reports",
    description: "Access detailed analytics, custom reports, and data export options.",
    requiresPlan: "pro",
  },
  {
    key: "api_access_enabled",
    label: "API Access",
    description: "Enable REST API access for integrations with external systems.",
    requiresPlan: "enterprise",
  },
];

const Settings = () => {
  const [searchParams] = useSearchParams();
  const { flags, isLoading, updateFlags, isUpdating, canEnableFeature } = useFeatureFlags();
  const { plan, isPaid } = useSubscription();
  
  const [activeTab, setActiveTab] = useState("modules");
  const [localFlags, setLocalFlags] = useState<Partial<FeatureFlags>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Handle subscription success/cancel from Stripe redirect
  useEffect(() => {
    const subscriptionStatus = searchParams.get("subscription");
    if (subscriptionStatus === "success") {
      toast.success("Subscription updated successfully!");
      setActiveTab("billing");
    } else if (subscriptionStatus === "canceled") {
      toast.info("Subscription checkout was canceled.");
      setActiveTab("billing");
    }
  }, [searchParams]);

  // Initialize local state when flags load
  useEffect(() => {
    if (flags) {
      setLocalFlags({
        attendance_enabled: flags.attendance_enabled,
        leave_management_enabled: flags.leave_management_enabled,
        overtime_enabled: flags.overtime_enabled,
        loans_enabled: flags.loans_enabled,
        advanced_reports_enabled: flags.advanced_reports_enabled,
        api_access_enabled: flags.api_access_enabled,
      });
    }
  }, [flags]);

  const handleToggle = (key: keyof Omit<FeatureFlags, 'id' | 'company_id' | 'created_at' | 'updated_at'>) => {
    setLocalFlags(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateFlags(localFlags);
    setHasChanges(false);
  };

  const getPlanBadge = (requiresPlan?: 'pro' | 'enterprise') => {
    if (!requiresPlan) return null;
    
    const colors = {
      pro: "bg-primary/15 text-primary",
      enterprise: "bg-accent/15 text-accent-foreground",
    };
    
    return (
      <Badge variant="secondary" className={cn("ml-2 gap-1", colors[requiresPlan])}>
        <Crown className="h-3 w-3" />
        {requiresPlan.charAt(0).toUpperCase() + requiresPlan.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">System Settings</h1>
          <p className="page-description">Configure modules and system preferences for your company.</p>
        </div>
        <Button size="lg" onClick={handleSave} disabled={!hasChanges || isUpdating}>
          {isUpdating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="modules">
            <SettingsIcon className="h-4 w-4 mr-2" />
            Modules
          </TabsTrigger>
          <TabsTrigger value="billing">
            <Crown className="h-4 w-4 mr-2" />
            Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-6">
          {/* Module Toggles */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <SettingsIcon className="h-5 w-5" />
                    Module Configuration
                  </CardTitle>
                  <CardDescription>
                    Enable or disable modules based on your business needs.
                  </CardDescription>
                </div>
                <Button size="lg" onClick={handleSave} disabled={!hasChanges || isUpdating}>
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
            {modules.map((module, index) => {
              const canEnable = canEnableFeature(module.key);
              const isEnabled = localFlags[module.key] ?? false;
              const isLocked = !canEnable;

              return (
                <div key={module.key}>
                  {index > 0 && <Separator className="mb-6" />}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <Label 
                          htmlFor={module.key} 
                          className={cn(
                            "text-base font-medium",
                            isLocked && "text-muted-foreground"
                          )}
                        >
                          {module.label}
                        </Label>
                        {getPlanBadge(module.requiresPlan)}
                      </div>
                      <p className={cn(
                        "text-sm text-muted-foreground",
                        isLocked && "opacity-60"
                      )}>
                        {module.description}
                      </p>
                      {isLocked && (
                        <p className="mt-2 flex items-center gap-1 text-sm text-warning">
                          <Lock className="h-3 w-3" />
                          Upgrade to {module.requiresPlan} plan to enable this feature
                        </p>
                      )}
                    </div>
                    <Switch
                      id={module.key}
                      checked={isEnabled}
                      onCheckedChange={() => handleToggle(module.key)}
                      disabled={isLocked}
                      className="shrink-0"
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
          </Card>

          {/* Current Plan Info */}
          <Card>
            <CardHeader>
              <CardTitle>Your Subscription</CardTitle>
              <CardDescription>
                Current plan: <span className="font-semibold capitalize">{plan}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isPaid 
                      ? "You have access to premium features based on your plan."
                      : "Upgrade to unlock more modules and features."}
                  </p>
                </div>
                {!isPaid && (
                  <Button variant="default" onClick={() => setActiveTab("billing")}>
                    <Crown className="h-4 w-4" />
                    Upgrade Plan
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <UpgradePlanCard />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default Settings;
