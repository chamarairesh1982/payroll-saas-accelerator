-- Create subscription plan enum
CREATE TYPE public.subscription_plan AS ENUM ('free', 'pro', 'enterprise');

-- Create subscription status enum
CREATE TYPE public.subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing');

-- Add subscription fields to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS subscription_plan public.subscription_plan DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status public.subscription_status DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subscription_started_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS subscription_ends_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS max_employees integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- Create subscription_plans table for plan configuration
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  plan_type public.subscription_plan NOT NULL UNIQUE,
  price_monthly numeric(10,2) NOT NULL DEFAULT 0,
  price_yearly numeric(10,2) NOT NULL DEFAULT 0,
  max_employees integer NOT NULL DEFAULT 5,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Everyone can read subscription plans (public pricing)
CREATE POLICY "Anyone can view subscription plans"
ON public.subscription_plans FOR SELECT
USING (true);

-- Only super admins can modify subscription plans
CREATE POLICY "Super admins can manage subscription plans"
ON public.subscription_plans FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, plan_type, price_monthly, price_yearly, max_employees, features)
VALUES 
  ('Free', 'free', 0, 0, 5, '["Up to 5 employees", "Basic payroll processing", "EPF/ETF calculations", "Email support"]'::jsonb),
  ('Pro', 'pro', 29.99, 299.99, 50, '["Up to 50 employees", "Advanced payroll processing", "Leave & attendance management", "Loan management", "Custom reports", "Priority support"]'::jsonb),
  ('Enterprise', 'enterprise', 99.99, 999.99, -1, '["Unlimited employees", "Full feature access", "API access", "Custom integrations", "Dedicated support", "SLA guarantee"]'::jsonb);

-- Create platform_stats table for super admin dashboard
CREATE TABLE public.platform_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date date NOT NULL UNIQUE DEFAULT CURRENT_DATE,
  total_companies integer DEFAULT 0,
  active_companies integer DEFAULT 0,
  total_users integer DEFAULT 0,
  total_employees integer DEFAULT 0,
  mrr numeric(12,2) DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_stats ENABLE ROW LEVEL SECURITY;

-- Only super admins can view/manage platform stats
CREATE POLICY "Super admins can manage platform stats"
ON public.platform_stats FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- Create function to check if company can add more employees
CREATE OR REPLACE FUNCTION public.can_add_employee(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN c.max_employees = -1 THEN true
      ELSE (
        SELECT COUNT(*)::integer FROM profiles WHERE company_id = p_company_id
      ) < c.max_employees
    END
  FROM companies c
  WHERE c.id = p_company_id;
$$;

-- Create trigger to update updated_at on subscription_plans
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();