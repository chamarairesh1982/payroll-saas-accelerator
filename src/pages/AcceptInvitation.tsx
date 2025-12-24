import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Building, Mail, Loader2, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Invitation {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  department: string | null;
  designation: string | null;
  company_id: string;
}

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) {
        setError("Invalid invitation link");
        setIsLoading(false);
        return;
      }

      try {
        // Fetch invitation details
        const { data: invData, error: invError } = await supabase
          .from("employee_invitations")
          .select("*")
          .eq("token", token)
          .eq("status", "pending")
          .gt("expires_at", new Date().toISOString())
          .single();

        if (invError || !invData) {
          setError("This invitation is invalid or has expired");
          setIsLoading(false);
          return;
        }

        setInvitation(invData as Invitation);

        // Fetch company name
        const { data: companyData } = await supabase
          .from("companies")
          .select("name")
          .eq("id", invData.company_id)
          .single();

        if (companyData) {
          setCompanyName(companyData.name);
        }
      } catch (err) {
        setError("Failed to load invitation");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("accept-invitation", {
        body: { token, password },
      });

      if (error || data?.error) {
        toast.error(data?.error || error?.message || "Failed to accept invitation");
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      toast.success("Account created successfully!");

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/auth");
      }, 2000);
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl bg-card p-8 text-center shadow-xl"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="mb-2 text-2xl font-bold">Invitation Invalid</h1>
          <p className="mb-6 text-muted-foreground">{error}</p>
          <Button onClick={() => navigate("/auth")}>Go to Login</Button>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-2xl bg-card p-8 text-center shadow-xl"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <h1 className="mb-2 text-2xl font-bold">Welcome Aboard!</h1>
          <p className="mb-4 text-muted-foreground">
            Your account has been created successfully.
          </p>
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl bg-card p-8 shadow-xl"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Building className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Join {companyName}</h1>
          <p className="mt-2 text-muted-foreground">
            Complete your account setup to get started
          </p>
        </div>

        <div className="mb-6 rounded-lg bg-muted/50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {invitation?.first_name?.[0]}
              {invitation?.last_name?.[0]}
            </div>
            <div>
              <p className="font-medium">
                {invitation?.first_name} {invitation?.last_name}
              </p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Mail className="h-3 w-3" />
                {invitation?.email}
              </div>
            </div>
          </div>
          {(invitation?.designation || invitation?.department) && (
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              {invitation?.designation && (
                <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                  {invitation.designation}
                </span>
              )}
              {invitation?.department && (
                <span className="rounded-full bg-muted px-3 py-1">
                  {invitation.department}
                </span>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Create Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a secure password"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/auth")}
            className="text-primary hover:underline"
          >
            Sign in
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default AcceptInvitation;
