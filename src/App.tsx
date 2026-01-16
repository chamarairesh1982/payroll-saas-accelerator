import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import AcceptInvitation from "./pages/AcceptInvitation";
import Employees from "./pages/Employees";
import EmployeeProfile from "./pages/EmployeeProfile";
import EmployeeForm from "./pages/EmployeeForm";
import Payroll from "./pages/Payroll";
import Attendance from "./pages/Attendance";
import Leave from "./pages/Leave";
import Overtime from "./pages/Overtime";
import Loans from "./pages/Loans";
import SalaryComponents from "./pages/SalaryComponents";
import TaxConfig from "./pages/TaxConfig";
import Reports from "./pages/Reports";
import Company from "./pages/Company";
import Companies from "./pages/Companies";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import ActivityLog from "./pages/ActivityLog";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/accept-invitation" element={<AcceptInvitation />} />
      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
      <Route path="/employees/new" element={<ProtectedRoute><EmployeeForm /></ProtectedRoute>} />
      <Route path="/employees/:id" element={<ProtectedRoute><EmployeeProfile /></ProtectedRoute>} />
      <Route path="/employees/:id/edit" element={<ProtectedRoute><EmployeeForm /></ProtectedRoute>} />
      <Route path="/payroll" element={<ProtectedRoute><Payroll /></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
      <Route path="/leave" element={<ProtectedRoute><Leave /></ProtectedRoute>} />
      <Route path="/overtime" element={<ProtectedRoute><Overtime /></ProtectedRoute>} />
      <Route path="/loans" element={<ProtectedRoute><Loans /></ProtectedRoute>} />
      <Route path="/salary-components" element={<ProtectedRoute><SalaryComponents /></ProtectedRoute>} />
      <Route path="/tax-config" element={<ProtectedRoute><TaxConfig /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/company" element={<ProtectedRoute><Company /></ProtectedRoute>} />
      <Route path="/companies" element={<ProtectedRoute><Companies /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/activity-log" element={<ProtectedRoute><ActivityLog /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
