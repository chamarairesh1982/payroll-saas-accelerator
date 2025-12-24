import { MainLayout } from "@/components/layout/MainLayout";
import { Settings as SettingsIcon, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

const Settings = () => {
  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">System Settings</h1>
          <p className="page-description">Configure system preferences and defaults.</p>
        </div>
        <Button size="lg">
          <Save className="h-5 w-5" />
          Save Changes
        </Button>
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl bg-card py-20 shadow-sm">
        <SettingsIcon className="h-16 w-16 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">System Configuration</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Configure pay periods, notification settings, and system defaults. Coming soon!
        </p>
      </div>
    </MainLayout>
  );
};

export default Settings;
