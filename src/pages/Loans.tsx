import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { CreditCard, Plus, Search, Eye, TrendingDown, Wallet, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { mockLoans, getLoanStats, formatLoanType, loanTypes } from "@/data/mockLoans";
import { Loan } from "@/types/payroll";
import { LoanModal } from "@/components/loans/LoanModal";
import { LoanDetailsModal } from "@/components/loans/LoanDetailsModal";
import { Progress } from "@/components/ui/progress";

const statusConfig: Record<Loan['status'], { label: string; variant: "default" | "secondary" | "destructive" }> = {
  active: { label: "Active", variant: "default" },
  completed: { label: "Completed", variant: "secondary" },
  defaulted: { label: "Defaulted", variant: "destructive" },
};

const Loans = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const stats = useMemo(() => getLoanStats(), []);

  const filteredLoans = useMemo(() => {
    return mockLoans.filter(loan => {
      const matchesSearch = 
        loan.employee.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.employee.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.employee.employeeNumber.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || loan.status === statusFilter;
      const matchesType = typeFilter === "all" || loan.loanType === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [searchQuery, statusFilter, typeFilter]);

  const handleViewDetails = (loan: Loan) => {
    setSelectedLoan(loan);
    setShowDetailsModal(true);
  };

  const getRepaymentProgress = (loan: Loan) => {
    const paid = loan.principalAmount - loan.outstandingAmount;
    return (paid / loan.principalAmount) * 100;
  };

  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Loans & Advances</h1>
          <p className="page-description">Manage employee loans and recovery schedules.</p>
        </div>
        <Button size="lg" onClick={() => setShowLoanModal(true)}>
          <Plus className="h-5 w-5" />
          New Loan
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Loans</CardTitle>
              <CreditCard className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeLoans}</div>
              <p className="text-xs text-muted-foreground">{stats.completedLoans} completed</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Disbursed</CardTitle>
              <Wallet className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">LKR {(stats.totalDisbursed / 1000).toFixed(0)}K</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">LKR {(stats.totalOutstanding / 1000).toFixed(0)}K</div>
              <p className="text-xs text-muted-foreground">To be recovered</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Deductions</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">LKR {stats.monthlyDeductions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">From payroll</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by employee name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="defaulted">Defaulted</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {loanTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loans Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border bg-card shadow-sm overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Employee</TableHead>
              <TableHead>Loan Type</TableHead>
              <TableHead className="text-right">Principal</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead className="text-right">Monthly</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLoans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <CreditCard className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No loans found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredLoans.map((loan) => (
                <TableRow key={loan.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div>
                      <p className="font-medium">{loan.employee.firstName} {loan.employee.lastName}</p>
                      <p className="text-sm text-muted-foreground">{loan.employee.employeeNumber}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{formatLoanType(loan.loanType)}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    LKR {loan.principalAmount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={loan.outstandingAmount > 0 ? "text-destructive" : "text-success"}>
                      LKR {loan.outstandingAmount.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    LKR {loan.monthlyDeduction.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <Progress value={getRepaymentProgress(loan)} className="h-2" />
                      <span className="text-xs text-muted-foreground w-10">
                        {getRepaymentProgress(loan).toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[loan.status].variant}>
                      {statusConfig[loan.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleViewDetails(loan)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </motion.div>

      <LoanModal open={showLoanModal} onOpenChange={setShowLoanModal} />
      <LoanDetailsModal loan={selectedLoan} open={showDetailsModal} onOpenChange={setShowDetailsModal} />
    </MainLayout>
  );
};

export default Loans;
