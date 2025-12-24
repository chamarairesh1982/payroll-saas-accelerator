-- Create user role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'hr', 'manager', 'employee');

-- Create companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  registration_number TEXT,
  epf_number TEXT,
  etf_number TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  bank_name TEXT,
  bank_branch TEXT,
  bank_account_number TEXT,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  employee_number TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  nic TEXT,
  date_of_birth DATE,
  avatar_url TEXT,
  department TEXT,
  designation TEXT,
  employment_type TEXT DEFAULT 'permanent',
  status TEXT DEFAULT 'active',
  bank_name TEXT,
  bank_branch TEXT,
  bank_account_number TEXT,
  epf_number TEXT,
  basic_salary NUMERIC DEFAULT 0,
  date_of_joining DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'employee',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID, p_company_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles 
  WHERE user_id = p_user_id AND company_id = p_company_id
  LIMIT 1
$$;

-- Security definer function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(p_user_id UUID, p_role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_user_id AND role = p_role
  )
$$;

-- Security definer function to get user's company_id
CREATE OR REPLACE FUNCTION public.get_user_company_id(p_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.user_roles 
  WHERE user_id = p_user_id
  LIMIT 1
$$;

-- RLS Policies for companies
CREATE POLICY "Users can view their own company"
ON public.companies FOR SELECT
TO authenticated
USING (
  id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid())
);

CREATE POLICY "Super admins can manage all companies"
ON public.companies FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view profiles in their company"
ON public.profiles FOR SELECT
TO authenticated
USING (
  company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid())
  OR id = auth.uid()
);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Admins and HR can manage profiles in their company"
ON public.profiles FOR ALL
TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND public.get_user_role(auth.uid(), company_id) IN ('admin', 'hr', 'super_admin')
)
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid())
  AND public.get_user_role(auth.uid(), company_id) IN ('admin', 'hr', 'super_admin')
);

-- RLS Policies for user_roles
CREATE POLICY "Users can view roles in their company"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can manage roles in their company"
ON public.user_roles FOR ALL
TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND public.get_user_role(auth.uid(), company_id) IN ('admin', 'super_admin')
)
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid())
  AND public.get_user_role(auth.uid(), company_id) IN ('admin', 'super_admin')
);

-- Function to handle new user creation (creates profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();