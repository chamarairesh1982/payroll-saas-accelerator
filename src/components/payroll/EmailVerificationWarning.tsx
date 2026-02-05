import { Mail, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

interface EmailVerificationWarningProps {
  email: string | null;
}

export function EmailVerificationWarning({ email }: EmailVerificationWarningProps) {
  const [isResending, setIsResending] = useState(false);

  const handleResendVerification = async () => {
    if (!email) return;
    
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      
      if (error) throw error;
      toast.success("Verification email sent! Please check your inbox.");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend verification email");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Email Not Verified</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-sm text-muted-foreground">
          Your email address <strong>{email}</strong> has not been verified. 
          Email verification is required before you can approve payroll runs.
        </p>
        <p className="text-sm text-muted-foreground">
          This is a security measure to prevent unauthorized payroll processing and 
          ensure compliance with financial regulations.
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleResendVerification}
          disabled={isResending}
          className="mt-2"
        >
          <Mail className="mr-2 h-4 w-4" />
          {isResending ? "Sending..." : "Resend Verification Email"}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
