import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, User, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useEmployees } from "@/hooks/useEmployees";
import { useLeaveRequests, useLeaveTypes } from "@/hooks/useLeave";

const currentYear = new Date().getFullYear();

export function LeaveBalanceCard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");

  const { employees, isLoading: isLoadingEmployees } = useEmployees();
  const { leaveTypes, isLoading: isLoadingTypes } = useLeaveTypes();
  const { leaveRequests, isLoading: isLoadingRequests } = useLeaveRequests();

  const isLoading = isLoadingEmployees || isLoadingTypes || isLoadingRequests;

  const activeEmployees = useMemo(
    () => employees.filter((e) => e.status === "active"),
    [employees]
  );

  const filteredEmployees = useMemo(() => {
    return activeEmployees.filter((employee) => {
      const fullName = `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim();
      const matchesSearch =
        searchQuery === "" || fullName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesEmployee = selectedEmployee === "all" || employee.id === selectedEmployee;
      return matchesSearch && matchesEmployee;
    });
  }, [activeEmployees, searchQuery, selectedEmployee]);

  const balancesByEmployee = useMemo(() => {
    const map = new Map<
      string,
      Array<{
        leaveTypeId: string;
        leaveTypeName: string;
        entitled: number;
        taken: number;
        pending: number;
        available: number;
      }>
    >();

    for (const emp of filteredEmployees) {
      const list = leaveTypes.map((lt) => {
        const requests = leaveRequests.filter(
          (r) =>
            r.employee_id === emp.id &&
            r.leave_type_id === lt.id &&
            new Date(r.start_date).getFullYear() === currentYear
        );

        const taken = requests
          .filter((r) => r.status === "approved")
          .reduce((sum, r) => sum + Number(r.days), 0);

        const pending = requests
          .filter((r) => r.status === "pending")
          .reduce((sum, r) => sum + Number(r.days), 0);

        const entitled = Number(lt.days_per_year ?? 0);
        const available = Math.max(0, entitled - taken - pending);

        return {
          leaveTypeId: lt.id,
          leaveTypeName: lt.name,
          entitled,
          taken,
          pending,
          available,
        };
      });

      map.set(emp.id, list);
    }

    return map;
  }, [filteredEmployees, leaveTypes, leaveRequests]);

  if (isLoading) {
    return (
      <div className="flex h-[30vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (leaveTypes.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="font-medium">No leave types configured</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add leave types first to see employee balances.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center"
      >
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
          <SelectTrigger className="w-full sm:w-[250px]">
            <SelectValue placeholder="Filter by employee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            {activeEmployees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.first_name} {employee.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Employee Balance Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {filteredEmployees.map((employee, index) => {
          const balances = balancesByEmployee.get(employee.id) ?? [];

          return (
            <motion.div
              key={employee.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
              className="rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              {/* Employee Header */}
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                  {(employee.first_name || "?")[0]}
                  {(employee.last_name || "?")[0]}
                </div>
                <div>
                  <p className="font-semibold">
                    {employee.first_name} {employee.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {employee.designation || "N/A"} • {employee.department || "N/A"}
                  </p>
                </div>
              </div>

              {/* Leave Balances */}
              <div className="space-y-4">
                {balances.map((b) => {
                  const usedPercentage = b.entitled > 0 ? (b.taken / b.entitled) * 100 : 0;
                  const isLow = b.available <= 2;

                  return (
                    <div key={b.leaveTypeId} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{b.leaveTypeName}</span>
                        <span
                          className={cn(
                            "font-semibold",
                            isLow ? "text-warning" : "text-foreground"
                          )}
                        >
                          {b.available} / {b.entitled} days
                        </span>
                      </div>
                      <Progress
                        value={usedPercentage}
                        className={cn(
                          "h-2",
                          usedPercentage > 80 ? "[&>div]:bg-warning" : "[&>div]:bg-primary"
                        )}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Used: {b.taken}</span>
                        {b.pending > 0 && <span className="text-warning">Pending: {b.pending}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl bg-card py-20 shadow-sm">
          <User className="h-16 w-16 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No Employees Found</h3>
          <p className="text-muted-foreground">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );
}
