import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  Eye,
  Check,
  X,
  MoreHorizontal,
  Users,
  CalendarDays,
  CalendarCheck,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/dashboard/StatCard";
import { LeaveRequestModal } from "@/components/leave/LeaveRequestModal";
import { LeaveApprovalModal } from "@/components/leave/LeaveApprovalModal";
import { LeaveBalanceCard } from "@/components/leave/LeaveBalanceCard";
import { mockLeaveRequests, leaveTypes } from "@/data/mockLeave";
import { LeaveRequest } from "@/types/payroll";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const statusConfig = {
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-warning/15 text-warning border-warning/30",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle2,
    className: "bg-success/15 text-success border-success/30",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    className: "bg-muted text-muted-foreground border-muted",
  },
};

const Leave = () => {
  const { toast } = useToast();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [leaveRequests, setLeaveRequests] = useState(mockLeaveRequests);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const stats = useMemo(() => {
    const pending = leaveRequests.filter((r) => r.status === "pending").length;
    const approved = leaveRequests.filter((r) => r.status === "approved").length;
    const onLeaveToday = leaveRequests.filter(
      (r) =>
        r.status === "approved" &&
        new Date(r.startDate) <= new Date() &&
        new Date(r.endDate) >= new Date()
    ).length;
    const totalDays = leaveRequests
      .filter((r) => r.status === "approved")
      .reduce((sum, r) => sum + r.days, 0);

    return { pending, approved, onLeaveToday, totalDays };
  }, [leaveRequests]);

  const filteredRequests = useMemo(() => {
    return leaveRequests.filter((request) => {
      const matchesSearch =
        searchQuery === "" ||
        `${request.employee.firstName} ${request.employee.lastName}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || request.status === statusFilter;
      const matchesType =
        typeFilter === "all" || request.leaveTypeId === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [leaveRequests, searchQuery, statusFilter, typeFilter]);

  const handleApprove = (requestId: string) => {
    setLeaveRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: "approved" as const,
              approvedBy: "Admin User",
              approvedAt: new Date(),
              updatedAt: new Date(),
            }
          : r
      )
    );
    setSelectedRequest(null);
    toast({
      title: "Leave Approved",
      description: "The leave request has been approved successfully.",
    });
  };

  const handleReject = (requestId: string, reason: string) => {
    setLeaveRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: "rejected" as const,
              rejectionReason: reason,
              updatedAt: new Date(),
            }
          : r
      )
    );
    setSelectedRequest(null);
    toast({
      title: "Leave Rejected",
      description: "The leave request has been rejected.",
      variant: "destructive",
    });
  };

  return (
    <MainLayout>
      <AnimatePresence>
        {showRequestModal && (
          <LeaveRequestModal onClose={() => setShowRequestModal(false)} />
        )}
        {selectedRequest && (
          <LeaveApprovalModal
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Leave Management</h1>
          <p className="page-description">
            Manage leave requests, approvals, and track balances.
          </p>
        </div>
        <Button size="lg" onClick={() => setShowRequestModal(true)}>
          <Plus className="h-5 w-5" />
          Request Leave
        </Button>
      </div>

      {/* Stats */}
      <div className="card-grid mb-8">
        <StatCard
          title="Pending Requests"
          value={stats.pending}
          subtitle="Awaiting approval"
          icon={<Clock className="h-6 w-6" />}
          variant="warning"
          delay={0.1}
        />
        <StatCard
          title="Approved This Month"
          value={stats.approved}
          subtitle="December 2024"
          icon={<CheckCircle2 className="h-6 w-6" />}
          variant="success"
          delay={0.15}
        />
        <StatCard
          title="On Leave Today"
          value={stats.onLeaveToday}
          subtitle="Employees absent"
          icon={<Users className="h-6 w-6" />}
          variant="primary"
          delay={0.2}
        />
        <StatCard
          title="Leave Days Used"
          value={stats.totalDays}
          subtitle="This month"
          icon={<CalendarDays className="h-6 w-6" />}
          variant="accent"
          delay={0.25}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="requests">Leave Requests</TabsTrigger>
          <TabsTrigger value="balances">Leave Balances</TabsTrigger>
          <TabsTrigger value="types">Leave Types</TabsTrigger>
        </TabsList>

        {/* Leave Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 sm:flex-row sm:items-center"
          >
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by employee name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Leave Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {leaveTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>

          {/* Requests Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card shadow-sm overflow-hidden"
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold">Employee</TableHead>
                  <TableHead className="font-semibold">Leave Type</TableHead>
                  <TableHead className="font-semibold">Duration</TableHead>
                  <TableHead className="font-semibold">Days</TableHead>
                  <TableHead className="font-semibold">Reason</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request, index) => {
                  const StatusIcon = statusConfig[request.status].icon;
                  return (
                    <motion.tr
                      key={request.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index }}
                      className="group hover:bg-muted/30"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {request.employee.firstName[0]}
                            {request.employee.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium">
                              {request.employee.firstName} {request.employee.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {request.employee.department}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{request.leaveType.name}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>
                            {new Date(request.startDate).toLocaleDateString("en-LK", {
                              day: "numeric",
                              month: "short",
                            })}
                            {request.days > 1 && (
                              <>
                                {" - "}
                                {new Date(request.endDate).toLocaleDateString("en-LK", {
                                  day: "numeric",
                                  month: "short",
                                })}
                              </>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(request.startDate).getFullYear()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{request.days}</span>
                        <span className="text-muted-foreground"> day{request.days > 1 ? "s" : ""}</span>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="truncate text-sm text-muted-foreground">
                          {request.reason}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("gap-1", statusConfig[request.status].className)}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig[request.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {request.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-success hover:bg-success/10 hover:text-success"
                                onClick={() => handleApprove(request.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => setSelectedRequest(request)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
            {filteredRequests.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 font-medium text-muted-foreground">
                  No leave requests found
                </p>
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* Leave Balances Tab */}
        <TabsContent value="balances">
          <LeaveBalanceCard />
        </TabsContent>

        {/* Leave Types Tab */}
        <TabsContent value="types" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {leaveTypes.map((type, index) => (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                className="rounded-xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="mb-4 flex items-center justify-between">
                  <Badge variant="secondary" className="text-lg font-bold">
                    {type.code}
                  </Badge>
                  <Badge variant={type.isPaid ? "default" : "outline"}>
                    {type.isPaid ? "Paid" : "Unpaid"}
                  </Badge>
                </div>
                <h3 className="font-display text-lg font-semibold">{type.name}</h3>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Days Per Year</span>
                    <span className="font-medium">{type.daysPerYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Carry Forward</span>
                    <span className="font-medium">
                      {type.isCarryForward ? `Up to ${type.maxCarryForward} days` : "No"}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default Leave;
