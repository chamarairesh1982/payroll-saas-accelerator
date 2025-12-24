import { MainLayout } from "@/components/layout/MainLayout";
import { Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const Overtime = () => {
  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Overtime</h1>
          <p className="page-description">Track and manage overtime hours.</p>
        </div>
        <Button size="lg">
          <Plus className="h-5 w-5" />
          Add Overtime
        </Button>
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl bg-card py-20 shadow-sm">
        <Clock className="h-16 w-16 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">Overtime Tracking</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Log and approve overtime hours with configurable rates. Coming soon!
        </p>
      </div>
    </MainLayout>
  );
};

export default Overtime;
