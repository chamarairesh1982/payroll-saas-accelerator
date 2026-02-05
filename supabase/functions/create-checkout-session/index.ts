import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create admin client for platform settings
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get Stripe key from platform settings
    const { data: stripeSettings, error: settingsError } = await supabaseAdmin
      .from("platform_settings")
      .select("value")
      .eq("key", "stripe_secret_key")
      .single();

    if (settingsError || !stripeSettings?.value) {
      console.error("Stripe not configured:", settingsError);
      return new Response(
        JSON.stringify({ error: "Stripe is not configured. Please contact support." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSettings.value, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user client to get current user
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get request body
    const { plan_type, success_url, cancel_url } = await req.json();

    if (!plan_type || !success_url || !cancel_url) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: plan_type, success_url, cancel_url" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's profile and company
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return new Response(
        JSON.stringify({ error: "Company not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get company details
    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .select("id, name, email, stripe_customer_id")
      .eq("id", profile.company_id)
      .single();

    if (companyError || !company) {
      return new Response(
        JSON.stringify({ error: "Company not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get subscription plan details
    const { data: plan, error: planError } = await supabaseAdmin
      .from("subscription_plans")
      .select("*")
      .eq("plan_type", plan_type)
      .eq("is_active", true)
      .single();

    if (planError || !plan) {
      return new Response(
        JSON.stringify({ error: "Invalid subscription plan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get or create Stripe customer
    let customerId = company.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: company.email || user.email,
        name: company.name,
        metadata: {
          company_id: company.id,
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Update company with Stripe customer ID
      await supabaseAdmin
        .from("companies")
        .update({ stripe_customer_id: customerId })
        .eq("id", company.id);
    }

    // Create or get price in Stripe
    // First, check if we have a product for this plan
    const products = await stripe.products.list({
      active: true,
      limit: 100,
    });

    let product = products.data.find(
      (p: Stripe.Product) => p.metadata.plan_type === plan_type
    );

    if (!product) {
      // Create product
      product = await stripe.products.create({
        name: plan.name,
        metadata: {
          plan_type: plan_type,
          supabase_plan_id: plan.id,
        },
      });
    }

    // Get or create price
    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
      limit: 10,
    });

    let price = prices.data.find(
      (p: Stripe.Price) =>
        p.unit_amount === Math.round(plan.price_monthly * 100) &&
        p.recurring?.interval === "month"
    );

    if (!price) {
      // Create price
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(plan.price_monthly * 100),
        currency: "usd",
        recurring: { interval: "month" },
        metadata: {
          plan_type: plan_type,
        },
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      success_url: success_url,
      cancel_url: cancel_url,
      subscription_data: {
        metadata: {
          company_id: company.id,
          plan_type: plan_type,
        },
      },
      metadata: {
        company_id: company.id,
        plan_type: plan_type,
      },
    });

    console.log("Checkout session created:", session.id);

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error creating checkout session:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create checkout session";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
