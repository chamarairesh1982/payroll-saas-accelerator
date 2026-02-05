import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { Eye, EyeOff, Key, Save, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const PlatformSettings = () => {
  const { settings, isLoading, updateSetting, isUpdating, getSetting } = usePlatformSettings();
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  const handleValueChange = (key: string, value: string) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (key: string) => {
    const value = editedValues[key] ?? getSetting(key);
    updateSetting({ key, value });
  };

  const toggleShowSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getDisplayValue = (setting: { key: string; value: string | null; is_secret: boolean }) => {
    const currentValue = editedValues[setting.key] ?? setting.value ?? "";
    if (setting.is_secret && !showSecrets[setting.key]) {
      return currentValue ? "••••••••••••••••" : "";
    }
    return currentValue;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stripeSettings = settings.filter((s) => s.key.startsWith("stripe_"));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Stripe Configuration
          </CardTitle>
          <CardDescription>
            Configure Stripe API keys for payment processing. These keys are used for subscription billing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {stripeSettings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No Stripe settings found.</p>
          ) : (
            stripeSettings.map((setting) => (
              <div key={setting.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={setting.key} className="text-sm font-medium">
                    {setting.key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Label>
                  <div className="flex items-center gap-2">
                    {setting.is_secret && (
                      <Badge variant="secondary" className="text-xs">
                        Secret
                      </Badge>
                    )}
                    {setting.value && (
                      <Badge className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20">
                        Configured
                      </Badge>
                    )}
                    {!setting.value && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        Not Set
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{setting.description}</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id={setting.key}
                      type={setting.is_secret && !showSecrets[setting.key] ? "password" : "text"}
                      value={editedValues[setting.key] ?? setting.value ?? ""}
                      onChange={(e) => handleValueChange(setting.key, e.target.value)}
                      placeholder={`Enter ${setting.key.replace(/_/g, " ")}`}
                      className="pr-10"
                    />
                    {setting.is_secret && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => toggleShowSecret(setting.key)}
                      >
                        {showSecrets[setting.key] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  <Button
                    onClick={() => handleSave(setting.key)}
                    disabled={isUpdating}
                    size="icon"
                  >
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage Instructions</CardTitle>
          <CardDescription>How to obtain your Stripe API keys</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Go to your <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-primary underline">Stripe Dashboard → API Keys</a></li>
            <li>Copy your <strong>Publishable key</strong> (starts with pk_)</li>
            <li>Copy your <strong>Secret key</strong> (starts with sk_)</li>
            <li>For webhooks, create a webhook endpoint in Stripe and copy the signing secret</li>
            <li>Paste the keys above and save</li>
          </ol>
          <p className="mt-4 text-xs text-muted-foreground">
            ⚠️ For production, use live keys. For testing, use test keys (starting with pk_test_ and sk_test_).
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
