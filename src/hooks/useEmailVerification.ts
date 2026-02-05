import { useAuth } from "@/contexts/AuthContext";

export interface EmailVerificationStatus {
  isVerified: boolean;
  email: string | null;
}

export function useEmailVerification(): EmailVerificationStatus {
  const { user } = useAuth();

  // User's email is verified if email_confirmed_at is set
  const isVerified = !!user?.email_confirmed_at;
  const email = user?.email ?? null;

  return { isVerified, email };
}
