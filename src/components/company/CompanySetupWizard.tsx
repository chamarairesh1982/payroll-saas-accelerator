import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, UserPlus, Check, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CompanySetupWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

interface CompanyData {
  name: string;
  registration_number: string;
  epf_number: string;
  etf_number: string;
  address: string;
  phone: string;
  email: string;
  bank_name: string;
  bank_branch: string;
  bank_account_number: string;
}

interface AdminData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

const steps = [
  { id: 1, title: "Company Details", icon: Building2 },
  { id: 2, title: "First Admin", icon: UserPlus },
  { id: 3, title: "Complete", icon: Check },
];

export function CompanySetupWizard({ open, onOpenChange, onComplete }: CompanySetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [companyData, setCompanyData] = useState<CompanyData>({
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
  
  const [adminData, setAdminData] = useState<AdminData>({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
  });

  const [createdCompanyId, setCreatedCompanyId] = useState<string | null>(null);

  const handleCompanyChange = (field: keyof CompanyData, value: string) => {
    setCompanyData(prev => ({ ...prev, [field]: value }));
  };

  const handleAdminChange = (field: keyof AdminData, value: string) => {
    setAdminData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!companyData.name.trim()) {
      toast.error("Company name is required");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!adminData.email.trim()) {
      toast.error("Admin email is required");
      return false;
    }
    if (!adminData.password || adminData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }
    if (!adminData.first_name.trim()) {
      toast.error("First name is required");
      return false;
    }
    if (!adminData.last_name.trim()) {
      toast.error("Last name is required");
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
      
      setIsSubmitting(true);
      try {
        // Create the company
        const { data: company, error: companyError } = await supabase
          .from("companies")
          .insert({
            name: companyData.name,
            registration_number: companyData.registration_number || null,
            epf_number: companyData.epf_number || null,
            etf_number: companyData.etf_number || null,
            address: companyData.address || null,
            phone: companyData.phone || null,
            email: companyData.email || null,
            bank_name: companyData.bank_name || null,
            bank_branch: companyData.bank_branch || null,
            bank_account_number: companyData.bank_account_number || null,
          })
          .select()
          .single();

        if (companyError) throw companyError;
        
        setCreatedCompanyId(company.id);
        setCurrentStep(2);
        toast.success("Company created successfully!");
      } catch (error: any) {
        console.error("Error creating company:", error);
        toast.error(error.message || "Failed to create company");
      } finally {
        setIsSubmitting(false);
      }
    } else if (currentStep === 2) {
      if (!validateStep2()) return;
      if (!createdCompanyId) {
        toast.error("Company not created yet");
        return;
      }
      
      setIsSubmitting(true);
      try {
        // Create the admin user with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: adminData.email,
          password: adminData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              first_name: adminData.first_name,
              last_name: adminData.last_name,
            },
          },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Failed to create user");

        // Update the profile with company_id
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            company_id: createdCompanyId,
            first_name: adminData.first_name,
            last_name: adminData.last_name,
          })
          .eq("id", authData.user.id);

        if (profileError) {
          console.error("Profile update error:", profileError);
        }

        // Assign admin role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: authData.user.id,
            company_id: createdCompanyId,
            role: "admin",
          });

        if (roleError) throw roleError;

        setCurrentStep(3);
        toast.success("Admin user created successfully!");
      } catch (error: any) {
        console.error("Error creating admin:", error);
        toast.error(error.message || "Failed to create admin user");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setCurrentStep(1);
    setCompanyData({
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
    setAdminData({
      email: "",
      password: "",
      first_name: "",
      last_name: "",
    });
    setCreatedCompanyId(null);
    onComplete();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Company Setup Wizard</DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                      currentStep >= step.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30 text-muted-foreground"
                    }`}
                  >
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className={`mt-2 text-xs font-medium ${
                    currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`mx-4 h-0.5 w-16 transition-colors ${
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Company Name *</Label>
                  <Input
                    value={companyData.name}
                    onChange={(e) => handleCompanyChange("name", e.target.value)}
                    placeholder="Enter company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Registration Number</Label>
                  <Input
                    value={companyData.registration_number}
                    onChange={(e) => handleCompanyChange("registration_number", e.target.value)}
                    placeholder="PV12345"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={companyData.email}
                    onChange={(e) => handleCompanyChange("email", e.target.value)}
                    placeholder="company@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>EPF Number</Label>
                  <Input
                    value={companyData.epf_number}
                    onChange={(e) => handleCompanyChange("epf_number", e.target.value)}
                    placeholder="EPF/12345"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ETF Number</Label>
                  <Input
                    value={companyData.etf_number}
                    onChange={(e) => handleCompanyChange("etf_number", e.target.value)}
                    placeholder="ETF/12345"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Address</Label>
                  <Input
                    value={companyData.address}
                    onChange={(e) => handleCompanyChange("address", e.target.value)}
                    placeholder="123 Main Street, City"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={companyData.phone}
                    onChange={(e) => handleCompanyChange("phone", e.target.value)}
                    placeholder="+94 11 234 5678"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="mb-4 font-medium">Bank Details</h4>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input
                      value={companyData.bank_name}
                      onChange={(e) => handleCompanyChange("bank_name", e.target.value)}
                      placeholder="Commercial Bank"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Branch</Label>
                    <Input
                      value={companyData.bank_branch}
                      onChange={(e) => handleCompanyChange("bank_branch", e.target.value)}
                      placeholder="Colombo Fort"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input
                      value={companyData.bank_account_number}
                      onChange={(e) => handleCompanyChange("bank_account_number", e.target.value)}
                      placeholder="1234567890"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <p className="text-muted-foreground">
                Create the first admin user for <strong>{companyData.name}</strong>. 
                This user will have full access to manage the company.
              </p>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input
                    value={adminData.first_name}
                    onChange={(e) => handleAdminChange("first_name", e.target.value)}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input
                    value={adminData.last_name}
                    onChange={(e) => handleAdminChange("last_name", e.target.value)}
                    placeholder="Doe"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Email Address *</Label>
                  <Input
                    type="email"
                    value={adminData.email}
                    onChange={(e) => handleAdminChange("email", e.target.value)}
                    placeholder="admin@company.com"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Temporary Password *</Label>
                  <Input
                    type="password"
                    value={adminData.password}
                    onChange={(e) => handleAdminChange("password", e.target.value)}
                    placeholder="Min. 6 characters"
                  />
                  <p className="text-xs text-muted-foreground">
                    The admin can change this password after logging in.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="py-8 text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Setup Complete!</h3>
              <p className="mb-6 text-muted-foreground">
                <strong>{companyData.name}</strong> has been created successfully with{" "}
                <strong>{adminData.email}</strong> as the admin user.
              </p>
              <div className="rounded-lg bg-muted/50 p-4 text-left">
                <h4 className="mb-2 font-medium">Next Steps:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• The admin user can now log in with their credentials</li>
                  <li>• Add employees and configure salary components</li>
                  <li>• Set up leave types and overtime rates</li>
                  <li>• Configure tax slabs for payroll processing</li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Actions */}
        <div className="flex justify-between border-t pt-4">
          {currentStep < 3 ? (
            <>
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || isSubmitting}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleNext} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {currentStep === 1 ? "Creating Company..." : "Creating Admin..."}
                  </>
                ) : (
                  <>
                    {currentStep === 1 ? "Create & Continue" : "Create Admin"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleComplete} className="ml-auto">
              Done
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
