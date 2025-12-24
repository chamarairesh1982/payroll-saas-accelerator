import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  X,
  Download,
  Eye,
  Calendar,
  Users,
  DollarSign,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { usePayslips, PayrollRun } from "@/hooks/usePayroll";
import { formatLKR } from "@/lib/payroll-calculations";
import { downloadPayslipPDF, downloadAllPayslipsPDF } from "@/lib/payslip-pdf";
import { toast } from "sonner";

interface PayrollDetailModalProps {
  payrollRun: PayrollRun;
  onClose: () => void;
}

export function PayrollDetailModal({ payrollRun, onClose }: PayrollDetailModalProps) {
  const { data: payslips = [], isLoading } = usePayslips(payrollRun.id);
  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);

  const handleDownloadPayslip = (payslip: any) => {
    try {
      downloadPayslipPDF(payslip, payrollRun);
      toast.success("Payslip downloaded successfully");
    } catch (error) {
      toast.error("Failed to download payslip");
    }
  };

  const handleDownloadAll = () => {
    if (payslips.length === 0) {
      toast.error("No payslips to download");
      return;
    }
    try {
      // Cast to any to handle JSON type from database
      downloadAllPayslipsPDF(payslips as any[], payrollRun);
      toast.success(`Downloading ${payslips.length} payslips...`);
    } catch (error) {
      toast.error("Failed to download payslips");
    }
  };

  const payPeriodLabel = `${format(new Date(payrollRun.pay_period_start), "MMMM yyyy")}`;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-4 z-50 mx-auto max-w-5xl overflow-hidden rounded-2xl bg-card shadow-2xl lg:inset-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">Payroll Details</h2>
              <p className="text-sm text-muted-foreground">{payPeriodLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDownloadAll} disabled={isLoading}>
              <Download className="h-4 w-4" />
              Download All
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 border-b border-border bg-muted/20 p-4">
          <div className="rounded-lg bg-background p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Employees</span>
            </div>
            <p className="mt-1 text-2xl font-bold">{payrollRun.employee_count}</p>
          </div>
          <div className="rounded-lg bg-background p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Gross Total</span>
            </div>
            <p className="mt-1 text-2xl font-bold">{formatLKR(payrollRun.total_gross_salary)}</p>
          </div>
          <div className="rounded-lg bg-background p-4">
            <div className="flex items-center gap-2 text-sm text-success">
              <DollarSign className="h-4 w-4" />
              <span>Net Total</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-success">{formatLKR(payrollRun.total_net_salary)}</p>
          </div>
          <div className="rounded-lg bg-background p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>EPF + ETF</span>
            </div>
            <p className="mt-1 text-2xl font-bold">
              {formatLKR(payrollRun.total_epf_employee + payrollRun.total_epf_employer + payrollRun.total_etf)}
            </p>
          </div>
        </div>

        {/* Payslips Table */}
        <div className="h-[calc(100%-220px)] overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : payslips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No payslips found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-right">Basic</TableHead>
                  <TableHead className="text-right">OT</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">EPF</TableHead>
                  <TableHead className="text-right">PAYE</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslips.map((payslip: any) => (
                  <TableRow key={payslip.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {payslip.employee?.first_name?.[0]}
                          {payslip.employee?.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-medium">
                            {payslip.employee?.first_name} {payslip.employee?.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {payslip.employee?.employee_number}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatLKR(payslip.basic_salary)}
                    </TableCell>
                    <TableCell className="text-right">
                      {payslip.ot_amount > 0 ? formatLKR(payslip.ot_amount) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatLKR(payslip.gross_salary)}
                    </TableCell>
                    <TableCell className="text-right text-destructive">
                      {formatLKR(payslip.epf_employee)}
                    </TableCell>
                    <TableCell className="text-right text-destructive">
                      {payslip.paye_tax > 0 ? formatLKR(payslip.paye_tax) : "-"}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-success">
                      {formatLKR(payslip.net_salary)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setSelectedPayslip(payslip)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDownloadPayslip(payslip)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </motion.div>

      {/* Payslip Detail Dialog */}
      <Dialog open={!!selectedPayslip} onOpenChange={() => setSelectedPayslip(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Payslip Details</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => selectedPayslip && handleDownloadPayslip(selectedPayslip)}
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedPayslip && (
            <div className="space-y-6">
              {/* Employee Info */}
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Employee</p>
                  <p className="font-semibold">
                    {selectedPayslip.employee?.first_name} {selectedPayslip.employee?.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedPayslip.employee?.employee_number}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-semibold">{selectedPayslip.employee?.department || "-"}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedPayslip.employee?.designation}
                  </p>
                </div>
              </div>

              {/* Attendance */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-sm text-muted-foreground">Working Days</p>
                  <p className="text-xl font-bold">{selectedPayslip.working_days}</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-sm text-muted-foreground">Worked Days</p>
                  <p className="text-xl font-bold">{selectedPayslip.worked_days}</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-sm text-muted-foreground">OT Hours</p>
                  <p className="text-xl font-bold">{selectedPayslip.ot_hours}</p>
                </div>
              </div>

              <Separator />

              {/* Earnings & Deductions */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="mb-3 font-semibold text-success">Earnings</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Basic Salary</span>
                      <span>{formatLKR(selectedPayslip.basic_salary)}</span>
                    </div>
                    {selectedPayslip.ot_amount > 0 && (
                      <div className="flex justify-between">
                        <span>Overtime ({selectedPayslip.ot_hours} hrs)</span>
                        <span>{formatLKR(selectedPayslip.ot_amount)}</span>
                      </div>
                    )}
                    {Array.isArray(selectedPayslip.allowances) &&
                      selectedPayslip.allowances.map((a: any, i: number) => (
                        <div key={i} className="flex justify-between">
                          <span>{a.name}</span>
                          <span>{formatLKR(a.amount)}</span>
                        </div>
                      ))}
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Gross Salary</span>
                      <span className="text-success">{formatLKR(selectedPayslip.gross_salary)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 font-semibold text-destructive">Deductions</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>EPF (8%)</span>
                      <span>{formatLKR(selectedPayslip.epf_employee)}</span>
                    </div>
                    {selectedPayslip.paye_tax > 0 && (
                      <div className="flex justify-between">
                        <span>PAYE Tax</span>
                        <span>{formatLKR(selectedPayslip.paye_tax)}</span>
                      </div>
                    )}
                    {Array.isArray(selectedPayslip.deductions) &&
                      selectedPayslip.deductions
                        .filter((d: any) => d.name !== "EPF (Employee 8%)" && d.name !== "PAYE Tax")
                        .map((d: any, i: number) => (
                          <div key={i} className="flex justify-between">
                            <span>{d.name}</span>
                            <span>{formatLKR(d.amount)}</span>
                          </div>
                        ))}
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total Deductions</span>
                      <span className="text-destructive">
                        {formatLKR(selectedPayslip.gross_salary - selectedPayslip.net_salary)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Net Salary */}
              <div className="flex items-center justify-between rounded-xl bg-primary/10 p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Net Salary</p>
                  <p className="text-xs text-muted-foreground">
                    Bank: {selectedPayslip.employee?.bank_name} - {selectedPayslip.employee?.bank_account_number}
                  </p>
                </div>
                <p className="text-3xl font-bold text-primary">{formatLKR(selectedPayslip.net_salary)}</p>
              </div>

              {/* Employer Contributions */}
              <div className="rounded-lg border p-4">
                <h4 className="mb-2 text-sm font-semibold">Employer Contributions</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>EPF Employer (12%)</span>
                    <span>{formatLKR(selectedPayslip.epf_employer)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ETF (3%)</span>
                    <span>{formatLKR(selectedPayslip.etf_employer)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
