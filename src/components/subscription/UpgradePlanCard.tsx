import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Loader2, Sparkles } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { cn } from "@/lib/utils";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  type: "free" | "pro" | "enterprise";
  name: string;
  price: number;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    type: "free",
    name: "Free",
    price: 0,
    description: "For small teams getting started",
    features: [
      { text: "Up to 5 employees", included: true },
      { text: "Basic payroll processing", included: true },
      { text: "Leave management", included: true },
      { text: "Overtime tracking", included: false },
      { text: "Loan management", included: false },
      { text: "Advanced reports", included: false },
      { text: "API access", included: false },
    ],
  },
  {
    type: "pro",
    name: "Pro",
    price: 29,
    description: "For growing businesses",
    popular: true,
    features: [
      { text: "Up to 50 employees", included: true },
      { text: "Full payroll processing", included: true },
      { text: "Leave management", included: true },
      { text: "Overtime tracking", included: true },
      { text: "Loan management", included: true },
      { text: "Advanced reports", included: true },
      { text: "API access", included: false },
    ],
  },
  {
    type: "enterprise",
    name: "Enterprise",
    price: 99,
    description: "For large organizations",
    features: [
      { text: "Unlimited employees", included: true },
      { text: "Full payroll processing", included: true },
      { text: "Leave management", included: true },
      { text: "Overtime tracking", included: true },
      { text: "Loan management", included: true },
      { text: "Advanced reports", included: true },
      { text: "API access", included: true },
    ],
  },
];

export const UpgradePlanCard = () => {
  const { plan: currentPlan, status: subscriptionStatus } = useSubscription();
  const { createCheckoutSession, isLoading } = useStripeCheckout();

  const handleUpgrade = (planType: "free" | "pro" | "enterprise") => {
    if (planType === currentPlan) return;
    if (planType === "free") return;
    createCheckoutSession(planType);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Subscription Plans</h3>
        <p className="text-sm text-muted-foreground">
          Choose the plan that best fits your organization's needs.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrentPlan = plan.type === currentPlan;
          const isUpgrade =
            (currentPlan === "free" && plan.type !== "free") ||
            (currentPlan === "pro" && plan.type === "enterprise");

          return (
            <Card
              key={plan.type}
              className={cn(
                "relative",
                plan.popular && "border-primary shadow-lg",
                isCurrentPlan && "ring-2 ring-primary"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Sparkles className="mr-1 h-3 w-3" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {plan.type === "enterprise" && (
                      <Crown className="h-5 w-5 text-amber-500" />
                    )}
                    {plan.name}
                  </CardTitle>
                  {isCurrentPlan && (
                    <Badge variant="secondary">Current Plan</Badge>
                  )}
                </div>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li
                      key={index}
                      className={cn(
                        "flex items-center gap-2 text-sm",
                        !feature.included && "text-muted-foreground"
                      )}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          feature.included
                            ? "text-success"
                            : "text-muted-foreground/50"
                        )}
                      />
                      {feature.text}
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={isCurrentPlan ? "outline" : isUpgrade ? "default" : "secondary"}
                  disabled={isCurrentPlan || !isUpgrade || isLoading}
                  onClick={() => handleUpgrade(plan.type)}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {isCurrentPlan
                    ? "Current Plan"
                    : isUpgrade
                    ? "Upgrade"
                    : "Downgrade"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {subscriptionStatus === "past_due" && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4">
          <p className="text-sm text-destructive font-medium">
            Your subscription payment is past due. Please update your payment method to avoid service interruption.
          </p>
        </div>
      )}
    </div>
  );
};
