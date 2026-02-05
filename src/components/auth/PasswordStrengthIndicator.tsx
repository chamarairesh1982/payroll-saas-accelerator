import { useMemo } from "react";
import { getPasswordStrength, validatePassword } from "@/lib/password-validation";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

export function PasswordStrengthIndicator({
  password,
  showRequirements = true,
}: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const validation = useMemo(() => validatePassword(password), [password]);

  const requirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One lowercase letter", met: /[a-z]/.test(password) },
    { label: "One number", met: /[0-9]/.test(password) },
  ];

  const strengthColors = {
    weak: "bg-destructive",
    fair: "bg-orange-500",
    good: "bg-yellow-500",
    strong: "bg-green-500",
  };

  const strengthWidths = {
    weak: "w-1/4",
    fair: "w-2/4",
    good: "w-3/4",
    strong: "w-full",
  };

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2">
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span
            className={cn(
              "font-medium capitalize",
              strength.label === "weak" && "text-destructive",
              strength.label === "fair" && "text-orange-500",
              strength.label === "good" && "text-yellow-600",
              strength.label === "strong" && "text-green-600"
            )}
          >
            {strength.label}
          </span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300",
              strengthColors[strength.label],
              strengthWidths[strength.label]
            )}
          />
        </div>
      </div>

      {/* Requirements list */}
      {showRequirements && (
        <ul className="space-y-1 text-xs">
          {requirements.map((req) => (
            <li
              key={req.label}
              className={cn(
                "flex items-center gap-1.5",
                req.met ? "text-green-600" : "text-muted-foreground"
              )}
            >
              {req.met ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              {req.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
