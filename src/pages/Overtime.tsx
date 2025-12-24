import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Clock, Plus, Search, Eye, Settings2, CheckCircle2, XCircle, AlertCircle, TrendingUp, DollarSign, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { mockOvertimeEntries, mockOvertimeRates, getOvertimeStats, formatDayType } from "@/data/mockOvertime";
import { OvertimeEntry } from "@/types/payroll";
import { OvertimeEntryModal } from "@/components/overtime/OvertimeEntryModal";
import { OvertimeApprovalModal } from "@/components/overtime/OvertimeApprovalModal";
import { OvertimeRatesModal } from "@/components/overtime/OvertimeRatesModal";

const statusConfig: Record<OvertimeEntry['status'], { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  pending: { label: "Pending", variant: "outline", icon: <AlertCircle className="h-3 w-3" /> },
  approved: { label: "Approved", variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
  rejected: { label: "Rejected", variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
};

const Overtime = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showRatesModal, setShowRatesModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<OvertimeEntry | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [entries, setEntries] = useState(mockOvertimeEntries);

  const stats = useMemo(() => getOvertimeStats(), []);

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = 
        entry.employee.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.employee.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.employee.employeeNumber.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || entry.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [entries, searchQuery, statusFilter]);

  const pendingEntries = useMemo(() => 
    entries.filter(e => e.status === "pending"), 
  [entries]);

  const handleReviewEntry = (entry: OvertimeEntry) => {
    setSelectedEntry(entry);
    setShowApprovalModal(true);
  };

  const handleApprove = (entryId: string) => {
    setEntries(prev => prev.map(e => 
      e.id === entryId 
        ? { ...e, status: 'approved' as const, approvedBy: 'Current User', approvedAt: new Date() }
        : e
    ));
  };

  const handleReject = (entryId: string, reason: string) => {
    setEntries(prev => prev.map(e => 
      e.id === entryId 
        ? { ...e, status: 'rejected' as const, approvedBy: 'Current User', approvedAt: new Date() }
        : e
    ));
  };

  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Overtime Management</h1>
          <p className="page-description">Track and approve overtime hours with configurable rates.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowRatesModal(true)}>
            <Settings2 className="h-5 w-5" />
            Configure Rates
          </Button>
          <Button size="lg" onClick={() => setShowEntryModal(true)}>
            <Plus className="h-5 w-5" />
            Add Overtime
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total OT Hours</CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalHours} hrs</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">LKR {(stats.totalAmount / 1000).toFixed(1)}K</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
              <AlertCircle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingCount}</div>
              <p className="text-xs text-muted-foreground">LKR {stats.pendingAmount.toLocaleString()}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approvedCount}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="entries" className="space-y-4">
        <TabsList>
          <TabsTrigger value="entries">All Entries</TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Pending Approval
            {pendingEntries.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {pendingEntries.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rates">OT Rates</TabsTrigger>
        </TabsList>

        <TabsContent value="entries">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Entries Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border bg-card shadow-sm overflow-hidden"
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Hours</TableHead>
                  <TableHead>Rate Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Clock className="h-8 w-8 text-muted-foreground/50" />
                        <p className="text-muted-foreground">No overtime entries found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div>
                          <p className="font-medium">{entry.employee.firstName} {entry.employee.lastName}</p>
                          <p className="text-sm text-muted-foreground">{entry.employee.employeeNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell>{format(entry.date, "dd MMM yyyy")}</TableCell>
                      <TableCell className="text-center font-medium">{entry.hours}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {entry.overtimeRate.name} ({entry.overtimeRate.multiplier}x)
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        LKR {entry.calculatedAmount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[entry.status].variant} className="gap-1">
                          {statusConfig[entry.status].icon}
                          {statusConfig[entry.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.status === "pending" ? (
                          <Button variant="outline" size="sm" onClick={() => handleReviewEntry(entry)}>
                            Review
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </motion.div>
        </TabsContent>

        <TabsContent value="pending">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border bg-card shadow-sm overflow-hidden"
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Hours</TableHead>
                  <TableHead>Rate Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="h-8 w-8 text-success/50" />
                        <p className="text-muted-foreground">All overtime entries have been reviewed</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingEntries.map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div>
                          <p className="font-medium">{entry.employee.firstName} {entry.employee.lastName}</p>
                          <p className="text-sm text-muted-foreground">{entry.employee.department}</p>
                        </div>
                      </TableCell>
                      <TableCell>{format(entry.date, "dd MMM yyyy")}</TableCell>
                      <TableCell className="text-center font-medium">{entry.hours}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {entry.overtimeRate.name} ({entry.overtimeRate.multiplier}x)
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        LKR {entry.calculatedAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => handleReviewEntry(entry)}>
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </motion.div>
        </TabsContent>

        <TabsContent value="rates">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border bg-card shadow-sm overflow-hidden"
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Rate Name</TableHead>
                  <TableHead>Day Type</TableHead>
                  <TableHead className="text-center">Multiplier</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockOvertimeRates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-medium">{rate.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{formatDayType(rate.dayType)}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold text-primary text-lg">{rate.multiplier}x</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {rate.multiplier === 1.5 && "Standard overtime rate"}
                      {rate.multiplier === 2.0 && "Double time for Saturday work"}
                      {rate.multiplier === 2.5 && "Premium rate for Sunday work"}
                      {rate.multiplier === 3.0 && "Triple time for public holidays"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={rate.isActive ? "default" : "secondary"}>
                        {rate.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </motion.div>
        </TabsContent>
      </Tabs>

      <OvertimeEntryModal open={showEntryModal} onOpenChange={setShowEntryModal} />
      <OvertimeApprovalModal 
        entry={selectedEntry} 
        open={showApprovalModal} 
        onOpenChange={setShowApprovalModal}
        onApprove={handleApprove}
        onReject={handleReject}
      />
      <OvertimeRatesModal open={showRatesModal} onOpenChange={setShowRatesModal} />
    </MainLayout>
  );
};

export default Overtime;
