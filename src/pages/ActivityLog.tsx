import { useState } from "react";
import { format } from "date-fns";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotificationLogs, NotificationLog } from "@/hooks/useNotificationLogs";
import { Bell, Mail, CheckCircle, XCircle, Clock, SkipForward, Search, Filter } from "lucide-react";

const ActivityLog = () => {
  const { data: logs, isLoading } = useNotificationLogs();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" />Sent</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "skipped":
        return <Badge variant="outline"><SkipForward className="w-3 h-3 mr-1" />Skipped</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      leave: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      overtime: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      payroll: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    };
    return (
      <Badge className={colors[type] || "bg-muted text-muted-foreground"}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const filteredLogs = logs?.filter((log) => {
    const matchesSearch =
      search === "" ||
      log.subject.toLowerCase().includes(search.toLowerCase()) ||
      log.recipient_email.toLowerCase().includes(search.toLowerCase()) ||
      `${log.employee?.first_name || ""} ${log.employee?.last_name || ""}`.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = typeFilter === "all" || log.notification_type === typeFilter;
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: logs?.length || 0,
    sent: logs?.filter((l) => l.status === "sent").length || 0,
    failed: logs?.filter((l) => l.status === "failed").length || 0,
    skipped: logs?.filter((l) => l.status === "skipped").length || 0,
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground">
            View all email notifications sent to employees
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sent</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.failed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Skipped</CardTitle>
              <SkipForward className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">{stats.skipped}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by subject, email, or employee..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="leave">Leave</SelectItem>
                    <SelectItem value="overtime">Overtime</SelectItem>
                    <SelectItem value="payroll">Payroll</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="skipped">Skipped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredLogs && filteredLogs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(log.created_at), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {log.employee?.first_name} {log.employee?.last_name}
                        </div>
                        {log.employee?.employee_number && (
                          <div className="text-xs text-muted-foreground">
                            {log.employee.employee_number}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getTypeBadge(log.notification_type)}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={log.subject}>
                        {log.subject}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {log.recipient_email}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {log.sent_at
                          ? format(new Date(log.sent_at), "HH:mm:ss")
                          : log.status === "failed" && log.error_message
                          ? (
                            <span className="text-xs text-destructive" title={log.error_message}>
                              Error
                            </span>
                          )
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-12 text-center">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No notifications yet</h3>
                <p className="text-muted-foreground">
                  Email notifications will appear here when they are sent.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ActivityLog;
