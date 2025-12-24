import { MainLayout } from "@/components/layout/MainLayout";
import { DollarSign, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const Payroll = () => {
  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payroll</h1>
          <p className="page-description">Process and manage monthly payroll runs.</p>
        </div>
        <Button size="lg">
          <Plus className="h-5 w-5" />
          Run Payroll
        </Button>
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl bg-card py-20 shadow-sm">
        <DollarSign className="h-16 w-16 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">Payroll Processing</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Process monthly payroll with automatic EPF/ETF and PAYE tax calculations. Coming soon!
        </p>
      </div>
    </MainLayout>
  );
};

export default Payroll;
