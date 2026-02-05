import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type PlanType = "free" | "pro" | "enterprise";

export const useStripeCheckout = () => {
  const [isLoading, setIsLoading] = useState(false);

  const createCheckoutSession = async (planType: PlanType) => {
    if (planType === "free") {
      toast.error("Cannot checkout for free plan");
      return;
    }

    setIsLoading(true);

    try {
      const successUrl = `${window.location.origin}/settings?subscription=success`;
      const cancelUrl = `${window.location.origin}/settings?subscription=canceled`;

      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          plan_type: planType,
          success_url: successUrl,
          cancel_url: cancelUrl,
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to create checkout session");
      }

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else if (data?.error) {
        throw new Error(data.error);
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to start checkout");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createCheckoutSession,
    isLoading,
  };
};
