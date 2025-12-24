import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Employees from "./pages/Employees";
import EmployeeProfile from "./pages/EmployeeProfile";
import EmployeeForm from "./pages/EmployeeForm";
import Payroll from "./pages/Payroll";
import Leave from "./pages/Leave";
import Overtime from "./pages/Overtime";
import Loans from "./pages/Loans";
import SalaryComponents from "./pages/SalaryComponents";
import TaxConfig from "./pages/TaxConfig";
import Reports from "./pages/Reports";
import Company from "./pages/Company";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/employees/new" element={<EmployeeForm />} />
          <Route path="/employees/:id" element={<EmployeeProfile />} />
          <Route path="/employees/:id/edit" element={<EmployeeForm />} />
          <Route path="/payroll" element={<Payroll />} />
          <Route path="/leave" element={<Leave />} />
          <Route path="/overtime" element={<Overtime />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/salary-components" element={<SalaryComponents />} />
          <Route path="/tax-config" element={<TaxConfig />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/company" element={<Company />} />
          <Route path="/users" element={<Users />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
