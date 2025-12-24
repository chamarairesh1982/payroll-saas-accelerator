import { MainLayout } from "@/components/layout/MainLayout";
import { Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const Leave = () => {
  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Leave Management</h1>
          <p className="page-description">Manage leave requests and approvals.</p>
        </div>
        <Button size="lg">
          <Plus className="h-5 w-5" />
          Request Leave
        </Button>
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl bg-card py-20 shadow-sm">
        <Calendar className="h-16 w-16 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">Leave Requests</h3>
        <p className="text-muted-foreground text-center max-w-md">
          View and manage employee leave requests with approval workflow. Coming soon!
        </p>
      </div>
    </MainLayout>
  );
};

export default Leave;
