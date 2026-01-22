import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Calendar,
  Clock,
  FileText,
  Settings,
  Building2,
  Calculator,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Shield,
  TrendingUp,
  Receipt,
  LogOut,
  UserCircle,
  Bell,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Employees", icon: Users, href: "/employees" },
  { label: "Time & Attendance", icon: Clock, href: "/attendance" },
  { label: "Payroll", icon: DollarSign, href: "/payroll" },
  { label: "Leave", icon: Calendar, href: "/leave" },
  { label: "Overtime", icon: TrendingUp, href: "/overtime" },
  { label: "Loans", icon: CreditCard, href: "/loans" },
];

const configNavItems: NavItem[] = [
  { label: "Allowances & Deductions", icon: Calculator, href: "/salary-components" },
  { label: "Tax Configuration", icon: Receipt, href: "/tax-config" },
  { label: "Reports", icon: FileText, href: "/reports" },
];

const adminNavItems: NavItem[] = [
  { label: "Companies", icon: Building2, href: "/companies" },
  { label: "Company Settings", icon: Settings, href: "/company" },
  { label: "User Management", icon: Shield, href: "/users" },
  { label: "Activity Log", icon: Bell, href: "/activity-log" },
];

const superAdminNavItems: NavItem[] = [
  { label: "Platform Admin", icon: Crown, href: "/super-admin" },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, userRole, signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isSuperAdmin = userRole?.role === "super_admin";

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const userName = profile?.first_name && profile?.last_name 
    ? `${profile.first_name} ${profile.last_name}`
    : profile?.email || "User";
  
  const userInitials = profile?.first_name && profile?.last_name
    ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    : "U";

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  const NavLink = ({ item }: { item: NavItem }) => (
    <Link
      to={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
        isActive(item.href)
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
      )}
    >
      <item.icon className="h-5 w-5 shrink-0" />
      <AnimatePresence>
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            className="truncate"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      {item.badge && !isCollapsed && (
        <span className="ml-auto rounded-full bg-warning px-2 py-0.5 text-xs font-semibold text-warning-foreground">
          {item.badge}
        </span>
      )}
    </Link>
  );

  const NavSection = ({ title, items }: { title: string; items: NavItem[] }) => (
    <div className="space-y-1">
      <AnimatePresence>
        {!isCollapsed && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50"
          >
            {title}
          </motion.p>
        )}
      </AnimatePresence>
      {items.map((item) => (
        <NavLink key={item.href} item={item} />
      ))}
    </div>
  );

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 72 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border"
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <TrendingUp className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <h1 className="font-display text-lg font-bold text-sidebar-foreground">
                  PayrollSL
                </h1>
                <p className="text-xs text-sidebar-foreground/50">Sri Lanka Payroll</p>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 overflow-y-auto p-4 scrollbar-hide">
        <NavSection title="Main" items={mainNavItems} />
        <NavSection title="Configuration" items={configNavItems} />
        <NavSection title="Administration" items={adminNavItems} />
        {isSuperAdmin && <NavSection title="Platform" items={superAdminNavItems} />}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
          <Link to="/profile" className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent hover:bg-sidebar-primary/20 transition-colors">
            <span className="text-sm font-semibold text-sidebar-foreground">{userInitials}</span>
          </Link>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 truncate"
              >
                <Link to="/profile" className="hover:underline">
                  <p className="text-sm font-medium text-sidebar-foreground">{userName}</p>
                </Link>
                <p className="text-xs text-sidebar-foreground/50 capitalize">{userRole?.role || "No Role"}</p>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => navigate("/profile")}
                  className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  title="My Profile"
                >
                  <UserCircle className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleSignOut}
                  className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
