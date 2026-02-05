import { useState } from "react";
import { Building2, Users, DollarSign, Clock, Briefcase, Plus, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useMultiCompany } from "@/hooks/useMultiCompany";
import { CompanySwitcher } from "./CompanySwitcher";
import { AddSubsidiaryModal } from "./AddSubsidiaryModal";
import { cn } from "@/lib/utils";

export function MultiCompanyDashboard() {
  const { companies, stats, hasMultipleCompanies, canAddSubsidiary, isLoading, subsidiaries } = useMultiCompany();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasMultipleCompanies && subsidiaries.length === 0 && !canAddSubsidiary) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header with Company Switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Multi-Company Overview</h2>
          <p className="text-muted-foreground">
            Manage all your companies and subsidiaries from one dashboard
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasMultipleCompanies && (
            <div className="w-64">
              <CompanySwitcher
                selectedCompanyId={selectedCompanyId}
                onCompanyChange={setSelectedCompanyId}
              />
            </div>
          )}
          {canAddSubsidiary && (
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4" />
              Add Subsidiary
            </Button>
          )}
        </div>
      </div>

      {/* Aggregated Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_companies}</div>
              <p className="text-xs text-muted-foreground">
                Including subsidiaries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_employees}</div>
              <p className="text-xs text-muted-foreground">
                Active across all companies
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payroll Processed</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.total_payroll_processed)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total paid out
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Leave</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending_leave_requests}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Loans</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending_loan_approvals}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Separator />

      {/* Company List */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Your Companies</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Card
              key={company.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                selectedCompanyId === company.id && "ring-2 ring-primary"
              )}
              onClick={() => setSelectedCompanyId(company.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{company.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs capitalize",
                          company.subscription_plan === "enterprise"
                            ? "bg-amber-500/10 text-amber-600"
                            : company.subscription_plan === "pro"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted"
                        )}
                      >
                        {company.subscription_plan || "free"}
                      </Badge>
                      {company.parent_company_id && (
                        <Badge variant="secondary" className="text-xs">
                          Subsidiary
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Employees</span>
                  <span className="font-medium">{company.employee_count || 0}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Add Subsidiary Modal */}
      <AddSubsidiaryModal open={showAddModal} onOpenChange={setShowAddModal} />
    </div>
  );
}
