import { MainLayout } from "@/components/layout/MainLayout";
import { Receipt, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { DEFAULT_PAYE_SLABS } from "@/types/payroll";

const TaxConfig = () => {
  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tax Configuration</h1>
          <p className="page-description">Configure PAYE tax slabs for Sri Lanka.</p>
        </div>
        <Button size="lg">
          <Save className="h-5 w-5" />
          Save Changes
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-card p-6 shadow-sm"
      >
        <h3 className="mb-4 font-display text-lg font-semibold">PAYE Tax Slabs (2024)</h3>
        <p className="mb-6 text-sm text-muted-foreground">
          Sri Lanka Pay As You Earn (PAYE) tax rates based on monthly taxable income.
        </p>
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Income Range (Rs.)</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Tax Rate</th>
              </tr>
            </thead>
            <tbody>
              {DEFAULT_PAYE_SLABS.map((slab, index) => (
                <tr key={index} className="border-t">
                  <td className="px-4 py-3 text-sm">
                    Rs. {slab.minIncome.toLocaleString()} - {slab.maxIncome === Infinity ? "Above" : `Rs. ${slab.maxIncome.toLocaleString()}`}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${slab.rate === 0 ? "bg-success/15 text-success" : "bg-primary/15 text-primary"}`}>
                      {slab.rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </MainLayout>
  );
};

export default TaxConfig;
