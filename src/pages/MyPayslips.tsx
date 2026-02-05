import { useState } from "react";
import { FileText, Download, Calendar, DollarSign, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useMyPayslips } from "@/hooks/usePayroll";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/useCompany";
import { downloadPayslipPDF } from "@/lib/payslip-pdf";
import { formatLKR } from "@/lib/payroll-calculations";
import { format } from "date-fns";

const MyPayslips = () => {
  const { profile } = useAuth();
  const { company } = useCompany();
  const { data: payslips = [], isLoading } = useMyPayslips();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (payslip: any) => {
    setDownloadingId(payslip.id);
    try {
      const payrollRun = payslip.payroll_run;
      // Use employee data from payslip if available, otherwise use basic profile
      downloadPayslipPDF(
        {
          employee: {
            first_name: profile?.first_name || null,
            last_name: profile?.last_name || null,
            employee_number: null,
            department: profile?.department || null,
            designation: profile?.designation || null,
            epf_number: null,
            bank_name: null,
            bank_account_number: null,
          },
          basic_salary: payslip.basic_salary,
          gross_salary: payslip.gross_salary,
          net_salary: payslip.net_salary,
          epf_employee: payslip.epf_employee,
          epf_employer: payslip.epf_employer,
          etf_employer: payslip.etf_employer,
          paye_tax: payslip.paye_tax,
          ot_hours: payslip.ot_hours,
          ot_amount: payslip.ot_amount,
          worked_days: payslip.worked_days,
          working_days: payslip.working_days,
          allowances: payslip.allowances || [],
          deductions: payslip.deductions || [],
        },
        {
          pay_period_start: payrollRun.pay_period_start,
          pay_period_end: payrollRun.pay_period_end,
          pay_date: payrollRun.pay_date,
        },
        payrollRun.company?.name || company?.name
      );
    } finally {
      setDownloadingId(null);
    }
  };

  // Calculate totals for summary
  const totals = payslips.reduce(
    (acc, p) => ({
      totalEarnings: acc.totalEarnings + (p.gross_salary || 0),
      totalDeductions: acc.totalDeductions + (p.epf_employee || 0) + (p.paye_tax || 0),
      totalNetPay: acc.totalNetPay + (p.net_salary || 0),
    }),
    { totalEarnings: 0, totalDeductions: 0, totalNetPay: 0 }
  );

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Payslips</h1>
          <p className="page-description">
            View and download your salary statements
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payslips</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payslips.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">YTD Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatLKR(totals.totalEarnings)}</div>
            <p className="text-xs text-muted-foreground">Gross salary</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">YTD Net Pay</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatLKR(totals.totalNetPay)}</div>
            <p className="text-xs text-muted-foreground">After deductions</p>
          </CardContent>
        </Card>
      </div>

      {/* Payslips Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payslip History</CardTitle>
          <CardDescription>
            Your salary statements for all pay periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payslips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Payslips Yet</h3>
              <p className="text-muted-foreground max-w-sm">
                Your payslips will appear here once payroll has been processed for you.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pay Period</TableHead>
                  <TableHead>Pay Date</TableHead>
                  <TableHead className="text-right">Gross Salary</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslips.map((payslip) => {
                  const payrollRun = payslip.payroll_run as any;
                  const totalDeductions = (payslip.epf_employee || 0) + (payslip.paye_tax || 0);
                  
                  return (
                    <TableRow key={payslip.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {format(new Date(payrollRun.pay_period_start), "MMM yyyy")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(payrollRun.pay_date), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatLKR(payslip.gross_salary)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        -{formatLKR(totalDeductions)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatLKR(payslip.net_salary)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={payrollRun.status === "paid" ? "default" : "secondary"}
                        >
                          {payrollRun.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(payslip)}
                          disabled={downloadingId === payslip.id}
                        >
                          {downloadingId === payslip.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-1" />
                              PDF
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default MyPayslips;