import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { mockEmployees } from "@/data/mockEmployees";
import { leaveTypes, getLeaveBalances } from "@/data/mockLeave";
import { cn } from "@/lib/utils";

export function LeaveBalanceCard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");

  const filteredEmployees = useMemo(() => {
    return mockEmployees.filter((employee) => {
      if (employee.status !== "active") return false;
      
      const matchesSearch =
        searchQuery === "" ||
        `${employee.firstName} ${employee.lastName}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      
      const matchesEmployee =
        selectedEmployee === "all" || employee.id === selectedEmployee;
      
      return matchesSearch && matchesEmployee;
    });
  }, [searchQuery, selectedEmployee]);

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
            {mockEmployees
              .filter((e) => e.status === "active")
              .map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.firstName} {employee.lastName}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Employee Balance Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {filteredEmployees.map((employee, index) => {
          const balances = getLeaveBalances(employee.id);
          
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
                  {employee.firstName[0]}
                  {employee.lastName[0]}
                </div>
                <div>
                  <p className="font-semibold">
                    {employee.firstName} {employee.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {employee.designation} • {employee.department}
                  </p>
                </div>
              </div>

              {/* Leave Balances */}
              <div className="space-y-4">
                {leaveTypes.slice(0, 4).map((type) => {
                  const balance = balances.find((b) => b.leaveTypeId === type.id);
                  if (!balance) return null;
                  
                  const usedPercentage = (balance.taken / balance.entitled) * 100;
                  const isLow = balance.available <= 2;
                  
                  return (
                    <div key={type.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{type.name}</span>
                        <span className={cn(
                          "font-semibold",
                          isLow ? "text-warning" : "text-foreground"
                        )}>
                          {balance.available} / {balance.entitled} days
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
                        <span>Used: {balance.taken}</span>
                        {balance.pending > 0 && (
                          <span className="text-warning">Pending: {balance.pending}</span>
                        )}
                        {balance.carriedForward > 0 && (
                          <span>Carried: +{balance.carriedForward}</span>
                        )}
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
          <p className="text-muted-foreground">
            Try adjusting your search criteria
          </p>
        </div>
      )}
    </div>
  );
}
