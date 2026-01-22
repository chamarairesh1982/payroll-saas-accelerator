import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  CheckCircle2, 
  Loader2, 
  ArrowRight, 
  Sparkles, 
  CreditCard,
  Check,
  Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CompanyOnboardingProps {
  onComplete: () => void;
}

type PlanType = "free" | "pro" | "enterprise";

interface PlanDetails {
  name: string;
  price: number;
  maxEmployees: number;
  features: string[];
  popular?: boolean;
}

const planDetails: Record<PlanType, PlanDetails> = {
  free: {
    name: "Free",
    price: 0,
    maxEmployees: 5,
    features: ["Up to 5 employees", "Basic payroll processing", "EPF/ETF calculations", "Email support"],
  },
  pro: {
    name: "Pro",
    price: 29.99,
    maxEmployees: 50,
    features: ["Up to 50 employees", "Leave & attendance management", "Loan management", "Custom reports", "Priority support"],
    popular: true,
  },
  enterprise: {
    name: "Enterprise",
    price: 99.99,
    maxEmployees: -1,
    features: ["Unlimited employees", "Full feature access", "API access", "Custom integrations", "Dedicated support"],
  },
};

export const CompanyOnboarding = ({ onComplete }: CompanyOnboardingProps) => {
  const { user, profile, refreshUserData } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("free");
  const [companyData, setCompanyData] = useState({
    name: "",
    registration_number: "",
    epf_number: "",
    etf_number: "",
    email: "",
    phone: "",
    address: "",
  });

  // Fetch subscription plans from database
  const { data: dbPlans } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompanyData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNextStep = () => {
    if (!companyData.name.trim()) {
      toast.error("Company name is required");
      return;
    }
    setStep(2);
  };

  const handleCreateCompany = async () => {
    if (!user) {
      toast.error("You must be logged in to create a company");
      return;
    }

    setIsSubmitting(true);

    try {
      const planInfo = dbPlans?.find(p => p.plan_type === selectedPlan);
      
      // Create the company with selected plan
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .insert({
          name: companyData.name.trim(),
          registration_number: companyData.registration_number || null,
          epf_number: companyData.epf_number || null,
          etf_number: companyData.etf_number || null,
          email: companyData.email || null,
          phone: companyData.phone || null,
          address: companyData.address || null,
          is_active: true,
          subscription_plan: selectedPlan,
          subscription_status: "active",
          max_employees: planInfo?.max_employees || 5,
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Update user profile with company_id
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          company_id: company.id,
          first_name: profile?.first_name || user.user_metadata?.first_name || null,
          last_name: profile?.last_name || user.user_metadata?.last_name || null,
          email: user.email,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Create admin role for the user
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: user.id,
        company_id: company.id,
        role: "admin",
      });

      if (roleError) throw roleError;

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });

      toast.success("Company created successfully! You are now the admin.");
      setStep(3);
      
      // Refresh auth context instead of page reload
      setTimeout(async () => {
        if (user) {
          await refreshUserData(user.id);
        }
        onComplete();
      }, 2000);
    } catch (error: any) {
      console.error("Error creating company:", error);
      toast.error(error.message || "Failed to create company");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="border-2 border-primary/20 shadow-lg">
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Welcome to PayrollSL!</CardTitle>
                  <CardDescription className="text-base">
                    Let's set up your company to get started with payroll management.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 max-w-lg mx-auto">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Company Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Acme Corporation (Pvt) Ltd"
                      value={companyData.name}
                      onChange={handleInputChange}
                      className="h-11"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="registration_number">Registration Number</Label>
                      <Input
                        id="registration_number"
                        name="registration_number"
                        placeholder="PV00012345"
                        value={companyData.registration_number}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Company Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="info@company.lk"
                        value={companyData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="epf_number">EPF Registration No.</Label>
                      <Input
                        id="epf_number"
                        name="epf_number"
                        placeholder="EPF/W/12345"
                        value={companyData.epf_number}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="etf_number">ETF Registration No.</Label>
                      <Input
                        id="etf_number"
                        name="etf_number"
                        placeholder="ETF/W/12345"
                        value={companyData.etf_number}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={handleNextStep}
                      disabled={!companyData.name.trim()}
                      className="w-full h-12 text-base"
                    >
                      Choose Your Plan
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold">Choose Your Plan</h2>
                <p className="text-muted-foreground mt-2">
                  Start free and upgrade anytime as your team grows
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {(Object.entries(planDetails) as [PlanType, PlanDetails][]).map(([planType, plan]) => (
                  <motion.div
                    key={planType}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedPlan(planType)}
                  >
                    <Card 
                      className={cn(
                        "relative cursor-pointer transition-all h-full",
                        selectedPlan === planType 
                          ? "border-2 border-primary shadow-lg" 
                          : "border hover:border-primary/50",
                        plan.popular && "ring-2 ring-amber-500/20"
                      )}
                    >
                      {plan.popular && (
                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500">
                          <Crown className="h-3 w-3 mr-1" />
                          Most Popular
                        </Badge>
                      )}
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5" />
                          {plan.name}
                        </CardTitle>
                        <div className="flex items-baseline gap-1 mt-2">
                          <span className="text-3xl font-bold">${plan.price}</span>
                          <span className="text-muted-foreground">/month</span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <ul className="space-y-2">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <Check className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        {selectedPlan === planType && (
                          <div className="flex items-center justify-center pt-2">
                            <Badge variant="default" className="bg-primary">
                              <Check className="h-3 w-3 mr-1" />
                              Selected
                            </Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <div className="flex justify-center gap-4 mt-8">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  onClick={handleCreateCompany}
                  disabled={isSubmitting}
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating Company...
                    </>
                  ) : (
                    <>
                      {selectedPlan === "free" ? "Start Free" : "Start Trial"}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground pt-4">
                {selectedPlan !== "free" 
                  ? "Start with a 14-day free trial. No credit card required." 
                  : "You can upgrade anytime from your account settings."}
              </p>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-lg mx-auto"
            >
              <Card className="border-2 border-green-500/20 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                <CardContent className="pt-8 pb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500"
                  >
                    <CheckCircle2 className="h-10 w-10 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">
                    You're All Set!
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Your company has been created on the <strong>{planDetails[selectedPlan].name}</strong> plan.
                  </p>
                  <p className="text-muted-foreground mb-6">
                    You are now the admin and can start adding employees.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4" />
                    <span>Redirecting to dashboard...</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
