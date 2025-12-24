import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { FileText, Download, FileSpreadsheet, Calendar, Users, Wallet, ClipboardList, TrendingUp, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { format, subMonths } from "date-fns";
import { toast } from "sonner";
import {
  getPayrollSummaryData,
  getContributionData,
  getLeaveBalanceData,
  exportPayrollSummaryPDF,
  exportPayrollSummaryExcel,
  exportContributionsPDF,
  exportContributionsExcel,
  exportLeaveBalancePDF,
  exportLeaveBalanceExcel,
  getBalanceByCode,
  leaveTypes,
} from "@/lib/report-exports";

const months = Array.from({ length: 12 }, (_, i) => {
  const date = subMonths(new Date(), i);
  return { value: date.toISOString(), label: format(date, "MMMM yyyy") };
});

const Reports = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString());
  const monthDate = useMemo(() => new Date(selectedMonth), [selectedMonth]);

  const payrollData = useMemo(() => getPayrollSummaryData(monthDate), [monthDate]);
  const contributionData = useMemo(() => getContributionData(monthDate), [monthDate]);
  const leaveBalanceData = useMemo(() => getLeaveBalanceData(), []);

  const contributionTotals = useMemo(() => 
    contributionData.reduce(
      (acc, row) => ({
        basicSalary: acc.basicSalary + row.basicSalary,
        epfEmployee: acc.epfEmployee + row.epfEmployee,
        epfEmployer: acc.epfEmployer + row.epfEmployer,
        epfTotal: acc.epfTotal + row.epfTotal,
        etfEmployer: acc.etfEmployer + row.etfEmployer,
      }),
      { basicSalary: 0, epfEmployee: 0, epfEmployer: 0, epfTotal: 0, etfEmployer: 0 }
    ), [contributionData]);

  const handleExport = (type: string, format: 'pdf' | 'excel') => {
    try {
      if (type === 'payroll') {
        format === 'pdf' ? exportPayrollSummaryPDF(monthDate) : exportPayrollSummaryExcel(monthDate);
      } else if (type === 'contributions') {
        format === 'pdf' ? exportContributionsPDF(monthDate) : exportContributionsExcel(monthDate);
      } else if (type === 'leave') {
        format === 'pdf' ? exportLeaveBalancePDF() : exportLeaveBalanceExcel();
      }
      toast.success(`Report exported as ${format.toUpperCase()}`, {
        description: `Your ${type} report has been downloaded.`,
      });
    } catch (error) {
      toast.error("Export failed", { description: "Please try again." });
    }
  };

  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-description">Generate and export payroll and compliance reports.</p>
        </div>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Payroll</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">LKR {(payrollData.totals.totalGrossSalary / 1000).toFixed(0)}K</div>
              <p className="text-xs text-muted-foreground">{format(monthDate, "MMMM yyyy")}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">EPF Contributions</CardTitle>
              <Building2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">LKR {(contributionTotals.epfTotal / 1000).toFixed(0)}K</div>
              <p className="text-xs text-muted-foreground">Employee + Employer</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">ETF Contributions</CardTitle>
              <TrendingUp className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">LKR {contributionTotals.etfEmployer.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Employer Only (3%)</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Employees</CardTitle>
              <Users className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payrollData.totals.employeeCount}</div>
              <p className="text-xs text-muted-foreground">Active employees</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="payroll" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payroll">Payroll Summary</TabsTrigger>
          <TabsTrigger value="contributions">EPF/ETF Report</TabsTrigger>
          <TabsTrigger value="leave">Leave Balances</TabsTrigger>
        </TabsList>

        {/* Payroll Summary Tab */}
        <TabsContent value="payroll">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Payroll Summary</CardTitle>
                <CardDescription>Monthly payroll breakdown by department</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExport('payroll', 'excel')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button size="sm" onClick={() => handleExport('payroll', 'pdf')}>
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Gross Salary</p>
                  <p className="text-xl font-semibold">LKR {payrollData.totals.totalGrossSalary.toLocaleString()}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Net Salary</p>
                  <p className="text-xl font-semibold">LKR {payrollData.totals.totalNetSalary.toLocaleString()}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Total Deductions</p>
                  <p className="text-xl font-semibold text-destructive">
                    LKR {(payrollData.totals.totalEpfEmployee + payrollData.totals.totalPaye).toLocaleString()}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">PAYE Tax</p>
                  <p className="text-xl font-semibold">LKR {payrollData.totals.totalPaye.toLocaleString()}</p>
                </div>
              </div>

              {/* Department Breakdown */}
              <h4 className="font-semibold mb-3">Department Breakdown</h4>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Department</TableHead>
                      <TableHead className="text-center">Employees</TableHead>
                      <TableHead className="text-right">Basic (LKR)</TableHead>
                      <TableHead className="text-right">Gross (LKR)</TableHead>
                      <TableHead className="text-right">Net (LKR)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(payrollData.departmentSummary).map(([dept, summary]) => (
                      <TableRow key={dept}>
                        <TableCell className="font-medium">{dept}</TableCell>
                        <TableCell className="text-center">{summary.count}</TableCell>
                        <TableCell className="text-right">{summary.basicTotal.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{summary.grossTotal.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-medium">{summary.netTotal.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EPF/ETF Contributions Tab */}
        <TabsContent value="contributions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>EPF / ETF Contribution Report</CardTitle>
                <CardDescription>Monthly statutory contribution details</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExport('contributions', 'excel')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button size="sm" onClick={() => handleExport('contributions', 'pdf')}>
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Totals */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Total Basic</p>
                  <p className="text-lg font-semibold">LKR {contributionTotals.basicSalary.toLocaleString()}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">EPF Employee (8%)</p>
                  <p className="text-lg font-semibold">LKR {contributionTotals.epfEmployee.toLocaleString()}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">EPF Employer (12%)</p>
                  <p className="text-lg font-semibold">LKR {contributionTotals.epfEmployer.toLocaleString()}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Total EPF</p>
                  <p className="text-lg font-semibold text-primary">LKR {contributionTotals.epfTotal.toLocaleString()}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">ETF (3%)</p>
                  <p className="text-lg font-semibold">LKR {contributionTotals.etfEmployer.toLocaleString()}</p>
                </div>
              </div>

              {/* Employee Details */}
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Emp #</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>EPF #</TableHead>
                      <TableHead className="text-right">Basic</TableHead>
                      <TableHead className="text-right">EPF Emp</TableHead>
                      <TableHead className="text-right">EPF Empr</TableHead>
                      <TableHead className="text-right">ETF</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contributionData.map((row) => (
                      <TableRow key={row.employeeNumber}>
                        <TableCell className="font-medium">{row.employeeNumber}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.epfNumber}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{row.basicSalary.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{row.epfEmployee.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{row.epfEmployer.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{row.etfEmployer.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Balance Tab */}
        <TabsContent value="leave">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Leave Balance Report</CardTitle>
                <CardDescription>Current leave balances for all employees</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExport('leave', 'excel')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button size="sm" onClick={() => handleExport('leave', 'pdf')}>
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Emp #</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-center">Annual</TableHead>
                      <TableHead className="text-center">Casual</TableHead>
                      <TableHead className="text-center">Sick</TableHead>
                      <TableHead className="text-center">Maternity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveBalanceData.map((row) => (
                      <TableRow key={row.employeeNumber}>
                        <TableCell className="font-medium">{row.employeeNumber}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.department}</TableCell>
                        {['AL', 'CL', 'SL', 'ML'].map((code) => {
                          const balance = getBalanceByCode(row.balances, code);
                          const leaveType = leaveTypes.find(lt => lt.code === code);
                          const remaining = balance?.available || 0;
                          const total = leaveType?.daysPerYear || 0;
                          const percentage = total > 0 ? (remaining / total) * 100 : 0;
                          return (
                            <TableCell key={code} className="text-center">
                              <span className={percentage < 30 ? "text-destructive" : percentage < 60 ? "text-warning" : ""}>
                                {remaining} / {total}
                              </span>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default Reports;
