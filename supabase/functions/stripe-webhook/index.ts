import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get Stripe keys from platform settings
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from("platform_settings")
      .select("key, value")
      .in("key", ["stripe_secret_key", "stripe_webhook_secret"]);

    if (settingsError || !settings || settings.length < 2) {
      console.error("Stripe settings not configured:", settingsError);
      return new Response(
        JSON.stringify({ error: "Stripe is not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripeSecretKey = settings.find((s) => s.key === "stripe_secret_key")?.value;
    const webhookSecret = settings.find((s) => s.key === "stripe_webhook_secret")?.value;

    if (!stripeSecretKey || !webhookSecret) {
      console.error("Missing Stripe configuration");
      return new Response(
        JSON.stringify({ error: "Stripe keys not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Verify webhook signature
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("Missing Stripe signature");
      return new Response(
        JSON.stringify({ error: "Missing Stripe signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Webhook signature verification failed:", errMessage);
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${errMessage}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Received Stripe event:", event.type);

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout session completed:", session.id);

        const companyId = session.metadata?.company_id;
        const planType = session.metadata?.plan_type;
        const subscriptionId = session.subscription as string;

        if (companyId && planType && subscriptionId) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);

          // Get plan details for max_employees
          const { data: plan } = await supabaseAdmin
            .from("subscription_plans")
            .select("max_employees")
            .eq("plan_type", planType)
            .single();

          // Update company subscription
          const { error: updateError } = await supabaseAdmin
            .from("companies")
            .update({
              subscription_plan: planType,
              subscription_status: "active",
              stripe_subscription_id: subscriptionId,
              subscription_started_at: new Date().toISOString(),
              subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
              max_employees: plan?.max_employees || 5,
            })
            .eq("id", companyId);

          if (updateError) {
            console.error("Error updating company:", updateError);
          } else {
            console.log(`Company ${companyId} upgraded to ${planType}`);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription updated:", subscription.id);

        // Find company by subscription ID
        const { data: company, error: findError } = await supabaseAdmin
          .from("companies")
          .select("id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (findError || !company) {
          console.error("Company not found for subscription:", subscription.id);
          break;
        }

        // Map Stripe status to our status
        let subscriptionStatus: "active" | "canceled" | "past_due" | "trialing" = "active";
        if (subscription.status === "canceled" || subscription.status === "incomplete_expired") {
          subscriptionStatus = "canceled";
        } else if (subscription.status === "past_due" || subscription.status === "unpaid") {
          subscriptionStatus = "past_due";
        } else if (subscription.status === "trialing") {
          subscriptionStatus = "trialing";
        }

        // Update company
        const { error: updateError } = await supabaseAdmin
          .from("companies")
          .update({
            subscription_status: subscriptionStatus,
            subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("id", company.id);

        if (updateError) {
          console.error("Error updating subscription:", updateError);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription deleted:", subscription.id);

        // Find company by subscription ID
        const { data: company, error: findError } = await supabaseAdmin
          .from("companies")
          .select("id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (findError || !company) {
          console.error("Company not found for subscription:", subscription.id);
          break;
        }

        // Downgrade to free plan
        const { data: freePlan } = await supabaseAdmin
          .from("subscription_plans")
          .select("max_employees")
          .eq("plan_type", "free")
          .single();

        const { error: updateError } = await supabaseAdmin
          .from("companies")
          .update({
            subscription_plan: "free",
            subscription_status: "canceled",
            stripe_subscription_id: null,
            subscription_ends_at: null,
            max_employees: freePlan?.max_employees || 5,
          })
          .eq("id", company.id);

        if (updateError) {
          console.error("Error downgrading company:", updateError);
        } else {
          console.log(`Company ${company.id} downgraded to free`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Payment failed for invoice:", invoice.id);

        const subscriptionId = invoice.subscription as string;
        if (subscriptionId) {
          // Find company and update status
          const { data: company } = await supabaseAdmin
            .from("companies")
            .select("id")
            .eq("stripe_subscription_id", subscriptionId)
            .single();

          if (company) {
            await supabaseAdmin
              .from("companies")
              .update({ subscription_status: "past_due" })
              .eq("id", company.id);
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Payment succeeded for invoice:", invoice.id);

        const subscriptionId = invoice.subscription as string;
        if (subscriptionId) {
          // Find company and update status
          const { data: company } = await supabaseAdmin
            .from("companies")
            .select("id")
            .eq("stripe_subscription_id", subscriptionId)
            .single();

          if (company) {
            await supabaseAdmin
              .from("companies")
              .update({ subscription_status: "active" })
              .eq("id", company.id);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Webhook handler failed";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
