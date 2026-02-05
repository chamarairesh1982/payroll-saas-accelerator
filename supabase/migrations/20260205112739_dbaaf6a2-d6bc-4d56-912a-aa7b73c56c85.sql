-- Create platform settings table for super admin configuration
CREATE TABLE public.platform_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  is_secret BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Only super admins can view/edit platform settings
CREATE POLICY "Super admins can view platform settings"
  ON public.platform_settings
  FOR SELECT
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert platform settings"
  ON public.platform_settings
  FOR INSERT
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update platform settings"
  ON public.platform_settings
  FOR UPDATE
  USING (public.is_super_admin(auth.uid()));

-- Insert default settings
INSERT INTO public.platform_settings (key, value, description, is_secret) VALUES
  ('stripe_secret_key', '', 'Stripe Secret API Key for payment processing', true),
  ('stripe_publishable_key', '', 'Stripe Publishable API Key', false),
  ('stripe_webhook_secret', '', 'Stripe Webhook Signing Secret', true);

-- Add trigger for updated_at
CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Super admins can manage all user roles across companies
CREATE POLICY "Super admins can view all user roles"
  ON public.user_roles
  FOR SELECT
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert any user role"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update any user role"
  ON public.user_roles
  FOR UPDATE
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete any user role"
  ON public.user_roles
  FOR DELETE
  USING (public.is_super_admin(auth.uid()));