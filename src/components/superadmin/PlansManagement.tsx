import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  CreditCard, 
  Check, 
  Edit, 
  Save,
  X,
  Users,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { toast } from "sonner";

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

interface Plan {
  id: string;
  name: string;
  plan_type: "free" | "pro" | "enterprise";
  price_monthly: number;
  price_yearly: number;
  max_employees: number;
  features: Json;
  is_active: boolean;
}

interface PlansManagementProps {
  plans: Plan[];
}

const planColors = {
  free: "border-slate-200 bg-slate-50 dark:bg-slate-900/50",
  pro: "border-blue-200 bg-blue-50 dark:bg-blue-900/30",
  enterprise: "border-amber-200 bg-amber-50 dark:bg-amber-900/30",
};

export function PlansManagement({ plans }: PlansManagementProps) {
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editedPrices, setEditedPrices] = useState<{ monthly: string; yearly: string }>({ monthly: "", yearly: "" });
  const queryClient = useQueryClient();

  const updatePlanMutation = useMutation({
    mutationFn: async ({ planId, monthly, yearly }: { planId: string; monthly: number; yearly: number }) => {
      const { error } = await supabase
        .from("subscription_plans")
        .update({ 
          price_monthly: monthly,
          price_yearly: yearly,
        })
        .eq("id", planId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
      toast.success("Plan pricing updated successfully");
      setEditingPlan(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update plan");
    },
  });

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan.id);
    setEditedPrices({
      monthly: plan.price_monthly.toString(),
      yearly: plan.price_yearly.toString(),
    });
  };

  const handleSave = (planId: string) => {
    updatePlanMutation.mutate({
      planId,
      monthly: parseFloat(editedPrices.monthly),
      yearly: parseFloat(editedPrices.yearly),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Subscription Plans</h2>
          <p className="text-sm text-muted-foreground">
            Manage pricing and features for each plan
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan: Plan, index: number) => {
          const features: string[] = Array.isArray(plan.features) ? plan.features as string[] : [];
          const isEditing = editingPlan === plan.id;
          const colorClass = planColors[plan.plan_type as keyof typeof planColors] || planColors.free;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`relative h-full ${colorClass}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      {plan.name}
                    </CardTitle>
                    {!isEditing ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(plan)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    ) : (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSave(plan.id)}
                          disabled={updatePlanMutation.isPending}
                        >
                          <Save className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingPlan(null)}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <CardDescription>
                    {plan.plan_type === "free" 
                      ? "Get started for free" 
                      : plan.plan_type === "pro" 
                      ? "For growing businesses" 
                      : "For large organizations"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Pricing */}
                  <div className="space-y-2">
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            value={editedPrices.monthly}
                            onChange={(e) => setEditedPrices(prev => ({ ...prev, monthly: e.target.value }))}
                            className="w-24"
                          />
                          <span className="text-sm text-muted-foreground">/mo</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            value={editedPrices.yearly}
                            onChange={(e) => setEditedPrices(prev => ({ ...prev, yearly: e.target.value }))}
                            className="w-24"
                          />
                          <span className="text-sm text-muted-foreground">/yr</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold">${plan.price_monthly}</span>
                          <span className="text-muted-foreground">/month</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          or ${plan.price_yearly}/year (save {Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100)}%)
                        </p>
                      </>
                    )}
                  </div>

                  {/* Employee Limit */}
                  <div className="flex items-center gap-2 rounded-lg bg-background/50 p-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">
                      {plan.max_employees === -1 ? "Unlimited" : `Up to ${plan.max_employees}`} employees
                    </span>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Features:</p>
                    <ul className="space-y-2">
                      {features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Status */}
                  <div className="pt-2">
                    <Badge variant={plan.is_active ? "default" : "secondary"}>
                      {plan.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
