import { MainLayout } from "@/components/layout/MainLayout";
import { Building2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

const Company = () => {
  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Company Settings</h1>
          <p className="page-description">Manage your organization details and EPF/ETF registration.</p>
        </div>
        <Button size="lg">
          <Save className="h-5 w-5" />
          Save Changes
        </Button>
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
              <Label>Company Name</Label>
              <Input defaultValue="ABC Company (Pvt) Ltd" />
            </div>
            <div className="space-y-2">
              <Label>Business Registration Number</Label>
              <Input defaultValue="PV12345" />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input defaultValue="123 Galle Road, Colombo 03" />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input defaultValue="+94 11 234 5678" />
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
              <Label>EPF Registration Number</Label>
              <Input defaultValue="EPF/12345" />
            </div>
            <div className="space-y-2">
              <Label>ETF Registration Number</Label>
              <Input defaultValue="ETF/12345" />
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
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Bank Name</Label>
              <Input defaultValue="Commercial Bank" />
            </div>
            <div className="space-y-2">
              <Label>Branch</Label>
              <Input defaultValue="Colombo Fort" />
            </div>
            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input defaultValue="1234567890" />
            </div>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default Company;
