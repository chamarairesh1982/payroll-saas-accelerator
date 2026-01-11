import { Bell, Search, HelpCircle, Calendar, Clock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/useNotifications";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const iconForKind = (kind: string) => {
  switch (kind) {
    case "leave_pending":
      return Calendar;
    case "overtime_pending":
      return Clock;
    case "invitations_pending":
      return Mail;
    default:
      return Bell;
  }
};

export function Header() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const { data: company } = useQuery({
    queryKey: ["header-company", profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return null;
      const { data } = await supabase
        .from("companies")
        .select("name, epf_number")
        .eq("id", profile.company_id)
        .maybeSingle();
      return data;
    },
    enabled: !!profile?.company_id,
  });

  const { data: notifications } = useNotifications();
  const total = notifications?.totalCount ?? 0;
  const items = notifications?.items ?? [];

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Search */}
      <div className="relative max-w-md flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search employees, payroll..."
          className="h-10 w-full bg-muted/50 pl-10 border-0 focus-visible:ring-1 focus-visible:ring-primary"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {total > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {total > 99 ? "99+" : total}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {items.length === 0 ? (
              <DropdownMenuItem disabled className="py-3">
                You’re all caught up
              </DropdownMenuItem>
            ) : (
              items.map((item) => {
                const Icon = iconForKind(item.kind);
                return (
                  <DropdownMenuItem
                    key={item.kind}
                    className="cursor-pointer"
                    onSelect={(e) => {
                      e.preventDefault();
                      navigate(item.href);
                    }}
                  >
                    <div className="flex w-full items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium leading-none">
                            {item.title}
                          </p>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            {item.count}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                );
              })
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" aria-label="Help">
          <HelpCircle className="h-5 w-5" />
        </Button>

        <div className="ml-2 h-8 w-px bg-border" />

        <div className="flex items-center gap-3 pl-2">
          <div className="text-right">
            <p className="text-sm font-medium">{company?.name || "Company"}</p>
            {company?.epf_number ? (
              <p className="text-xs text-muted-foreground">EPF: {company.epf_number}</p>
            ) : (
              <p className="text-xs text-muted-foreground">EPF: —</p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

