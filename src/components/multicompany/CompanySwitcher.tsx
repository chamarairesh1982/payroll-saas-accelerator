import { useState } from "react";
import { Building2, ChevronDown, Check, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useMultiCompany } from "@/hooks/useMultiCompany";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface CompanySwitcherProps {
  onCompanyChange?: (companyId: string) => void;
  selectedCompanyId?: string | null;
  showAllOption?: boolean;
}

export function CompanySwitcher({
  onCompanyChange,
  selectedCompanyId,
  showAllOption = true,
}: CompanySwitcherProps) {
  const { profile } = useAuth();
  const { companies, hasMultipleCompanies, accessibleCompanies } = useMultiCompany();
  const [isOpen, setIsOpen] = useState(false);

  if (!hasMultipleCompanies) return null;

  const currentCompany = selectedCompanyId
    ? companies.find((c) => c.id === selectedCompanyId)
    : null;

  const handleSelect = (companyId: string | null) => {
    onCompanyChange?.(companyId || "");
    setIsOpen(false);
  };

  const getCompanyLabel = (companyId: string) => {
    const access = accessibleCompanies.find((ac) => ac.company_id === companyId);
    return access?.is_subsidiary ? "Subsidiary" : "Parent";
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {selectedCompanyId === null || selectedCompanyId === ""
                ? "All Companies"
                : currentCompany?.name || "Select Company"}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-amber-500" />
          Multi-Company View
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {showAllOption && (
          <>
            <DropdownMenuItem
              onClick={() => handleSelect(null)}
              className="cursor-pointer"
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>All Companies</span>
                </div>
                {(selectedCompanyId === null || selectedCompanyId === "") && (
                  <Check className="h-4 w-4" />
                )}
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {companies.map((company) => (
          <DropdownMenuItem
            key={company.id}
            onClick={() => handleSelect(company.id)}
            className="cursor-pointer"
          >
            <div className="flex w-full items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{company.name}</span>
                  {company.id === profile?.company_id && (
                    <Badge variant="secondary" className="text-xs">
                      Current
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      company.parent_company_id
                        ? "bg-blue-500/10 text-blue-600"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    {getCompanyLabel(company.id)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {company.employee_count} employees
                  </span>
                </div>
              </div>
              {selectedCompanyId === company.id && (
                <Check className="h-4 w-4 shrink-0" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
