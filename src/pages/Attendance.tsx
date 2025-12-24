import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Save,
  Loader2,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEmployees } from "@/hooks/useEmployees";
import { useAttendance, attendanceStatusConfig, AttendanceStatus } from "@/hooks/useAttendance";
import { cn } from "@/lib/utils";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function Attendance() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [editMode, setEditMode] = useState(false);
  const [attendanceChanges, setAttendanceChanges] = useState<Record<string, {
    status: AttendanceStatus;
    checkIn?: string;
    checkOut?: string;
    workedHours?: number;
  }>>({});

  const { employees, isLoading: employeesLoading } = useEmployees();
  const { attendance, isLoading: attendanceLoading, bulkCreateAttendance, isBulkCreating } = useAttendance(
    selectedMonth,
    selectedYear
  );

  const activeEmployees = useMemo(() => 
    employees.filter((e) => e.status === "active"),
    [employees]
  );

  // Get attendance for selected date
  const dateAttendance = useMemo(() => {
    const map: Record<string, typeof attendance[0]> = {};
    attendance.forEach((record) => {
      if (record.date === selectedDate) {
        map[record.employee_id] = record;
      }
    });
    return map;
  }, [attendance, selectedDate]);

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    const stats = {
      totalPresent: 0,
      totalAbsent: 0,
      totalHalfDays: 0,
      totalLeaves: 0,
      avgAttendanceRate: 0,
    };

    const employeeStats: Record<string, { present: number; total: number }> = {};
    
    attendance.forEach((record) => {
      if (!employeeStats[record.employee_id]) {
        employeeStats[record.employee_id] = { present: 0, total: 0 };
      }
      employeeStats[record.employee_id].total++;

      switch (record.status) {
        case "present":
          stats.totalPresent++;
          employeeStats[record.employee_id].present++;
          break;
        case "absent":
          stats.totalAbsent++;
          break;
        case "half_day":
          stats.totalHalfDays++;
          employeeStats[record.employee_id].present += 0.5;
          break;
        case "leave":
          stats.totalLeaves++;
          break;
      }
    });

    const rates = Object.values(employeeStats).map((s) => 
      s.total > 0 ? (s.present / s.total) * 100 : 0
    );
    stats.avgAttendanceRate = rates.length > 0 
      ? rates.reduce((a, b) => a + b, 0) / rates.length 
      : 0;

    return stats;
  }, [attendance]);

  const handleStatusChange = (employeeId: string, status: AttendanceStatus) => {
    setAttendanceChanges((prev) => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        status,
        workedHours: status === "present" ? 8 : status === "half_day" ? 4 : 0,
      },
    }));
  };

  const handleTimeChange = (
    employeeId: string,
    field: "checkIn" | "checkOut",
    value: string
  ) => {
    setAttendanceChanges((prev) => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: value,
      },
    }));
  };

  const handleSaveAttendance = () => {
    const records = Object.entries(attendanceChanges).map(([employeeId, data]) => ({
      employee_id: employeeId,
      date: selectedDate,
      status: data.status,
      check_in: data.checkIn || null,
      check_out: data.checkOut || null,
      worked_hours: data.workedHours || 0,
    }));

    if (records.length > 0) {
      bulkCreateAttendance(records);
      setAttendanceChanges({});
      setEditMode(false);
    }
  };

  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      if (selectedMonth === 1) {
        setSelectedMonth(12);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 12) {
        setSelectedMonth(1);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  const getEmployeeStatus = (employeeId: string): AttendanceStatus => {
    if (attendanceChanges[employeeId]) {
      return attendanceChanges[employeeId].status;
    }
    const record = dateAttendance[employeeId];
    return (record?.status as AttendanceStatus) || "absent";
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight lg:text-3xl">
              Time & Attendance
            </h1>
            <p className="text-muted-foreground">
              Track employee attendance and working hours
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth("prev")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {months[selectedMonth - 1]} {selectedYear}
              </span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Present Days</CardTitle>
                <CheckCircle className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{monthlyStats.totalPresent}</div>
                <p className="text-xs text-muted-foreground">This month</p>
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
                <CardTitle className="text-sm font-medium">Absent Days</CardTitle>
                <XCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{monthlyStats.totalAbsent}</div>
                <p className="text-xs text-muted-foreground">This month</p>
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
                <CardTitle className="text-sm font-medium">Half Days</CardTitle>
                <AlertCircle className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{monthlyStats.totalHalfDays}</div>
                <p className="text-xs text-muted-foreground">This month</p>
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
                <CardTitle className="text-sm font-medium">Avg. Attendance</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {monthlyStats.avgAttendanceRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="daily" className="space-y-4">
          <TabsList>
            <TabsTrigger value="daily">
              <Clock className="mr-2 h-4 w-4" />
              Daily Entry
            </TabsTrigger>
            <TabsTrigger value="monthly">
              <Calendar className="mr-2 h-4 w-4" />
              Monthly View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Daily Attendance</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Record attendance for a specific date
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label>Date:</Label>
                      <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-auto"
                      />
                    </div>
                    {editMode ? (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditMode(false);
                            setAttendanceChanges({});
                          }}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleSaveAttendance} disabled={isBulkCreating}>
                          {isBulkCreating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          Save
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={() => setEditMode(true)}>
                        Mark Attendance
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {employeesLoading || attendanceLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Status</TableHead>
                          {editMode && (
                            <>
                              <TableHead>Check In</TableHead>
                              <TableHead>Check Out</TableHead>
                            </>
                          )}
                          <TableHead>Worked Hours</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeEmployees.map((employee) => {
                          const status = getEmployeeStatus(employee.id);
                          const record = dateAttendance[employee.id];
                          const statusConfig = attendanceStatusConfig[status];

                          return (
                            <TableRow key={employee.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                    {employee.first_name?.[0]}
                                    {employee.last_name?.[0]}
                                  </div>
                                  <div>
                                    <p className="font-medium">
                                      {employee.first_name} {employee.last_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {employee.employee_number}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{employee.department || "-"}</TableCell>
                              <TableCell>
                                {editMode ? (
                                  <Select
                                    value={status}
                                    onValueChange={(value) =>
                                      handleStatusChange(employee.id, value as AttendanceStatus)
                                    }
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="present">Present</SelectItem>
                                      <SelectItem value="absent">Absent</SelectItem>
                                      <SelectItem value="half_day">Half Day</SelectItem>
                                      <SelectItem value="leave">On Leave</SelectItem>
                                      <SelectItem value="holiday">Holiday</SelectItem>
                                      <SelectItem value="weekend">Weekend</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className={cn(statusConfig?.color)}
                                  >
                                    {statusConfig?.label || status}
                                  </Badge>
                                )}
                              </TableCell>
                              {editMode && (
                                <>
                                  <TableCell>
                                    <Input
                                      type="time"
                                      className="w-28"
                                      defaultValue={record?.check_in?.slice(0, 5) || "09:00"}
                                      onChange={(e) =>
                                        handleTimeChange(employee.id, "checkIn", e.target.value)
                                      }
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="time"
                                      className="w-28"
                                      defaultValue={record?.check_out?.slice(0, 5) || "17:00"}
                                      onChange={(e) =>
                                        handleTimeChange(employee.id, "checkOut", e.target.value)
                                      }
                                    />
                                  </TableCell>
                                </>
                              )}
                              <TableCell>
                                {attendanceChanges[employee.id]?.workedHours ??
                                  record?.worked_hours ??
                                  "-"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="monthly">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Attendance Summary</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Overview of attendance for {months[selectedMonth - 1]} {selectedYear}
                  </p>
                </CardHeader>
                <CardContent>
                  {employeesLoading || attendanceLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead className="text-center">Present</TableHead>
                          <TableHead className="text-center">Absent</TableHead>
                          <TableHead className="text-center">Half Days</TableHead>
                          <TableHead className="text-center">Leaves</TableHead>
                          <TableHead className="text-center">Total Hours</TableHead>
                          <TableHead className="text-center">Attendance %</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeEmployees.map((employee) => {
                          const employeeRecords = attendance.filter(
                            (r) => r.employee_id === employee.id
                          );
                          const presentDays = employeeRecords.filter(
                            (r) => r.status === "present"
                          ).length;
                          const absentDays = employeeRecords.filter(
                            (r) => r.status === "absent"
                          ).length;
                          const halfDays = employeeRecords.filter(
                            (r) => r.status === "half_day"
                          ).length;
                          const leaves = employeeRecords.filter(
                            (r) => r.status === "leave"
                          ).length;
                          const totalHours = employeeRecords.reduce(
                            (sum, r) => sum + Number(r.worked_hours || 0),
                            0
                          );
                          const workingDays = presentDays + halfDays * 0.5;
                          const totalDays = presentDays + absentDays + halfDays + leaves;
                          const attendanceRate =
                            totalDays > 0 ? (workingDays / totalDays) * 100 : 0;

                          return (
                            <TableRow key={employee.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                    {employee.first_name?.[0]}
                                    {employee.last_name?.[0]}
                                  </div>
                                  <div>
                                    <p className="font-medium">
                                      {employee.first_name} {employee.last_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {employee.employee_number}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{employee.department || "-"}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="bg-success/15 text-success">
                                  {presentDays}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant="outline"
                                  className="bg-destructive/15 text-destructive"
                                >
                                  {absentDays}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="bg-warning/15 text-warning">
                                  {halfDays}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="bg-primary/15 text-primary">
                                  {leaves}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center font-medium">
                                {totalHours.toFixed(1)}
                              </TableCell>
                              <TableCell className="text-center">
                                <span
                                  className={cn(
                                    "font-semibold",
                                    attendanceRate >= 90
                                      ? "text-success"
                                      : attendanceRate >= 75
                                      ? "text-warning"
                                      : "text-destructive"
                                  )}
                                >
                                  {attendanceRate.toFixed(1)}%
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
