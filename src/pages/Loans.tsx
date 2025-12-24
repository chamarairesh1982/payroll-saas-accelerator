import { MainLayout } from "@/components/layout/MainLayout";
import { CreditCard, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const Loans = () => {
  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Loans</h1>
          <p className="page-description">Manage employee loans and recovery schedules.</p>
        </div>
        <Button size="lg">
          <Plus className="h-5 w-5" />
          New Loan
        </Button>
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl bg-card py-20 shadow-sm">
        <CreditCard className="h-16 w-16 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">Loan Management</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Track salary advances and loans with automatic payroll deductions. Coming soon!
        </p>
      </div>
    </MainLayout>
  );
};

export default Loans;
