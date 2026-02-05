import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Building2, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useCompany } from "@/hooks/useCompany";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const Company = () => {
  const { company, isLoading, updateCompany, isUpdating } = useCompany();
  const { isAdmin } = useAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    registration_number: "",
    epf_number: "",
    etf_number: "",
    address: "",
    phone: "",
    email: "",
    bank_name: "",
    bank_branch: "",
    bank_account_number: "",
  });

  // Populate form when company data loads
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        registration_number: company.registration_number || "",
        epf_number: company.epf_number || "",
        etf_number: company.etf_number || "",
        address: company.address || "",
        phone: company.phone || "",
        email: company.email || "",
        bank_name: company.bank_name || "",
        bank_branch: company.bank_branch || "",
        bank_account_number: company.bank_account_number || "",
      });
    }
  }, [company]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error("Company name is required");
      return;
    }
    updateCompany(formData);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="page-header">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72 mt-2" />
          </div>
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl bg-card p-6 shadow-sm">
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="grid gap-6 sm:grid-cols-2">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            </div>
          ))}
        </div>
      </MainLayout>
    );
  }

  if (!company) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center rounded-xl bg-card py-20 shadow-sm">
          <Building2 className="h-16 w-16 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No Company Found</h3>
          <p className="text-muted-foreground text-center max-w-md">
            You need to create or join a company first.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Company Settings</h1>
          <p className="page-description">Manage your organization details and EPF/ETF registration.</p>
        </div>
        {isAdmin && (
          <Button size="lg" onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Save Changes
              </>
            )}
          </Button>
        )}
      </div>

      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-card p-6 shadow-sm"
        >
          <h3 className="mb-4 font-display text-lg font-semibold">Company Information</h3>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!isAdmin}
                placeholder="ABC Company (Pvt) Ltd"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registration_number">Business Registration Number</Label>
              <Input
                id="registration_number"
                name="registration_number"
                value={formData.registration_number}
                onChange={handleChange}
                disabled={!isAdmin}
                placeholder="PV12345"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!isAdmin}
                placeholder="123 Galle Road, Colombo 03"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isAdmin}
                placeholder="+94 11 234 5678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isAdmin}
                placeholder="info@company.lk"
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl bg-card p-6 shadow-sm"
        >
          <h3 className="mb-4 font-display text-lg font-semibold">EPF/ETF Registration</h3>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="epf_number">EPF Registration Number</Label>
              <Input
                id="epf_number"
                name="epf_number"
                value={formData.epf_number}
                onChange={handleChange}
                disabled={!isAdmin}
                placeholder="EPF/W/12345"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="etf_number">ETF Registration Number</Label>
              <Input
                id="etf_number"
                name="etf_number"
                value={formData.etf_number}
                onChange={handleChange}
                disabled={!isAdmin}
                placeholder="ETF/W/12345"
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl bg-card p-6 shadow-sm"
        >
          <h3 className="mb-4 font-display text-lg font-semibold">Bank Details</h3>
          <p className="text-sm text-muted-foreground mb-4">
            These details are used for statutory payment references (EPF/ETF/PAYE submissions).
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="bank_name">Bank Name</Label>
              <Input
                id="bank_name"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleChange}
                disabled={!isAdmin}
                placeholder="Commercial Bank"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_branch">Branch</Label>
              <Input
                id="bank_branch"
                name="bank_branch"
                value={formData.bank_branch}
                onChange={handleChange}
                disabled={!isAdmin}
                placeholder="Colombo Fort"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_account_number">Account Number</Label>
              <Input
                id="bank_account_number"
                name="bank_account_number"
                value={formData.bank_account_number}
                onChange={handleChange}
                disabled={!isAdmin}
                placeholder="1234567890"
              />
            </div>
          </div>
        </motion.div>

        {!isAdmin && (
          <div className="rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground">
            Only administrators can edit company settings.
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Company;
