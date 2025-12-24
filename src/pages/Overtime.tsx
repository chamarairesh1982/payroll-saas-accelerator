import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Clock, Plus, Search, Eye, Settings2, CheckCircle2, XCircle, AlertCircle, DollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useOvertimeEntries, useOvertimeRates, formatDayType, OvertimeEntry } from "@/hooks/useOvertime";
import { OvertimeEntryModal } from "@/components/overtime/OvertimeEntryModal";
import { OvertimeApprovalModal } from "@/components/overtime/OvertimeApprovalModal";
import { OvertimeRatesModal } from "@/components/overtime/OvertimeRatesModal";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  pending: { label: "Pending", variant: "outline", icon: <AlertCircle className="h-3 w-3" /> },
  approved: { label: "Approved", variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
  rejected: { label: "Rejected", variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
};

const Overtime = () => {
  const { overtimeEntries, stats, isLoading, approveOvertimeEntry, rejectOvertimeEntry, isApproving } = useOvertimeEntries();
  const { overtimeRates } = useOvertimeRates();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showRatesModal, setShowRatesModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<OvertimeEntry | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  const filteredEntries = useMemo(() => {
    return overtimeEntries.filter((entry) => {
      const fullName = `${entry.employee?.first_name || ""} ${entry.employee?.last_name || ""}`.toLowerCase();
      const matchesSearch =
        fullName.includes(searchQuery.toLowerCase()) ||
        (entry.employee?.employee_number || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || entry.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [overtimeEntries, searchQuery, statusFilter]);

  const pendingEntries = useMemo(() => overtimeEntries.filter((e) => e.status === "pending"), [overtimeEntries]);

  const handleReviewEntry = (entry: OvertimeEntry) => {
    setSelectedEntry(entry);
    setShowApprovalModal(true);
  };

  const handleApprove = (entryId: string) => {
    approveOvertimeEntry(entryId);
  };

  const handleReject = (entryId: string, reason: string) => {
    rejectOvertimeEntry(entryId);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

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
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              <Badge variant="destructive" className="ml-2 flex h-5 w-5 items-center justify-center p-0 text-xs">
                {pendingEntries.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rates">OT Rates</TabsTrigger>
        </TabsList>

        <TabsContent value="entries">
          {/* Filters */}
          <div className="mb-4 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-xl border bg-card shadow-sm">
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
                          <p className="font-medium">
                            {entry.employee?.first_name} {entry.employee?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{entry.employee?.employee_number || "N/A"}</p>
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(entry.date), "dd MMM yyyy")}</TableCell>
                      <TableCell className="text-center font-medium">{entry.hours}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {entry.overtime_rate?.name || "N/A"} ({entry.overtime_rate?.multiplier || 1}x)
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">LKR {Number(entry.calculated_amount).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[entry.status]?.variant || "outline"} className="gap-1">
                          {statusConfig[entry.status]?.icon}
                          {statusConfig[entry.status]?.label || entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.status === "pending" ? (
                          <Button variant="outline" size="sm" onClick={() => handleReviewEntry(entry)} disabled={isApproving}>
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-xl border bg-card shadow-sm">
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
                          <p className="font-medium">
                            {entry.employee?.first_name} {entry.employee?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{entry.employee?.department || "N/A"}</p>
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(entry.date), "dd MMM yyyy")}</TableCell>
                      <TableCell className="text-center font-medium">{entry.hours}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {entry.overtime_rate?.name || "N/A"} ({entry.overtime_rate?.multiplier || 1}x)
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">LKR {Number(entry.calculated_amount).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => handleReviewEntry(entry)} disabled={isApproving}>
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-xl border bg-card shadow-sm">
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
                {overtimeRates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Settings2 className="h-8 w-8 text-muted-foreground/50" />
                        <p className="text-muted-foreground">No overtime rates configured</p>
                        <Button variant="outline" size="sm" onClick={() => setShowRatesModal(true)}>
                          Configure Rates
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  overtimeRates.map((rate) => (
                    <TableRow key={rate.id}>
                      <TableCell className="font-medium">{rate.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{formatDayType(rate.day_type)}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-lg font-semibold text-primary">{rate.multiplier}x</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {Number(rate.multiplier) === 1.5 && "Standard overtime rate"}
                        {Number(rate.multiplier) === 2.0 && "Double time for Saturday work"}
                        {Number(rate.multiplier) === 2.5 && "Premium rate for Sunday work"}
                        {Number(rate.multiplier) === 3.0 && "Triple time for public holidays"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={rate.is_active ? "default" : "secondary"}>{rate.is_active ? "Active" : "Inactive"}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </motion.div>
        </TabsContent>
      </Tabs>

      <OvertimeEntryModal open={showEntryModal} onOpenChange={setShowEntryModal} />
      <OvertimeApprovalModal
        entry={
          selectedEntry
            ? ({
                id: selectedEntry.id,
                employeeId: selectedEntry.employee_id,
                employee: {
                  firstName: selectedEntry.employee?.first_name || "",
                  lastName: selectedEntry.employee?.last_name || "",
                  department: selectedEntry.employee?.department || "",
                  employeeNumber: selectedEntry.employee?.employee_number || "",
                } as any,
                date: new Date(selectedEntry.date),
                hours: Number(selectedEntry.hours),
                overtimeRateId: selectedEntry.overtime_rate_id,
                overtimeRate: {
                  name: selectedEntry.overtime_rate?.name || "",
                  multiplier: Number(selectedEntry.overtime_rate?.multiplier || 1),
                  dayType: selectedEntry.overtime_rate?.day_type || "weekday",
                } as any,
                calculatedAmount: Number(selectedEntry.calculated_amount),
                status: selectedEntry.status,
                createdAt: new Date(selectedEntry.created_at),
              } as any)
            : null
        }
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
