import { motion } from "framer-motion";
import { X, Download, Printer, Building, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaySlip } from "@/types/payroll";
import { formatLKR } from "@/lib/payroll-calculations";

interface PayslipModalProps {
  payslip: PaySlip;
  month: string;
  year: number;
  onClose: () => void;
}

export function PayslipModal({ payslip, month, year, onClose }: PayslipModalProps) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed left-1/2 top-1/2 z-[60] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl font-bold">Payslip</h2>
            <p className="text-sm text-muted-foreground">
              {month} {year}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Company & Employee Info */}
        <div className="mb-6 grid gap-4 rounded-lg bg-muted/50 p-4 sm:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Building className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Company</span>
            </div>
            <p className="font-semibold">ABC Company (Pvt) Ltd</p>
            <p className="text-sm text-muted-foreground">EPF Reg: EPF/12345</p>
          </div>
          <div>
            <div className="mb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Employee</span>
            </div>
            <p className="font-semibold">
              {payslip.employee.firstName} {payslip.employee.lastName}
            </p>
            <p className="text-sm text-muted-foreground">
              {payslip.employee.epfNumber} | {payslip.employee.designation}
            </p>
          </div>
        </div>

        {/* Earnings & Deductions */}
        <div className="mb-6 grid gap-6 sm:grid-cols-2">
          {/* Earnings */}
          <div>
            <h4 className="mb-3 font-semibold text-success">Earnings</h4>
            <div className="space-y-2">
              <div className="flex justify-between rounded bg-success/5 p-2">
                <span>Basic Salary</span>
                <span className="font-medium">{formatLKR(payslip.basicSalary)}</span>
              </div>
              {payslip.allowances.map((item, index) => (
                <div key={index} className="flex justify-between rounded bg-success/5 p-2">
                  <span>{item.name}</span>
                  <span className="font-medium">{formatLKR(item.amount)}</span>
                </div>
              ))}
              <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
                <span>Total Earnings</span>
                <span className="text-success">{formatLKR(payslip.grossSalary)}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div>
            <h4 className="mb-3 font-semibold text-destructive">Deductions</h4>
            <div className="space-y-2">
              {payslip.deductions.map((item, index) => (
                <div key={index} className="flex justify-between rounded bg-destructive/5 p-2">
                  <span>{item.name}</span>
                  <span className="font-medium">{formatLKR(item.amount)}</span>
                </div>
              ))}
              <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
                <span>Total Deductions</span>
                <span className="text-destructive">
                  {formatLKR(payslip.deductions.reduce((sum, d) => sum + d.amount, 0))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Employer Contributions */}
        <div className="mb-6 rounded-lg border p-4">
          <h4 className="mb-3 font-semibold">Employer Contributions (Not deducted from salary)</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex justify-between rounded bg-muted/50 p-2">
              <span>EPF Employer (12%)</span>
              <span className="font-medium">{formatLKR(payslip.epfEmployer)}</span>
            </div>
            <div className="flex justify-between rounded bg-muted/50 p-2">
              <span>ETF Employer (3%)</span>
              <span className="font-medium">{formatLKR(payslip.etfEmployer)}</span>
            </div>
          </div>
        </div>

        {/* Net Salary */}
        <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-primary/10 to-success/10 p-4">
          <div>
            <p className="text-sm text-muted-foreground">Net Salary</p>
            <p className="text-xs text-muted-foreground">
              Paid to: {payslip.employee.bankName} - {payslip.employee.bankAccountNumber}
            </p>
          </div>
          <p className="text-3xl font-bold text-primary">{formatLKR(payslip.netSalary)}</p>
        </div>
      </motion.div>
    </>
  );
}
