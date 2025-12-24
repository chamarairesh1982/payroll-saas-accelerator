import { MainLayout } from "@/components/layout/MainLayout";
import { Calculator, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const SalaryComponents = () => {
  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Allowances & Deductions</h1>
          <p className="page-description">Configure salary components for payroll calculation.</p>
        </div>
        <Button size="lg">
          <Plus className="h-5 w-5" />
          Add Component
        </Button>
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl bg-card py-20 shadow-sm">
        <Calculator className="h-16 w-16 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">Salary Components</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Define allowances and deductions that apply to employee salaries. Coming soon!
        </p>
      </div>
    </MainLayout>
  );
};

export default SalaryComponents;
