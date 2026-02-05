import { AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CompanyProfileCompleteness } from "@/hooks/useCompanyProfileCompleteness";

interface CompanyProfileWarningProps {
  completeness: CompanyProfileCompleteness;
  showProgress?: boolean;
}

export function CompanyProfileWarning({ completeness, showProgress = true }: CompanyProfileWarningProps) {
  const { isPayrollReady, requiredMissing, completionPercentage } = completeness;

  if (isPayrollReady) {
    return null;
  }

  return (
    <Alert variant="destructive" className="border-warning/50 bg-warning/10 text-warning-foreground">
      <AlertTriangle className="h-4 w-4 !text-warning" />
      <AlertTitle className="text-warning">Company Profile Incomplete</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-sm text-muted-foreground">
          Complete your company profile before processing payroll. The following required fields are missing:
        </p>
        <ul className="grid gap-1 text-sm">
          {requiredMissing.map((field) => (
            <li key={field.field} className="flex items-center gap-2 text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-warning" />
              {field.label}
            </li>
          ))}
        </ul>
        {showProgress && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Profile Completion</span>
              <span>{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        )}
        <Button variant="outline" size="sm" asChild className="mt-2">
          <Link to="/company">
            Complete Profile
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
