import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Building2, Plus, Search, MoreVertical, Users, Calendar } from "lucide-react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CompanySetupWizard } from "@/components/company/CompanySetupWizard";
import { format } from "date-fns";

const Companies = () => {
  const { role } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);

  const isSuperAdmin = role === "super_admin";

  const { data: companies = [], isLoading, refetch } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isSuperAdmin,
  });

  // Get employee counts for each company
  const { data: employeeCounts = {} } = useQuery({
    queryKey: ["company-employee-counts"],
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
    enabled: isSuperAdmin,
  });

  const filteredCompanies = companies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isSuperAdmin) {
    return (
      <MainLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">
              Only super admins can manage companies.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Companies</h1>
          <p className="page-description">
            Manage all registered companies in the system.
          </p>
        </div>
        <Button size="lg" onClick={() => setWizardOpen(true)}>
          <Plus className="h-5 w-5" />
          New Company
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-card p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{companies.length}</p>
              <p className="text-sm text-muted-foreground">Total Companies</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl bg-card p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2">
              <Building2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {companies.filter((c) => c.is_active).length}
              </p>
              <p className="text-sm text-muted-foreground">Active Companies</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl bg-card p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {Object.values(employeeCounts).reduce((a, b) => a + b, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Employees</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
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
              <TableHead>Registration</TableHead>
              <TableHead>EPF/ETF</TableHead>
              <TableHead>Employees</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Loading companies...
                </TableCell>
              </TableRow>
            ) : filteredCompanies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No companies found
                </TableCell>
              </TableRow>
            ) : (
              filteredCompanies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{company.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {company.email || "No email"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {company.registration_number || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>EPF: {company.epf_number || "-"}</p>
                      <p>ETF: {company.etf_number || "-"}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {employeeCounts[company.id] || 0} employees
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={company.is_active ? "default" : "secondary"}
                    >
                      {company.is_active ? "Active" : "Inactive"}
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
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit Company</DropdownMenuItem>
                        <DropdownMenuItem>Manage Users</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Deactivate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </motion.div>

      <CompanySetupWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onComplete={refetch}
      />
    </MainLayout>
  );
};

export default Companies;
