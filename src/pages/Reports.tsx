import { MainLayout } from "@/components/layout/MainLayout";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const reportTypes = [
  { name: "EPF Returns (C Form)", description: "Monthly EPF contribution report for Department of Labour", icon: "📋" },
  { name: "ETF Returns", description: "Monthly ETF contribution report", icon: "📊" },
  { name: "PAYE Tax Report", description: "Quarterly PAYE tax report for IRD", icon: "💰" },
  { name: "Payroll Summary", description: "Monthly payroll summary by department", icon: "📈" },
  { name: "Employee Payslips", description: "Generate individual or bulk payslips", icon: "🧾" },
  { name: "Bank Transfer File", description: "Export bank file for salary transfers", icon: "🏦" },
];

const Reports = () => {
  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-description">Generate payroll and compliance reports.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((report, index) => (
          <motion.div
            key={report.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/30"
          >
            <div className="mb-4 text-4xl">{report.icon}</div>
            <h3 className="font-display font-semibold">{report.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{report.description}</p>
            <Button variant="outline" size="sm" className="mt-4 w-full group-hover:bg-primary group-hover:text-primary-foreground">
              <Download className="h-4 w-4" />
              Generate
            </Button>
          </motion.div>
        ))}
      </div>
    </MainLayout>
  );
};

export default Reports;
