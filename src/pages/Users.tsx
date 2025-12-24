import { MainLayout } from "@/components/layout/MainLayout";
import { Shield, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const Users = () => {
  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-description">Manage system users and access permissions.</p>
        </div>
        <Button size="lg">
          <Plus className="h-5 w-5" />
          Add User
        </Button>
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl bg-card py-20 shadow-sm">
        <Shield className="h-16 w-16 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">User Access Control</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Manage admin, HR, manager, and employee roles with granular permissions. Coming soon!
        </p>
      </div>
    </MainLayout>
  );
};

export default Users;
