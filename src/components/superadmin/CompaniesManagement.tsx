import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Building2, 
  Search, 
  MoreVertical, 
  Users, 
  Calendar, 
  Crown, 
  CheckCircle,
  XCircle,
  ArrowUpCircle,
  Link2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";

const planConfig = {
  free: { label: "Free", color: "bg-slate-500", icon: Building2 },
  pro: { label: "Pro", color: "bg-blue-500", icon: Crown },
  enterprise: { label: "Enterprise", color: "bg-amber-500", icon: Crown },
};

const statusConfig = {
  active: { label: "Active", variant: "default" as const, icon: CheckCircle },
  canceled: { label: "Canceled", variant: "secondary" as const, icon: XCircle },
  past_due: { label: "Past Due", variant: "destructive" as const, icon: XCircle },
  trialing: { label: "Trial", variant: "outline" as const, icon: ArrowUpCircle },
};

export function CompaniesManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [upgradeCompany, setUpgradeCompany] = useState<any>(null);
  const [linkSubsidiaryCompany, setLinkSubsidiaryCompany] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [selectedParentId, setSelectedParentId] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["admin-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: employeeCounts = {} } = useQuery({
    queryKey: ["admin-employee-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("company_id");

      if (error) throw error;

      const counts: Record<string, number> = {};
      data.forEach((profile) => {
        if (profile.company_id) {
          counts[profile.company_id] = (counts[profile.company_id] || 0) + 1;
        }
      });
      return counts;
    },
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;
      return data;
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ companyId, plan }: { companyId: string; plan: "free" | "pro" | "enterprise" }) => {
      const planDetails = plans.find(p => p.plan_type === plan);
      
      const { error } = await supabase
        .from("companies")
        .update({ 
          subscription_plan: plan as "free" | "pro" | "enterprise",
          max_employees: planDetails?.max_employees || 5,
        })
        .eq("id", companyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
      toast.success("Company plan updated successfully");
      setUpgradeCompany(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update plan");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ companyId, isActive }: { companyId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("companies")
        .update({ is_active: isActive })
        .eq("id", companyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      toast.success("Company status updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  const linkSubsidiaryMutation = useMutation({
    mutationFn: async ({ companyId, parentCompanyId }: { companyId: string; parentCompanyId: string | null }) => {
      const { error } = await supabase
        .from("companies")
        .update({ parent_company_id: parentCompanyId })
        .eq("id", companyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
      toast.success("Subsidiary relationship updated");
      setLinkSubsidiaryCompany(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update subsidiary");
    },
  });

  // Get enterprise companies that can be parents
  const enterpriseCompanies = companies.filter(
    (c) => c.subscription_plan === "enterprise" && c.is_active
  );

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch = 
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = planFilter === "all" || company.subscription_plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Companies Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-card shadow-sm"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Employees</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCompanies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No companies found
                </TableCell>
              </TableRow>
            ) : (
              filteredCompanies.map((company) => {
                const plan = planConfig[company.subscription_plan as keyof typeof planConfig] || planConfig.free;
                const status = statusConfig[company.subscription_status as keyof typeof statusConfig] || statusConfig.active;
                const PlanIcon = plan.icon;
                const StatusIcon = status.icon;

                return (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{company.name}</p>
                          {company.parent_company_id && (
                            <Badge variant="outline" className="text-xs">
                              Subsidiary
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {company.email || "No email"}
                          {company.parent_company_id && (
                            <span className="ml-2">
                              → {companies.find(c => c.id === company.parent_company_id)?.name}
                            </span>
                          )}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${plan.color} text-white`}>
                        <PlanIcon className="mr-1 h-3 w-3" />
                        {plan.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{employeeCounts[company.id] || 0}</span>
                        {company.max_employees !== -1 && (
                          <span className="text-muted-foreground">
                            / {company.max_employees}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {company.is_active ? status.label : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(company.created_at), "MMM d, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setUpgradeCompany(company);
                            setSelectedPlan(company.subscription_plan || "free");
                          }}>
                            <ArrowUpCircle className="mr-2 h-4 w-4" />
                            Change Plan
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            setLinkSubsidiaryCompany(company);
                            setSelectedParentId(company.parent_company_id || "none");
                          }}>
                            <Link2 className="mr-2 h-4 w-4" />
                            Link to Parent
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => toggleStatusMutation.mutate({ 
                              companyId: company.id, 
                              isActive: !company.is_active 
                            })}
                          >
                            {company.is_active ? (
                              <>
                                <XCircle className="mr-2 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </motion.div>

      {/* Change Plan Dialog */}
      <Dialog open={!!upgradeCompany} onOpenChange={() => setUpgradeCompany(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Subscription Plan</DialogTitle>
            <DialogDescription>
              Update the subscription plan for {upgradeCompany?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Plan</Label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.plan_type}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{plan.name}</span>
                        <span className="text-muted-foreground">
                          ${plan.price_monthly}/mo
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUpgradeCompany(null)}>
                Cancel
              </Button>
              <Button 
                onClick={() => updatePlanMutation.mutate({ 
                  companyId: upgradeCompany?.id, 
                  plan: selectedPlan as "free" | "pro" | "enterprise"
                })}
                disabled={updatePlanMutation.isPending}
              >
                Update Plan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Link Subsidiary Dialog */}
      <Dialog open={!!linkSubsidiaryCompany} onOpenChange={() => setLinkSubsidiaryCompany(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link to Parent Company</DialogTitle>
            <DialogDescription>
              Make {linkSubsidiaryCompany?.name} a subsidiary of an enterprise company.
              Only enterprise companies can have subsidiaries.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Parent Company</Label>
              <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a parent company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">No parent (standalone)</span>
                  </SelectItem>
                  {enterpriseCompanies
                    .filter(c => c.id !== linkSubsidiaryCompany?.id)
                    .map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <span className="font-medium">{company.name}</span>
                          <Badge className="bg-amber-500 text-white text-xs">Enterprise</Badge>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {enterpriseCompanies.filter(c => c.id !== linkSubsidiaryCompany?.id).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No enterprise companies available. Upgrade a company to Enterprise to enable subsidiaries.
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setLinkSubsidiaryCompany(null)}>
                Cancel
              </Button>
              <Button 
                onClick={() => linkSubsidiaryMutation.mutate({ 
                  companyId: linkSubsidiaryCompany?.id, 
                  parentCompanyId: selectedParentId === "none" ? null : selectedParentId
                })}
                disabled={linkSubsidiaryMutation.isPending}
              >
                {selectedParentId === "none" ? "Remove Link" : "Link Company"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
